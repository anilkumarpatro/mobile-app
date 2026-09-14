import { create } from 'zustand';

type ToastTone = 'success' | 'error' | 'info';

type Toast = {
  id: string;
  message: string;
  tone: ToastTone;
};

type UiState = {
  toasts: Toast[];
  toast: (message: string, tone?: ToastTone, ttl?: number) => void;
  dismissToast: (id: string) => void;
};

let toastCounter = 0;

export const useUiStore = create<UiState>((set, get) => ({
  toasts: [],

  toast: (message, tone = 'info', ttl = 3500) => {
    const id = `toast-${++toastCounter}`;
    set((state) => ({ toasts: [...state.toasts, { id, message, tone }] }));
    if (ttl > 0) {
      setTimeout(() => get().dismissToast(id), ttl);
    }
  },

  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));

export const toast = {
  success: (message: string) => useUiStore.getState().toast(message, 'success'),
  error: (message: string) => useUiStore.getState().toast(message, 'error', 5000),
  info: (message: string) => useUiStore.getState().toast(message, 'info'),
};
