import { useEffect, useRef, useState } from 'react';
import { useCatalogStore } from '../store/catalogStore';
import type { Product } from '../types';

const SUGGESTION_PAGE_SIZE = 12;

export function useProductSearchSuggestions(query: string) {
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);
  const searchProducts = useCatalogStore((s) => s.searchProducts);

  const trimmed = query.trim();
  const hasQuery = trimmed.length >= 2;

  useEffect(() => {
    if (!hasQuery) {
      setSuggestions([]);
      setLoading(false);
      return undefined;
    }

    const requestId = ++requestIdRef.current;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const result = await searchProducts(trimmed, 0);
        if (cancelled || requestId !== requestIdRef.current) return;
        setSuggestions(result.products.slice(0, SUGGESTION_PAGE_SIZE));
      } catch {
        if (cancelled || requestId !== requestIdRef.current) return;
        setSuggestions([]);
      } finally {
        if (!cancelled && requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasQuery, searchProducts, trimmed]);

  return {
    suggestions,
    loading,
    hasQuery,
  };
}
