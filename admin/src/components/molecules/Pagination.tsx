"use client";

import { useMemo } from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
  className?: string;
}

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  loading = false,
  className = ""
}: PaginationProps) => {
  // Calcular qué páginas mostrar
  const pageNumbers = useMemo(() => {
    const maxVisiblePages = 5;
    const pages: number[] = [];

    if (totalPages <= maxVisiblePages) {
      // Si hay pocas páginas, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Lógica para mostrar páginas alrededor de la actual
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);

      // Ajustar para siempre mostrar 5 páginas cuando sea posible
      if (endPage - startPage < maxVisiblePages - 1) {
        if (startPage === 1) {
          endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        } else if (endPage === totalPages) {
          startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  }, [currentPage, totalPages]);

  const handlePageClick = (page: number) => {
    if (page !== currentPage && !loading && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1 && !loading) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages && !loading) {
      onPageChange(currentPage + 1);
    }
  };

  // No mostrar paginación si solo hay una página o ninguna
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* Información de página actual */}
      <div className="text-sm text-[#666666]">
        Página {currentPage} de {totalPages}
      </div>

      {/* Componente de paginación principal con wrap para mobile */}
      <div className="flex flex-wrap justify-center gap-1">
        {/* Botón Previous */}
        <button
          className={`btn shadow-none ${
            currentPage === 1 || loading
              ? "btn-disabled cursor-not-allowed"
              : "bg-[#ffffff] text-[#222222] border border-[#e1e1e1] hover:bg-gray-50"
          }`}
          onClick={handlePrevious}
          disabled={currentPage === 1 || loading}
          aria-label="Página anterior"
        >
          «
        </button>

        {/* Mostrar primera página y ellipsis si es necesario */}
        {pageNumbers[0] > 1 && (
          <>
            <button
              className={`btn shadow-none ${
                1 === currentPage
                  ? "bg-[#222222] text-white border-[#222222]"
                  : loading
                  ? "btn-disabled"
                  : "bg-[#ffffff] text-[#222222] border border-[#e1e1e1] hover:bg-gray-50"
              }`}
              onClick={() => handlePageClick(1)}
              disabled={loading}
            >
              1
            </button>
            {pageNumbers[0] > 2 && (
              <button
                className="btn shadow-none bg-[#ffffff] text-gray-400 border border-[#e1e1e1] cursor-default"
                disabled
              >
                ...
              </button>
            )}
          </>
        )}

        {/* Páginas numeradas */}
        {pageNumbers.map((page) => (
          <button
            key={page}
            className={`btn shadow-none ${
              page === currentPage
                ? "bg-[#222222] text-white border-[#222222]"
                : loading
                ? "btn-disabled"
                : "bg-[#ffffff] text-[#222222] border border-[#e1e1e1] hover:bg-gray-50"
            }`}
            onClick={() => handlePageClick(page)}
            disabled={loading}
            aria-label={`Página ${page}`}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </button>
        ))}

        {/* Mostrar ellipsis y última página si es necesario */}
        {pageNumbers[pageNumbers.length - 1] < totalPages && (
          <>
            {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
              <button
                className="btn shadow-none bg-[#ffffff] text-gray-400 border border-[#e1e1e1] cursor-default"
                disabled
              >
                ...
              </button>
            )}
            <button
              className={`btn shadow-none ${
                totalPages === currentPage
                  ? "bg-[#222222] text-white border-[#222222]"
                  : loading
                  ? "btn-disabled"
                  : "bg-[#ffffff] text-[#222222] border border-[#e1e1e1] hover:bg-gray-50"
              }`}
              onClick={() => handlePageClick(totalPages)}
              disabled={loading}
            >
              {totalPages}
            </button>
          </>
        )}

        {/* Botón Next */}
        <button
          className={`btn shadow-none ${
            currentPage === totalPages || loading
              ? "btn-disabled cursor-not-allowed"
              : "bg-[#ffffff] text-[#222222] border border-[#e1e1e1] hover:bg-gray-50"
          }`}
          onClick={handleNext}
          disabled={currentPage === totalPages || loading}
          aria-label="Página siguiente"
        >
          »
        </button>
      </div>

      {/* Indicador de carga */}
      {loading && (
        <div className="text-sm text-[#666666] flex items-center gap-2">
          <span className="loading loading-spinner loading-sm"></span>
          Cargando...
        </div>
      )}
    </div>
  );
};

export default Pagination;