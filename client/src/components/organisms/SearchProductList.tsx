"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useProducts } from "@/hooks/useProducts";
import SimpleProductGrid from "./SimpleProductGrid";
import Sidebar from "./Sidebar";
import MobileSidebar from "./MobileSidebar";
import MobileCategoriesButton from "../atoms/MobileCategoriesButton";

const SearchProductList = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { 
    searchResults,
    searchPagination,
    searchLoading, 
    searchError, 
    searchProducts,
    clearSearchResults,
    searchProductsByPage
  } = useProducts();

  // Estado local para filtros
  const [filters] = useState({
    inStock: true,
    limit: 12, // Productos por página
  });

  // Obtener query desde la URL
  const query = searchParams.get('q') || '';

  // Función para obtener la página inicial desde la URL
  const getInitialPage = useCallback(() => {
    const pageParam = searchParams.get('page');
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    return isNaN(page) || page < 1 ? 1 : page;
  }, [searchParams]);

  // Reset y búsqueda inicial cuando cambia el query
  useEffect(() => {
    if (query.trim()) {
      clearSearchResults();
      const initialPage = getInitialPage();
      searchProducts(query, initialPage, filters.limit, filters.inStock);
    } else {
      clearSearchResults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, getInitialPage]);

  // Manejar cambios en la página de la URL (e.g., botones atrás/adelante del navegador)
  useEffect(() => {
    if (!query.trim()) return;

    const urlPage = getInitialPage();
    const currentPage = searchPagination?.currentPage || 1;
    const totalPages = searchPagination?.totalPages || 1;
    
    // Validar que la página en la URL sea válida (solo si no estamos cargando)
    if (!searchLoading && urlPage > totalPages && totalPages > 0) {
      // Si la página es mayor que el total, redirigir a página 1
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set('page', '1');
      router.replace(`?${newSearchParams.toString()}`, { scroll: false });
      return;
    }
    
    // Si la página en la URL es diferente a la actual en el estado, recargar
    if (urlPage !== currentPage && !searchLoading) {
      searchProductsByPage(query, urlPage, {
        limit: filters.limit,
        inStock: filters.inStock
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, query, searchPagination?.totalPages, searchLoading]);

  // Función para manejar cambio de página
  const handlePageChange = useCallback((pageNumber: number) => {
    if (!query.trim()) return;

    // Scroll hacia arriba inmediatamente cuando cambie de página
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    // Actualizar la URL con el nuevo parámetro de página
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('page', pageNumber.toString());
    router.replace(`?${newSearchParams.toString()}`, { scroll: false });
    
    // Buscar productos de la nueva página
    searchProductsByPage(query, pageNumber, {
      limit: filters.limit,
      inStock: filters.inStock
    });
  }, [query, filters, searchProductsByPage, searchParams, router]);

  // Si no hay query, mostrar mensaje
  if (!query.trim()) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-4">
          <MobileCategoriesButton />
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">Búsqueda de productos</h3>
            <p className="text-gray-600">
              Ingresa un término de búsqueda para comenzar
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (searchError) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-4">
          <MobileCategoriesButton />
          <div className="text-center py-16">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold mb-2 text-red-600">Error al buscar productos</h3>
            <p className="text-gray-600 mb-4">{searchError}</p>
            <button 
              className="btn btn-primary"
              onClick={() => {
                clearSearchResults();
                searchProducts(query, 1, filters.limit, filters.inStock);
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
          
          {/* Título de búsqueda */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#222222] mb-2">
              Resultados de búsqueda
            </h1>
            <p className="text-gray-600">
              Mostrando resultados para: <span className="font-semibold">&quot;{query}&quot;</span>
            </p>
          </div>

          <SimpleProductGrid
            products={searchResults}
            loading={searchLoading}
            totalCount={searchPagination?.totalCount || 0}
            totalPages={searchPagination?.totalPages || 0}
            currentPage={searchPagination?.currentPage || 1}
            hasNextPage={searchPagination?.hasNextPage || false}
            hasPreviousPage={searchPagination?.hasPreviousPage || false}
            onPageChange={handlePageChange}
            className="min-h-screen"
          />
        </div>
      </div>
    </>
  );
};

export default SearchProductList;
