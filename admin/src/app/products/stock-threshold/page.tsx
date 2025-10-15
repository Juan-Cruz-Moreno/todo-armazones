"use client";

import { useEffect, useState, useCallback } from "react";
import { useProducts } from "@/hooks/useProducts";
import Pagination from "@/components/molecules/Pagination";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, Package, RefreshCw } from "lucide-react";

const SKELETON_COUNT = 10;

const StockThresholdPage = () => {
  const {
    lowStockVariants,
    lowStockPagination,
    lowStockLoading,
    lowStockError,
    lowStockTotalCount,
    lowStockTotalPages,
    fetchLowStockProductVariants,
    loadLowStockPage,
    clearLowStockVariants,
  } = useProducts();

  const [stockThreshold, setStockThreshold] = useState<string>("5");
  const [minStock, setMinStock] = useState<string>("");
  const [maxStock, setMaxStock] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      clearLowStockVariants();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const threshold = parseInt(stockThreshold, 10);
    if (isNaN(threshold) || threshold < 0) {
      alert("Por favor ingresa un número válido mayor o igual a 0");
      return;
    }

    const min = minStock ? parseInt(minStock, 10) : undefined;
    const max = maxStock ? parseInt(maxStock, 10) : undefined;

    if (min !== undefined && min < 0) {
      alert("El stock mínimo debe ser mayor o igual a 0");
      return;
    }

    if (max !== undefined && max < 0) {
      alert("El stock máximo debe ser mayor o igual a 0");
      return;
    }

    if (min !== undefined && max !== undefined && min > max) {
      alert("El stock mínimo no puede ser mayor al stock máximo");
      return;
    }

    setCurrentPage(1);
    setHasSearched(true);
    fetchLowStockProductVariants({ 
      stockThreshold: threshold, 
      page: 1, 
      limit: 20,
      minStock: min,
      maxStock: max,
    });
  };

  const handlePageChange = useCallback(
    (pageNumber: number) => {
      const threshold = parseInt(stockThreshold, 10);
      if (isNaN(threshold)) return;

      const min = minStock ? parseInt(minStock, 10) : undefined;
      const max = maxStock ? parseInt(maxStock, 10) : undefined;

      // Scroll hacia arriba inmediatamente cuando cambie de página
      window.scrollTo({ top: 0, behavior: "instant" });

      setCurrentPage(pageNumber);
      loadLowStockPage(threshold, pageNumber, 20, min, max);
    },
    [stockThreshold, minStock, maxStock, loadLowStockPage]
  );

  const handleRefresh = () => {
    const threshold = parseInt(stockThreshold, 10);
    if (isNaN(threshold) || threshold < 0 || !hasSearched) return;
    
    const min = minStock ? parseInt(minStock, 10) : undefined;
    const max = maxStock ? parseInt(maxStock, 10) : undefined;
    
    setCurrentPage(1);
    fetchLowStockProductVariants({ 
      stockThreshold: threshold, 
      page: 1, 
      limit: 20,
      minStock: min,
      maxStock: max,
    });
  };

  // Skeleton para lista
  const SkeletonRow = () => (
    <li className="flex flex-col gap-4 p-4 animate-pulse border-b border-[#e1e1e1]">
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 bg-gray-200 rounded"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
          <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
          <div className="h-3 w-1/4 bg-gray-200 rounded"></div>
        </div>
      </div>
    </li>
  );

  const getStockStatusColor = (stock: number) => {
    if (stock === 0) return "text-red-600 bg-red-50";
    if (stock <= 3) return "text-orange-600 bg-orange-50";
    return "text-yellow-600 bg-yellow-50";
  };

  const getStockStatusText = (stock: number) => {
    if (stock === 0) return "Sin stock";
    if (stock <= 3) return "Stock crítico";
    return "Stock bajo";
  };

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[#111111] font-bold text-2xl mb-2 flex items-center gap-2">
          <AlertTriangle className="size-6 text-orange-500" />
          Alerta de Stock Bajo
        </h1>
        <p className="text-sm text-[#666666]">
          Visualiza productos con stock crítico que requieren reposición
        </p>
      </div>

      {/* Formulario de búsqueda */}
      <div className="mb-6 p-4 bg-[#ffffff] border border-[#e1e1e1] rounded-none shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col gap-4">
          {/* Primera fila - Umbral principal */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex-1">
              <label className="text-xs text-[#7A7A7A] mb-1 block font-medium">
                Umbral de Stock (Máximo)
              </label>
              <input
                type="number"
                min="0"
                value={stockThreshold}
                onChange={(e) => setStockThreshold(e.target.value)}
                placeholder="Ej: 5"
                className="input w-full border border-[#e1e1e1] rounded-none bg-[#FFFFFF] text-[#222222] shadow-none focus:border-[#222222] focus:outline-none"
              />
              <p className="text-xs text-[#999999] mt-1">
                Muestra variantes con stock menor o igual a este valor
              </p>
            </div>
          </div>

          {/* Segunda fila - Filtros opcionales de rango */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex-1">
              <label className="text-xs text-[#7A7A7A] mb-1 block font-medium">
                Stock Mínimo (Opcional)
              </label>
              <input
                type="number"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                placeholder="Ej: 2"
                className="input w-full border border-[#e1e1e1] rounded-none bg-[#FFFFFF] text-[#222222] shadow-none focus:border-[#222222] focus:outline-none"
              />
              <p className="text-xs text-[#999999] mt-1">
                Excluye variantes con menos de este stock
              </p>
            </div>

            <div className="flex-1">
              <label className="text-xs text-[#7A7A7A] mb-1 block font-medium">
                Stock Máximo (Opcional)
              </label>
              <input
                type="number"
                min="0"
                value={maxStock}
                onChange={(e) => setMaxStock(e.target.value)}
                placeholder="Ej: 10"
                className="input w-full border border-[#e1e1e1] rounded-none bg-[#FFFFFF] text-[#222222] shadow-none focus:border-[#222222] focus:outline-none"
              />
              <p className="text-xs text-[#999999] mt-1">
                Límite superior (tiene prioridad sobre umbral)
              </p>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2">
            <button
              type="submit"
              className="btn rounded-none bg-[#222222] text-white border-[#222222] shadow-none hover:bg-[#111111]"
              disabled={lowStockLoading}
            >
              <Package className="size-4" />
              Buscar
            </button>
            {hasSearched && (
              <button
                type="button"
                onClick={handleRefresh}
                className="btn rounded-none bg-[#ffffff] text-[#222222] border border-[#e1e1e1] shadow-none"
                disabled={lowStockLoading}
              >
                <RefreshCw className="size-4" />
                Refrescar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Información de resultados */}
      {hasSearched && !lowStockLoading && lowStockTotalCount > 0 && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-none">
          <p className="text-sm text-orange-800">
            <span className="font-semibold">{lowStockTotalCount}</span> variantes encontradas con
            stock ≤ <span className="font-semibold">{stockThreshold}</span>
          </p>
        </div>
      )}

      {/* Error */}
      {lowStockError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-none">
          <p className="text-sm text-red-800">{lowStockError}</p>
        </div>
      )}

      {/* Lista de variantes con stock bajo */}
      <div className="bg-[#ffffff] rounded-none shadow-md border border-[#e1e1e1]">
        <ul className="divide-y divide-[#e1e1e1]">
          {/* Skeleton loading */}
          {lowStockLoading &&
            lowStockVariants.length === 0 &&
            Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
              <SkeletonRow key={idx} />
            ))}

          {/* Estado inicial */}
          {!hasSearched && !lowStockLoading && (
            <li className="p-8 text-center">
              <Package className="size-12 text-[#cccccc] mx-auto mb-3" />
              <p className="text-[#666666] text-sm">
                Ingresa un umbral de stock para comenzar
              </p>
            </li>
          )}

          {/* No hay resultados */}
          {hasSearched && !lowStockLoading && lowStockVariants.length === 0 && (
            <li className="p-8 text-center">
              <Package className="size-12 text-green-400 mx-auto mb-3" />
              <p className="text-[#666666] text-sm font-medium">
                ¡Excelente! No hay productos con stock bajo
              </p>
              <p className="text-[#999999] text-xs mt-1">
                Todos los productos tienen más de {stockThreshold} unidades
              </p>
            </li>
          )}

          {/* Lista de variantes */}
          {lowStockVariants.map((variant) => (
            <li
              key={variant.id}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                {/* Imagen del producto */}
                <Link
                  href={`/products/${variant.product.slug}`}
                  className="flex-shrink-0"
                >
                  <div className="relative w-20 h-20 border border-[#e1e1e1] rounded overflow-hidden bg-white">
                    <Image
                      src={`${process.env.NEXT_PUBLIC_API_URL}/${variant.thumbnail || variant.product.thumbnail}`}
                      alt={`${variant.product.productModel} - ${variant.color.name}`}
                      fill
                      className="object-contain p-1"
                      sizes="80px"
                    />
                  </div>
                </Link>

                {/* Información del producto */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/products/${variant.product.slug}`}
                    className="text-[#222222] font-medium hover:underline block mb-1"
                  >
                    {variant.product.productModel}
                  </Link>
                  <div className="flex flex-wrap gap-2 text-xs text-[#666666] mb-2">
                    <span className="flex items-center gap-1">
                      SKU: <span className="font-mono">{variant.product.sku}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      Color:
                      <span
                        className="inline-block w-3 h-3 rounded-full border border-gray-300"
                        style={{ backgroundColor: variant.color.hex }}
                        title={variant.color.name}
                      ></span>
                      {variant.color.name}
                    </span>
                  </div>

                  {/* Indicador de stock */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getStockStatusColor(variant.stock)}`}
                    >
                      <AlertTriangle className="size-3" />
                      {getStockStatusText(variant.stock)}
                    </span>
                    <span className="text-sm font-bold text-[#222222]">
                      Stock: {variant.stock} {variant.stock === 1 ? "unidad" : "unidades"}
                    </span>
                  </div>

                  {/* Precios */}
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-[#666666]">
                    <span>
                      Costo: <span className="font-semibold">${variant.averageCostUSD.toFixed(2)} USD</span>
                    </span>
                    <span>
                      Precio: <span className="font-semibold">${variant.priceUSD.toFixed(2)} USD</span>
                    </span>
                    <span>
                      <span className="font-semibold">${variant.priceARS.toLocaleString("es-AR")} ARS</span>
                    </span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex-shrink-0">
                  <Link href={`/products/preview/${variant.product.slug}`}>
                    <button className="btn btn-sm rounded-none bg-[#ffffff] text-[#222222] border border-[#e1e1e1] shadow-none hover:bg-gray-50">
                      Ver producto
                    </button>
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Paginación */}
      {hasSearched && lowStockPagination && lowStockTotalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={lowStockTotalPages}
          onPageChange={handlePageChange}
          loading={lowStockLoading}
          className="mt-6"
        />
      )}

      {/* Información de resultados en footer */}
      {hasSearched && lowStockPagination && lowStockVariants.length > 0 && (
        <div className="mt-4 text-sm text-[#666666] text-center">
          Mostrando {lowStockVariants.length} de {lowStockTotalCount} variantes con stock bajo
        </div>
      )}
    </div>
  );
};

export default StockThresholdPage;
