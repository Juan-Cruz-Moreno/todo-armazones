import React, { useEffect, useState } from "react";
import { useInventory } from "../../hooks/useInventory";
import { StockSummaryCard } from "./StockSummaryCard";
import { StockMovementHistoryCard } from "./StockMovementHistoryCard";
import { StockOperationForms } from "./StockOperationForms";
import type {
  CreateStockEntryPayload,
  CreateStockExitPayload,
} from "../../interfaces/inventory";

interface InventoryManagerProps {
  productId: string;
  productVariantId?: string; // Si se especifica, muestra solo esa variante
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  productId,
  productVariantId,
}) => {
  const {
    movements,
    movementsLoading,
    movementsError,
    stockSummary,
    summaryLoading,
    summaryError,
    operationLoading,
    operationError,
    getStockMovements,
    getProductStockSummary,
    createEntryAndRefresh,
    createExitAndRefresh,
    clearErrors,
  } = useInventory();

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    productVariantId || null
  );
  const [movementsOffset, setMovementsOffset] = useState(0);
  const movementsLimit = 10;

  // Cargar resumen de stock al montar el componente
  useEffect(() => {
    getProductStockSummary(productId);
  }, [productId, getProductStockSummary]);

  // Cargar movimientos cuando se selecciona una variante
  useEffect(() => {
    if (selectedVariantId) {
      setMovementsOffset(0);
      getStockMovements(selectedVariantId, { limit: movementsLimit, offset: 0 });
    }
  }, [selectedVariantId, getStockMovements]);

  // Limpiar errores al cambiar de variante
  useEffect(() => {
    clearErrors();
  }, [selectedVariantId, clearErrors]);

  const handleLoadMoreMovements = () => {
    if (selectedVariantId && movements) {
      const newOffset = movementsOffset + movementsLimit;
      setMovementsOffset(newOffset);
      getStockMovements(selectedVariantId, { 
        limit: movementsLimit, 
        offset: newOffset 
      });
    }
  };

  const handleVariantSelect = (variantId: string) => {
    setSelectedVariantId(variantId);
  };

  const handleCreateEntry = async (payload: CreateStockEntryPayload) => {
    const success = await createEntryAndRefresh(payload, productId);
    if (success) {
      // Actualizar la lista de movimientos si hay una variante seleccionada
      if (selectedVariantId === payload.productVariantId) {
        getStockMovements(payload.productVariantId, { 
          limit: movementsLimit, 
          offset: 0 
        });
        setMovementsOffset(0);
      }
    }
    return success;
  };

  const handleCreateExit = async (payload: CreateStockExitPayload) => {
    const success = await createExitAndRefresh(payload, productId);
    if (success) {
      // Actualizar la lista de movimientos si hay una variante seleccionada
      if (selectedVariantId === payload.productVariantId) {
        getStockMovements(payload.productVariantId, { 
          limit: movementsLimit, 
          offset: 0 
        });
        setMovementsOffset(0);
      }
    }
    return success;
  };

  const selectedVariant = stockSummary.find(v => v.id === selectedVariantId);
  const hasMoreMovements = movements 
    ? (movementsOffset + movementsLimit) < movements.totalMovements 
    : false;

  return (
    <div className="space-y-6">
      {/* Mostrar errores globales */}
      {(summaryError || movementsError || operationError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-red-700">
              {summaryError || movementsError || operationError}
              <button 
                onClick={clearErrors}
                className="ml-2 underline hover:no-underline"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resumen de Stock */}
      <StockSummaryCard 
        stockSummary={stockSummary} 
        loading={summaryLoading} 
      />

      {/* Selector de Variante para Operaciones */}
      {stockSummary.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Gestión de Variante
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {stockSummary.map((variant) => (
              <button
                key={variant.id}
                onClick={() => handleVariantSelect(variant.id)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  selectedVariantId === variant.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div
                      className="w-4 h-4 rounded-full border mr-2"
                      style={{ backgroundColor: variant.color.hex }}
                    ></div>
                    <span className="font-medium text-gray-900">{variant.color.name}</span>
                  </div>
                  <span className={`text-sm px-2 py-1 rounded ${
                    variant.currentStock > 10 
                      ? "bg-green-100 text-green-800"
                      : variant.currentStock > 0
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {variant.currentStock} en stock
                  </span>
                </div>
                <div className="text-sm text-gray-700">
                  ID: {variant.id}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Operaciones de Stock - Solo si hay una variante seleccionada */}
      {selectedVariantId && selectedVariant && (
        <StockOperationForms
          productVariantId={selectedVariantId}
          currentStock={selectedVariant.currentStock}
          onCreateEntry={handleCreateEntry}
          onCreateExit={handleCreateExit}
          loading={operationLoading}
        />
      )}

      {/* Historial de Movimientos - Solo si hay una variante seleccionada */}
      {selectedVariantId && (
        <StockMovementHistoryCard
          movements={movements}
          loading={movementsLoading}
          onLoadMore={hasMoreMovements ? handleLoadMoreMovements : undefined}
          hasMore={hasMoreMovements}
        />
      )}

      {/* Mensaje cuando no hay variantes */}
      {stockSummary.length === 0 && !summaryLoading && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m13-8v2a2 2 0 01-2 2H9a2 2 0 01-2-2V5a2 2 0 012-2h6a2 2 0 012 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Sin variantes de producto
          </h3>
          <p className="text-gray-600">
            Este producto no tiene variantes configuradas o no tienen stock registrado.
          </p>
        </div>
      )}
    </div>
  );
};
