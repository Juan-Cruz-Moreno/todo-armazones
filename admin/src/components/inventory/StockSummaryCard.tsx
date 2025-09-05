import React from "react";
import type { ProductVariantStockSummary } from "../../interfaces/inventory";

interface StockSummaryCardProps {
  stockSummary: ProductVariantStockSummary[];
  loading?: boolean;
}

export const StockSummaryCard: React.FC<StockSummaryCardProps> = ({
  stockSummary,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Resumen de Stock
        </h3>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (stockSummary.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Resumen de Stock
        </h3>
        <div className="text-center py-8 text-gray-500">
          No hay variantes con stock disponible
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);
  };

  const getStockStatusColor = (stock: number) => {
    if (stock === 0) return "text-red-600 bg-red-50 border-red-200";
    if (stock <= 10) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-green-600 bg-green-50 border-green-200";
  };

  const getStockStatusText = (stock: number) => {
    if (stock === 0) return "Sin Stock";
    if (stock <= 10) return "Stock Bajo";
    return "En Stock";
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Resumen de Stock
      </h3>
      
      <div className="space-y-4">
        {stockSummary.map((variant) => (
          <div
            key={variant.id}
            className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">
                  Color: {variant.color.name}
                </h4>
                <div className="text-sm text-gray-500 mt-1 flex items-center">
                  <div
                    className="w-4 h-4 rounded-full border mr-2"
                    style={{ backgroundColor: variant.color.hex }}
                  ></div>
                  ID: {variant.id}
                </div>
              </div>
              
              <div className="text-right">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStockStatusColor(
                    variant.currentStock
                  )}`}
                >
                  {getStockStatusText(variant.currentStock)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Stock Actual:</span>
                <div className="font-semibold text-lg text-gray-900">
                  {variant.currentStock}
                </div>
              </div>
              
              <div>
                <span className="text-gray-600">Costo Promedio:</span>
                <div className="font-semibold text-gray-900">
                  {formatCurrency(variant.averageCostUSD)}
                </div>
              </div>
              
              <div>
                <span className="text-gray-600">Valor Total:</span>
                <div className="font-semibold text-gray-900">
                  {formatCurrency(variant.totalValue)}
                </div>
              </div>
              
              <div>
                <span className="text-gray-600">Último Movimiento:</span>
                <div className="text-gray-800">
                  {variant.lastMovement ? (
                    <>
                      <div className="text-gray-800">{new Date(variant.lastMovement.date).toLocaleDateString("es-AR")}</div>
                      <div className="text-xs text-gray-700">
                        {variant.lastMovement.type === "ENTRY" ? "Entrada" : "Salida"}: {variant.lastMovement.quantity}
                      </div>
                    </>
                  ) : (
                    <span className="text-gray-600">Sin movimientos</span>
                  )}
                </div>
              </div>
            </div>

            {/* Barra de progreso visual del stock */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Stock</span>
                <span>{variant.currentStock} unidades</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    variant.currentStock === 0
                      ? "bg-red-500"
                      : variant.currentStock <= 10
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      (variant.currentStock / Math.max(variant.currentStock, 50)) * 100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
