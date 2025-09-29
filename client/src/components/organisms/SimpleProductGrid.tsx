"use client";

import { Product } from "@/interfaces/product";
import ProductCard from "@/components/molecules/ProductCard";
import SkeletonProductCard from "../molecules/SkeletonProductCard";
import Pagination from "../molecules/Pagination";
import LoadingSpinner from "../atoms/LoadingSpinner";

interface SimpleProductGridProps {
  products: Product[];
  loading: boolean;
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onPageChange: (page: number) => void;
  className?: string;
}

const SimpleProductGrid = ({
  products,
  loading,
  totalCount,
  totalPages,
  currentPage,
  hasNextPage,
  hasPreviousPage,
  onPageChange,
  className = "",
}: SimpleProductGridProps) => {
  // Si está cargando y no hay productos, mostrar skeletons
  if (loading && products.length === 0) {
    return (
      <div className={className}>
        <div 
          className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-0"
          role="grid"
          aria-label="Cargando productos..."
          aria-busy="true"
          aria-live="polite"
        >
          {Array.from({ length: 12 }).map((_, idx) => (
            <div
              key={idx}
              role="gridcell"
              aria-label="Cargando producto..."
            >
              <SkeletonProductCard />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Información de resultados */}
      <div className="mb-6 text-sm text-gray-600 text-center">
        {totalCount > 0 && (
          <span>
            Mostrando {products.length} de {totalCount} productos
            {(hasNextPage || hasPreviousPage) && ` (Página ${currentPage} de ${totalPages})`}
          </span>
        )}
      </div>

      {/* Grid de productos */}
      {products.length > 0 ? (
        <>
          <div className="relative">
            <div 
              className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-0 mb-8 overflow-x-hidden p-2"
              role="grid"
              aria-label={`Grilla de productos - ${products.length} productos`}
              aria-rowcount={Math.ceil(products.length / 4)}
              aria-colcount={4}
              aria-live={loading ? "polite" : "off"}
              aria-busy={loading}
            >
              {products.map((product, index) => (
                <ProductCard 
                  key={product.id} 
                  {...product} 
                  ariaAttributes={{
                    role: "gridcell",
                    "aria-colindex": (index % 4) + 1,
                    "aria-rowindex": Math.floor(index / 4) + 1,
                    "aria-label": `Producto ${product.productModel}`,
                  }}
                />
              ))}
            </div>

            {/* Overlay de carga sutil para cuando se están cargando nuevos productos */}
            {loading && (
              <div className="absolute inset-0 bg-white/20 z-10 flex items-center justify-center pointer-events-none">
                <LoadingSpinner size="md" />
              </div>
            )}
          </div>

          {/* Componente de paginación */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            loading={loading}
            className="mt-8 mb-8"
          />
        </>
      ) : !loading ? (
        <div 
          className="text-center py-16 text-gray-500"
          role="status"
          aria-live="polite"
        >
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold mb-2">No se encontraron productos</h3>
          <p className="text-gray-400">
            Intenta ajustar los filtros o buscar con otros términos.
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default SimpleProductGrid;