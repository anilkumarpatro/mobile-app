import { create } from 'zustand';

import {

  addCartItem,

  deleteCartItem,

  fetchMyCart,

  parseCartPayload,

  resolveCartItemId,

  updateCartItem,

} from '../services/cart.service';

import {

  formatLooseCartSummary,

  getCartLineSubtotal,

  productAllowsLoose,

} from '../utils/looseQuantity';

import { toast } from './uiStore';

import type { CartItem, Product } from '../types';



type LooseAddPayload = {

  loose: true;

  fullPackQty: number;

  looseUnitQty: number;

  totalUnits: number;

};



type CartState = {

  items: CartItem[];

  cartTotal: number | null;

  subtotal: number | null;

  isLoading: boolean;

  error: string | null;

  loadCart: () => Promise<void>;

  addItem: (product: Product, qtyOrLoose?: number | LooseAddPayload) => Promise<void>;

  setQty: (productId: string, qty: number) => Promise<void>;

  setLooseQty: (

    productId: string,

    payload: { fullPackQty: number; looseUnitQty: number; totalUnits: number },

  ) => Promise<void>;

  removeItem: (productId: string) => Promise<void>;

  getSubtotal: () => number;

  getLineCount: () => number;

  getItemCount: () => number;

  findCartItem: (productId: string) => CartItem | undefined;

};



function buildLocalItem(product: Product, qty: number, cartItemId: string | null = null, looseMeta?: LooseAddPayload) {

  const base: CartItem = {

    id: String(product.id),

    cartItemId,

    name: product.name,

    genericName: product.brand ?? '',

    price: product.price,

    mrp: product.mrp ?? product.price,

    qty,

    pack: product.pack ?? '',

    rx: !!product.rx,

    image: product.imageUrl ?? null,

    unitsPerPack: product.unitsPerPack ?? 1,

    packLabel: product.packLabel,

    unitLabel: product.unitLabel,

    looseSaleAllowed: productAllowsLoose(product),

    packBased: productAllowsLoose(product),

  };



  if (looseMeta) {

    return {

      ...base,

      looseSaleAllowed: true,

      looseQuantity: true,

      packBased: true,

      fullPackQty: looseMeta.fullPackQty,

      looseUnitQty: looseMeta.looseUnitQty,

      qty: looseMeta.totalUnits,

    };

  }



  return { ...base, fullPackQty: qty, packBased: true };

}



async function refreshCartFromServer(set: (fn: (state: CartState) => Partial<CartState>) => void, get: () => CartState) {

  const payload = await fetchMyCart();

  const parsed = parseCartPayload(payload);

  set(() => ({ items: parsed.items, cartTotal: parsed.cartTotal, subtotal: parsed.subtotal }));

  return get().items;

}



