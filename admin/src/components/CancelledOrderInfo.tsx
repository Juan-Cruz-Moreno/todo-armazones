"use client";

import React from "react";
import { AlertCircle, Package, RotateCcw, XCircle } from "lucide-react";
import { OrderStatus } from "@/enums/order.enum";

interface CancelledOrderInfoProps {
  orderStatus: OrderStatus;
  className?: string;
}

const CancelledOrderInfo: React.FC<CancelledOrderInfoProps> = ({
  orderStatus,
  className = "",
}) => {
  if (orderStatus !== OrderStatus.Cancelled) {
    return null;
  }

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800 mb-2">
            ❌ Orden Cancelada
          </h3>
          <p className="text-sm text-red-700 mb-3">
            Esta orden ha sido cancelada. En este estado:
          </p>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-red-700">
              <Package className="h-4 w-4" />
              <span>El stock de los productos ha sido <strong>liberado</strong> y está disponible para otros clientes</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-red-700">
              <XCircle className="h-4 w-4" />
              <span>Todos los valores financieros (COGS, márgenes, totales) están en <strong>$0</strong></span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-red-700">
              <RotateCcw className="h-4 w-4" />
              <span>La orden puede ser <strong>reactivada</strong> cambiando a ON_HOLD (si hay stock disponible)</span>
            </div>

            <div className="flex items-start gap-2 text-sm text-red-700 bg-red-100 p-2 rounded">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Ediciones de productos:</strong> Los cambios en cantidades, eliminación o adición de productos 
                <strong> NO afectarán el inventario</strong> hasta que se reactive la orden cambiando el estado.
              </div>
            </div>
          </div>
          
          <div className="text-sm text-red-700">
            <strong>Acciones disponibles:</strong>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>Cambiar a <strong>ON_HOLD</strong>: Reactiva la orden y reserva el stock (requiere disponibilidad)</li>
              <li>Al reactivar, se <strong>restaurarán automáticamente</strong> todos los valores financieros</li>
              <li>Si no hay stock suficiente, recibirás una alerta con los detalles</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelledOrderInfo;
