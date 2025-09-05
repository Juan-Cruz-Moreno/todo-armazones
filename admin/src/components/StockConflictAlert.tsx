"use client";

import React from "react";
import { AlertTriangle, Package, RefreshCw } from "lucide-react";
import { StockConflictItem } from "@/interfaces/order";

interface StockConflictAlertProps {
  conflicts: StockConflictItem[];
  onRefreshStock: () => void;
  isRefreshing?: boolean;
  className?: string;
}

const StockConflictAlert: React.FC<StockConflictAlertProps> = ({
  conflicts,
  onRefreshStock,
  isRefreshing = false,
  className = "",
}) => {
  if (!conflicts || conflicts.length === 0) {
    return null;
  }

  return (
    <div className={`bg-amber-50 border border-amber-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-amber-800 mb-2">
            ⚠️ Conflictos de Stock Detectados
          </h3>
          <p className="text-sm text-amber-700 mb-3">
            Esta orden está en estado <span className="font-semibold">PENDING_PAYMENT</span> y 
            algunos productos no tienen stock suficiente para volver al estado ON_HOLD:
          </p>
          
          <div className="space-y-2 mb-4">
            {conflicts.map((conflict) => (
              <div
                key={conflict.productVariantId}
                className="bg-white border border-amber-200 rounded-md p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Package className="h-4 w-4 text-amber-600" />
                  <span className="font-medium text-gray-900">
                    {conflict.productInfo.productModel}
                  </span>
                  <span className="text-sm text-gray-500">
                    • {conflict.productInfo.sku}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded border border-gray-300"
                      style={{ backgroundColor: conflict.productInfo.color.hex }}
                      title={conflict.productInfo.color.name}
                    />
                    <span className="text-gray-600">
                      {conflict.productInfo.color.name}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-red-600">
                    <span className="font-medium">
                      Necesita: {conflict.requiredQuantity}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-amber-600">
                    <span className="font-medium">
                      Disponible: {conflict.availableStock}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-red-700">
                    <span className="font-semibold">
                      Faltante: {conflict.requiredQuantity - conflict.availableStock}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-amber-700">
              <strong>Acciones sugeridas:</strong>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li>Agregar stock para los productos faltantes</li>
                <li>Reducir la cantidad en la orden</li>
                <li>Mantener la orden en PENDING_PAYMENT hasta que haya stock</li>
              </ul>
            </div>
            
            <button
              onClick={onRefreshStock}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-2 bg-amber-100 hover:bg-amber-200 disabled:bg-amber-50 border border-amber-300 rounded-md text-sm font-medium text-amber-800 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Verificando...' : 'Verificar Stock'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockConflictAlert;
