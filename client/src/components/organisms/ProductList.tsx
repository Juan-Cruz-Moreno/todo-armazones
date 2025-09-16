"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useProducts } from "@/hooks/useProducts";
import SimpleProductGrid from "./SimpleProductGrid";
import Sidebar from "./Sidebar";
import MobileSidebar from "./MobileSidebar";
import MobileCategoriesButton from "../atoms/MobileCategoriesButton";

interface ProductListProps {
  categorySlug?: string;
  subcategorySlug?: string;
}

const ProductList = ({ categorySlug, subcategorySlug }: ProductListProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { 
    products, 
    pagination,
    loading, 
    error, 
    fetchProductsByPage,
    resetPagination,
    loadPageByNumber 
  } = useProducts();

  // Estado local para filtros
  const [filters] = useState({
    inStock: true,
    limit: 12, // Productos por página
  });

  // Función para obtener la página inicial desde la URL
  const getInitialPage = useCallback(() => {
    const pageParam = searchParams.get('page');
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    return isNaN(page) || page < 1 ? 1 : page;
  }, [searchParams]);

  // Reset products on category/subcategory change
  useEffect(() => {
    resetPagination();
    const initialPage = getInitialPage();
    fetchProductsByPage({ 
      page: initialPage,
      categorySlug, 
      subcategorySlug, 
      ...filters
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug, subcategorySlug, getInitialPage]);

  // Manejar cambios en la página de la URL (e.g., botones atrás/adelante del navegador)
  useEffect(() => {
    const urlPage = getInitialPage();
    const currentPage = pagination?.currentPage || 1;
    const totalPages = pagination?.totalPages || 1;
    
    // Validar que la página en la URL sea válida (solo si no estamos cargando)
    if (!loading && urlPage > totalPages) {
      // Si la página es mayor que el total, redirigir a página 1
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set('page', '1');
      router.replace(`?${newSearchParams.toString()}`, { scroll: false });
      return;
    }
    
    // Si la página en la URL es diferente a la actual en el estado, recargar
    if (urlPage !== currentPage && !loading) {
      loadPageByNumber(urlPage, {
        categorySlug,
        subcategorySlug,
        ...filters
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, categorySlug, subcategorySlug, pagination?.totalPages, loading]);

  // Función para manejar cambio de página
  const handlePageChange = useCallback((pageNumber: number) => {
    // Scroll hacia arriba inmediatamente cuando cambie de página
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    // Actualizar la URL con el nuevo parámetro de página
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('page', pageNumber.toString());
    router.replace(`?${newSearchParams.toString()}`, { scroll: false });
    
    // Usar el nuevo método de navegación por páginas
    loadPageByNumber(pageNumber, {
      categorySlug,
      subcategorySlug,
      ...filters
    });
  }, [categorySlug, subcategorySlug, filters, loadPageByNumber, searchParams, router]);

  if (error) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-4">
          <MobileCategoriesButton />
          <div className="text-center py-16">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold mb-2 text-red-600">Error al cargar productos</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              className="btn btn-primary"
              onClick={() => {
                resetPagination();
                fetchProductsByPage({ page: 1, categorySlug, subcategorySlug, ...filters });
              }}
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <MobileSidebar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-4 overflow-x-hidden">
          <MobileCategoriesButton />
          <SimpleProductGrid
            products={products}
            loading={loading}
            totalCount={pagination?.totalCount || 0}
            totalPages={pagination?.totalPages || 0}
            currentPage={pagination?.currentPage || 1}
            hasNextPage={pagination?.hasNextPage || false}
            hasPreviousPage={pagination?.hasPreviousPage || false}
            onPageChange={handlePageChange}
            className="min-h-screen"
          />
        </div>
      </div>
    </>
  );
};

export default ProductList;
