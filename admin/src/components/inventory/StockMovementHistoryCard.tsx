import React from "react";
import type {
  StockMovementHistory,
  StockMovementType,
  StockMovementReason,
} from "../../interfaces/inventory";
import { History } from "lucide-react";

interface StockMovementHistoryProps {
  movements: StockMovementHistory | null;
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export const StockMovementHistoryCard: React.FC<StockMovementHistoryProps> = ({
  movements,
  loading = false,
  onLoadMore,
  hasMore = false,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);
  };

  const getMovementTypeColor = (type: StockMovementType) => {
    return type === "ENTRY"
      ? "text-green-700 bg-green-50 border-green-200"
      : "text-red-700 bg-red-50 border-red-200";
  };

  const getMovementTypeText = (type: StockMovementType) => {
    return type === "ENTRY" ? "Entrada" : "Salida";
  };

  const getReasonText = (reason: StockMovementReason) => {
    const reasonMap: Record<StockMovementReason, string> = {
      PURCHASE: "Compra",
      SALE: "Venta",
      RETURN: "Devolución",
      DAMAGE: "Dañado",
      THEFT: "Robo",
      INVENTORY_ADJUSTMENT: "Ajuste de Inventario",
      INITIAL_STOCK: "Stock Inicial",
    };
    return reasonMap[reason] || reason;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Historial de Movimientos
        </h3>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!movements || movements.movements.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Historial de Movimientos
        </h3>
        <div className="text-center py-8 text-gray-500">
          No hay movimientos de stock registrados
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
          <History className="size-6" />
          Historial de Movimientos
        </h3>
        <span className="text-sm text-gray-500">
          Total: {movements.totalMovements} movimientos
        </span>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {movements.movements.map((movement) => (
          <div
            key={movement.id}
            className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getMovementTypeColor(
                      movement.type
                    )}`}
                  >
                    {getMovementTypeText(movement.type)}
                  </span>
                  <span className="text-sm text-gray-600">
                    {getReasonText(movement.reason)}
                  </span>
                </div>

                <div className="text-sm text-gray-500">
                  {new Date(movement.createdAt).toLocaleString("es-AR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900">
                  {movement.type === "ENTRY" ? "+" : "-"}
                  {movement.quantity}
                </div>
                <div className="text-sm text-gray-600">
                  {formatCurrency(movement.unitCost)}/ud
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-t pt-3">
              <div>
                <span className="text-gray-600">Stock Anterior:</span>
                <div className="font-medium text-gray-900">
                  {movement.previousStock}
                </div>
              </div>

              <div>
                <span className="text-gray-600">Stock Nuevo:</span>
                <div className="font-medium text-gray-900">
                  {movement.newStock}
                </div>
              </div>

              <div>
                <span className="text-gray-600">Costo Total:</span>
                <div className="font-medium text-gray-900">
                  {formatCurrency(movement.totalCost)}
                </div>
              </div>

              <div>
                <span className="text-gray-600">Costo Promedio:</span>
                <div className="font-medium text-gray-900">
                  {formatCurrency(movement.newAvgCost)}
                </div>
              </div>
            </div>

            {movement.reference && (
              <div className="mt-2 text-sm">
                <span className="text-gray-600">Referencia: </span>
                <span className="text-gray-800">{movement.reference}</span>
              </div>
            )}

            {movement.notes && (
              <div className="mt-2 text-sm">
                <span className="text-gray-600">Notas: </span>
                <span className="text-gray-800">{movement.notes}</span>
              </div>
            )}

            {movement.createdBy && (
              <div className="mt-2 text-xs text-gray-600">
                Creado por: {movement.createdBy.displayName} (
                {movement.createdBy.email})
              </div>
            )}

            {/* Información del producto y variante */}
            <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-900">
                    {movement.productVariant.product.productModel}
                  </span>
                  <span className="text-gray-600 ml-2">
                    SKU: {movement.productVariant.product.sku}
                  </span>
                </div>
                <div className="flex items-center">
                  <div
                    className="w-4 h-4 rounded-full border mr-2"
                    style={{
                      backgroundColor: movement.productVariant.color.hex,
                    }}
                  ></div>
                  <span className="text-gray-800">
                    {movement.productVariant.color.name}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && onLoadMore && (
        <div className="mt-4 text-center">
          <button
            onClick={onLoadMore}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
          >
            Cargar más movimientos
          </button>
        </div>
      )}
    </div>
  );
};
