import { useCallback, useEffect, useRef } from 'react';
import { debounce } from '@/utils/debounce';

interface UseInfiniteScrollOptions {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void | Promise<void>;
  threshold?: number; // distancia en pixels desde el bottom para trigger
  debounceMs?: number;
}

export const useInfiniteScroll = <T extends HTMLElement = HTMLDivElement>({
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 200,
  debounceMs = 200,
}: UseInfiniteScrollOptions) => {
  const lastElementRef = useRef<T | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Crear versión debounced de onLoadMore
  const debouncedLoadMore = useCallback(() => {
    const debouncedFn = debounce(async () => {
      if (hasMore && !isLoading) {
        await onLoadMore();
      }
    }, debounceMs);
    
    return debouncedFn();
  }, [hasMore, isLoading, onLoadMore, debounceMs]);

  // Callback para cuando el último elemento es visible
  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoading) {
        debouncedLoadMore();
      }
    },
    [hasMore, isLoading, debouncedLoadMore]
  );

  // Configurar observer
  useEffect(() => {
    if (!lastElementRef.current) return;

    // Limpiar observer previo
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Crear nuevo observer
    observerRef.current = new IntersectionObserver(handleIntersection, {
      rootMargin: `${threshold}px`,
      threshold: 0.1,
    });

    // Observar el último elemento
    observerRef.current.observe(lastElementRef.current);

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersection, threshold]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return { lastElementRef };
};
