"use client";

import { List, type RowComponentProps } from "react-window";
import { Product } from "@/interfaces/product";
import ProductCard from "@/components/molecules/ProductCard";
import { useMemo, useCallback, memo } from "react";
import LoadingSpinner from "../atoms/LoadingSpinner";
import SkeletonProductCard from "../molecules/SkeletonProductCard";
import { useVirtualizedGrid } from "@/hooks/useVirtualizedGrid";

interface VirtualizedProductGridProps {
  products: Product[];
  loading: boolean;
  hasNextPage: boolean;
  onLoadMore: () => void;
  className?: string;
}

interface ProductRowData {
  products: Product[];
  itemsPerRow: number;
  hasNextPage: boolean;
  loading: boolean;
}

// Función de comparación personalizada para memo
const areProductRowPropsEqual = (
  prevProps: RowComponentProps<ProductRowData>,
  nextProps: RowComponentProps<ProductRowData>
) => {
  // Comparar propiedades básicas
  if (
    prevProps.index !== nextProps.index ||
    prevProps.itemsPerRow !== nextProps.itemsPerRow ||
    prevProps.hasNextPage !== nextProps.hasNextPage ||
    prevProps.loading !== nextProps.loading
  ) {
    return false;
  }

  // Comparar array de productos (shallow comparison es suficiente para este caso)
  if (prevProps.products.length !== nextProps.products.length) {
    return false;
  }

  // Comparar productos específicos de esta fila
  const startIndex = prevProps.index * prevProps.itemsPerRow;
  const endIndex = Math.min(startIndex + prevProps.itemsPerRow, prevProps.products.length);
  
  for (let i = startIndex; i < endIndex; i++) {
    if (prevProps.products[i]?.id !== nextProps.products[i]?.id) {
      return false;
    }
  }

  return true;
};

// Componente de fila que renderiza múltiples productos - Memoizado para mejor performance
const ProductRow = memo(({
  index,
  style,
  products,
  itemsPerRow,
  hasNextPage,
  loading,
  ariaAttributes,
}: RowComponentProps<ProductRowData>) => {
  const startIndex = index * itemsPerRow;
  const endIndex = Math.min(startIndex + itemsPerRow, products.length);
  const rowProducts = products.slice(startIndex, endIndex);

  // Si es la última fila y hay productos faltantes, rellenar con skeletons
  const isLastRow = index === Math.ceil(products.length / itemsPerRow) - 1;
  const shouldShowSkeletons = isLastRow && loading && hasNextPage;
  const skeletonsToShow = shouldShowSkeletons 
    ? itemsPerRow - rowProducts.length 
    : 0;

  return (
    <div 
      className="grid gap-0" 
      {...ariaAttributes}
      style={{
        ...style,
        gridTemplateColumns: `repeat(${itemsPerRow}, 1fr)`,
      }}
      role="row"
      aria-rowindex={index + 1}
      aria-label={`Fila ${index + 1} de productos`}
    >
      {rowProducts.map((product, productIndex) => (
        <ProductCard 
          key={product.id} 
          {...product} 
          ariaAttributes={{
            role: "gridcell",
            "aria-colindex": productIndex + 1,
            "aria-label": `Producto ${product.productModel}`,
          }}
        />
      ))}
      
      {/* Skeletons para productos que se están cargando */}
      {Array.from({ length: skeletonsToShow }).map((_, idx) => (
        <div
          key={`skeleton-${startIndex + rowProducts.length + idx}`}
          role="gridcell"
          aria-colindex={rowProducts.length + idx + 1}
          aria-label="Cargando producto..."
        >
          <SkeletonProductCard />
        </div>
      ))}
      
      {/* Celdas vacías para mantener la estructura del grid */}
      {!shouldShowSkeletons && 
        Array.from({ length: itemsPerRow - rowProducts.length }).map((_, idx) => (
          <div 
            key={`empty-${startIndex + rowProducts.length + idx}`}
            role="gridcell"
            aria-colindex={rowProducts.length + idx + 1}
            aria-hidden="true"
          />
        ))
      }
    </div>
  );
}, areProductRowPropsEqual);

// Agregar displayName para cumplir con el linter
ProductRow.displayName = 'ProductRow';

const VirtualizedProductGrid = ({
  products,
  loading,
  hasNextPage,
  onLoadMore,
  className = "",
}: VirtualizedProductGridProps) => {
  const { 
    itemsPerRow, 
    calculateRows, 
    listConfig 
  } = useVirtualizedGrid({
    baseRowHeight: 380,
    rowPadding: 40,
  });

  // Calcular número total de filas
  const totalRows = calculateRows(products.length);
  
  // Agregar fila extra si está cargando más contenido
  const displayRows = loading && hasNextPage && products.length > 0 
    ? totalRows + 1 
    : totalRows;

  // Datos que se pasan a cada fila
  const rowData: ProductRowData = useMemo(
    () => ({
      products,
      itemsPerRow,
      hasNextPage,
      loading,
    }),
    [products, itemsPerRow, hasNextPage, loading]
  );

  // Callback para detectar cuando se hace scroll cerca del final
  const handleRowsRendered = useCallback(
    (
      visibleRows: { startIndex: number; stopIndex: number },
      allRows: { startIndex: number; stopIndex: number }
    ) => {
      // Si estamos cerca del final y hay más páginas, cargar más
      const threshold = 3; // Cargar cuando falten 3 filas
      if (
        allRows.stopIndex >= totalRows - threshold &&
        hasNextPage &&
        !loading
      ) {
        onLoadMore();
      }
    },
    [totalRows, hasNextPage, loading, onLoadMore]
  );

  // Si no hay productos y está cargando, mostrar skeletons en grid manual
  if (products.length === 0 && loading) {
    return (
      <div 
        className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-0 ${className}`}
        role="grid"
        aria-label="Cargando productos..."
        aria-busy="true"
        aria-live="polite"
      >
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            role="gridcell"
            aria-colindex={(idx % itemsPerRow) + 1}
            aria-rowindex={Math.floor(idx / itemsPerRow) + 1}
            aria-label="Cargando producto..."
          >
            <SkeletonProductCard />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div 
        className={`text-center py-8 text-gray-500 ${className}`}
        role="status"
        aria-live="polite"
      >
        No se encontraron productos.
      </div>
    );
  }

  return (
    <div className={className}>
      <List
        rowComponent={ProductRow}
        rowCount={displayRows}
        rowHeight={listConfig.rowHeight}
        rowProps={rowData}
        onRowsRendered={handleRowsRendered}
        role="grid"
        aria-label={`Grilla de productos - ${products.length} productos${hasNextPage ? ' (cargando más...)' : ''}`}
        aria-rowcount={hasNextPage ? -1 : displayRows} // -1 indica que el total es desconocido
        aria-colcount={itemsPerRow}
        aria-live={loading ? "polite" : "off"}
        aria-busy={loading}
        overscanCount={listConfig.overscanCount}
        style={listConfig.style}
      />
      
      {/* Indicador de carga al final */}
      {loading && products.length > 0 && (
        <div 
          className="flex justify-center py-4 text-[#888888]"
          role="status"
          aria-live="polite"
          aria-label="Cargando más productos"
        >
          <LoadingSpinner />
        </div>
      )}
      
      {/* Mensaje de fin de lista */}
      {!hasNextPage && !loading && products.length > 0 && (
        <p 
          className="text-center py-4 text-gray-400"
          role="status"
          aria-live="polite"
        >
          No hay más productos.
        </p>
      )}
    </div>
  );
};

export default VirtualizedProductGrid;