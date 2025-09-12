"use client";

import { useEffect, useCallback, useMemo } from "react";
import { useProducts } from "@/hooks/useProducts";
import VirtualizedProductGrid from "./VirtualizedProductGrid";
import Sidebar from "./Sidebar";
import MobileSidebar from "./MobileSidebar";
import MobileCategoriesButton from "../atoms/MobileCategoriesButton";
import { debounce } from "@/utils/debounce";

interface ProductListProps {
  categorySlug?: string;
  subcategorySlug?: string;
}

const ProductList = ({ categorySlug, subcategorySlug }: ProductListProps) => {
  const { products, nextCursor, loading, error, fetchProducts } = useProducts();

  // Debounced fetchProducts para scroll infinito
  const debouncedFetch = useMemo(
    () =>
      debounce(
        (params: {
          categorySlug?: string;
          subcategorySlug?: string;
          cursor?: string;
          inStock?: boolean;
        }) => {
          fetchProducts(params);
        },
        200 // ms debounce
      ),
    [fetchProducts]
  );

  const loadMore = useCallback(() => {
    if (nextCursor) {
      debouncedFetch({
        categorySlug,
        subcategorySlug,
        cursor: nextCursor,
        inStock: true, // Mantener filtro de stock en paginación
      });
    }
  }, [debouncedFetch, categorySlug, subcategorySlug, nextCursor]);

  // Reset products on category/subcategory change
  useEffect(() => {
    fetchProducts({ categorySlug, subcategorySlug, inStock: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug, subcategorySlug]);

  if (error) return <p className="text-center text-red-500">Error: {error}</p>;

  return (
    <>
      <MobileSidebar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-4">
          <MobileCategoriesButton />
          <VirtualizedProductGrid
            products={products}
            loading={loading}
            hasNextPage={!!nextCursor}
            onLoadMore={loadMore}
          />
        </div>
      </div>
    </>
  );
};

export default ProductList;
