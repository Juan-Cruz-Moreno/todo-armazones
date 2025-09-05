"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import { useProducts } from "@/hooks/useProducts";
import ProductCard from "@/components/molecules/ProductCard";
import Sidebar from "./Sidebar";
import MobileSidebar from "./MobileSidebar";
import MobileCategoriesButton from "../atoms/MobileCategoriesButton";
import SkeletonProductCard from "../molecules/SkeletonProductCard";
import LoadingSpinner from "../atoms/LoadingSpinner";
import { debounce } from "@/utils/debounce";

interface ProductListProps {
  categorySlug?: string;
  subcategorySlug?: string;
}

const SKELETON_COUNT = 8; // Cantidad de productos a mostrar como esqueleto

const ProductList = ({ categorySlug, subcategorySlug }: ProductListProps) => {
  const { products, nextCursor, loading, error, fetchProducts } = useProducts();

  const observer = useRef<IntersectionObserver | null>(null);

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

  const lastProductRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new window.IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && nextCursor) {
          loadMore();
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, nextCursor, loadMore]
  );

  // Reset products on category/subcategory change
  useEffect(() => {
    fetchProducts({ categorySlug, subcategorySlug, inStock: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug, subcategorySlug]);

  if (loading && products.length === 0)
    return (
      <>
        <MobileSidebar />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 p-4">
            <MobileCategoriesButton />
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-0">
              {Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
                <SkeletonProductCard key={idx} />
              ))}
            </div>
          </div>
        </div>
      </>
    );

  if (error) return <p className="text-center text-red-500">Error: {error}</p>;

  return (
    <>
      <MobileSidebar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-4">
          <MobileCategoriesButton />
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-0">
            {products.map((product, idx) => {
              if (idx === products.length - 1) {
                return (
                  <div ref={lastProductRef} key={product.id}>
                    <ProductCard {...product} />
                  </div>
                );
              }
              return <ProductCard key={product.id} {...product} />;
            })}
          </div>
          {loading && products.length > 0 && (
            <div className="flex justify-center py-4 text-[#888888]">
              <LoadingSpinner />
            </div>
          )}
          {!nextCursor && !loading && products.length > 0 && (
            <p className="text-center py-4 text-gray-400">
              No hay más productos.
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default ProductList;