export const useCartStore = create<CartState>((set, get) => ({

  items: [],

  cartTotal: null,

  subtotal: null,

  isLoading: false,

  error: null,



  loadCart: async () => {

    set({ isLoading: true, error: null });

    try {

      const payload = await fetchMyCart();

      const parsed = parseCartPayload(payload);

      set({ items: parsed.items, cartTotal: parsed.cartTotal, subtotal: parsed.subtotal, isLoading: false });

    } catch (error) {

      set({

        items: [],

        cartTotal: null,

        subtotal: null,

        error: error instanceof Error ? error.message : 'Failed to load cart',

        isLoading: false,

      });

    }

  },



  findCartItem: (productId) => get().items.find((item) => String(item.id) === String(productId)),



  addItem: async (product, qtyOrLoose = 1) => {

    const productId = String(product.id);

    const existing = get().findCartItem(productId);

    const isLooseAdd = typeof qtyOrLoose === 'object' && qtyOrLoose.loose === true;



    if (isLooseAdd) {

      const { fullPackQty, looseUnitQty, totalUnits } = qtyOrLoose;

      if (!totalUnits) {

        if (existing) await get().removeItem(productId);

        return;

      }



      const previousItems = get().items;

      const looseMeta = { loose: true as const, fullPackQty, looseUnitQty, totalUnits };

      const nextItems = existing

        ? previousItems.map((item) =>

            String(item.id) === productId

              ? buildLocalItem(product, totalUnits, item.cartItemId, looseMeta)

              : item,

          )

        : [...previousItems, buildLocalItem(product, totalUnits, null, looseMeta)];



      set({ items: nextItems, isLoading: true, error: null, subtotal: null, cartTotal: null });



      try {

        let cartItemId = existing?.cartItemId ?? null;



        if (existing?.cartItemId) {

          await updateCartItem(existing.cartItemId, {

            packQuantity: fullPackQty,

            looseQuantity: looseUnitQty,

          });

        } else {

          const response = await addCartItem({

            productId: product.id,

            price: product.price,

            packQuantity: fullPackQty,

            looseQuantity: looseUnitQty,

          });

          const resolved = await resolveCartItemId(productId, response);

          cartItemId = resolved.cartItemId || null;

        }



        if (!cartItemId) {

          throw new Error('Cart item id missing from server response');

        }



        await refreshCartFromServer(set, get);

        const summary = formatLooseCartSummary(get().findCartItem(productId)!);

        toast.success(

          summary?.long ? `${product.name} added to your cart — ${summary.long}` : `${product.name} added to your cart.`,

        );

      } catch (error) {

        set({ items: previousItems, isLoading: false });

        toast.error(error instanceof Error ? error.message : 'Could not add item to cart');

        throw error;

      } finally {

        set({ isLoading: false });

      }

      return;

    }



    const qty = Number(qtyOrLoose) || 1;

    if (existing && !existing.looseQuantity) {

      await get().setQty(productId, existing.qty + qty);

      return;

    }



    const previousItems = get().items;

    set({ items: [...previousItems, buildLocalItem(product, qty)], isLoading: true, error: null, subtotal: null, cartTotal: null });



    try {

      const response = await addCartItem({

        productId: product.id,

        quantity: qty,

        price: product.price,

      });

      const resolved = await resolveCartItemId(productId, response);



      if (!resolved.cartItemId) {

        throw new Error('Cart item id missing from server response');

      }



      await refreshCartFromServer(set, get);

      toast.success(`${product.name} added to your cart.`);

    } catch (error) {

      set({ items: previousItems, isLoading: false });

      toast.error(error instanceof Error ? error.message : 'Could not add item to cart');

      throw error;

    } finally {

      set({ isLoading: false });

    }

  },



  setQty: async (productId, qty) => {

    const item = get().findCartItem(productId);

    if (!item || item.looseQuantity) return;



    const previousItems = get().items;

    const nextQty = qty;



    set({

      items:

        nextQty <= 0

          ? previousItems.filter((entry) => String(entry.id) !== String(productId))

          : previousItems.map((entry) =>

              String(entry.id) === String(productId)
                ? { ...entry, qty: nextQty, fullPackQty: nextQty, lineTotal: undefined }
                : entry,

            ),

      isLoading: true,

      error: null,

      subtotal: null,

      cartTotal: null,

    });



    try {

      let cartItemId = item.cartItemId;

      if (!cartItemId) {

        const resolved = await resolveCartItemId(productId);

        cartItemId = resolved.cartItemId || null;

      }



      if (!cartItemId) {

        throw new Error('Cart item id missing — could not update quantity');

      }



      if (nextQty <= 0) {

        await deleteCartItem(cartItemId);

        await refreshCartFromServer(set, get);

        toast.info(`${item.name} removed from cart.`);

        return;

      }



      const updatePayload = item.packBased

        ? { packQuantity: nextQty, looseQuantity: 0 }

        : { quantity: nextQty };



      await updateCartItem(cartItemId, updatePayload);

      await refreshCartFromServer(set, get);

    } catch (error) {

      set({ items: previousItems, isLoading: false });

      toast.error(error instanceof Error ? error.message : 'Could not update cart quantity');

      throw error;

    } finally {

      set({ isLoading: false });

    }

  },



  setLooseQty: async (productId, payload) => {

    const item = get().findCartItem(productId);

    if (!item) return;



    await get().addItem(

      {

        id: item.id,

        name: item.name,

        brand: item.genericName,

        cat: '',

        catName: '',

        pack: item.pack,

        desc: '',

        price: item.price,

        mrp: item.mrp,

        off: 0,

        stock: 999,

        rx: item.rx,

        looseSaleAllowed: true,

        looseQuantity: true,

        unitsPerPack: item.unitsPerPack,

        packLabel: item.packLabel,

        unitLabel: item.unitLabel,

      },

      { loose: true, ...payload },

    );

  },



  removeItem: async (productId) => {

    const item = get().findCartItem(productId);

    if (!item) return;



    let cartItemId = item.cartItemId;

    if (!cartItemId) {

      const resolved = await resolveCartItemId(productId);

      cartItemId = resolved.cartItemId || null;

    }



    if (!cartItemId) {

      toast.error('Could not remove item — cart line id missing.');

      return;

    }



    const previousItems = get().items;

    set({
      items: previousItems.filter((entry) => String(entry.id) !== String(productId)),
      isLoading: true,
      subtotal: null,
      cartTotal: null,
    });



    try {

      await deleteCartItem(cartItemId);

      await refreshCartFromServer(set, get);

      toast.info(`${item.name} removed from cart.`);

    } catch (error) {

      set({ items: previousItems, isLoading: false });

      toast.error(error instanceof Error ? error.message : 'Could not remove item from cart');

      throw error;

    } finally {

      set({ isLoading: false });

    }

  },



  getSubtotal: () => {

    const { items } = get();

    return items.reduce((sum, item) => sum + getCartLineSubtotal(item), 0);

  },



  getLineCount: () => get().items.length,



  getItemCount: () => get().items.reduce((sum, item) => sum + (item.qty || 0), 0),

}));

