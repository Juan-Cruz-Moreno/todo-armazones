"use client";

import React from "react";
import { AlertCircle, CreditCard, Clock, Package } from "lucide-react";
import { OrderStatus } from "@/enums/order.enum";

interface PendingPaymentInfoProps {
  orderStatus: OrderStatus;
  className?: string;
}

const PendingPaymentInfo: React.FC<PendingPaymentInfoProps> = ({
  orderStatus,
  className = "",
}) => {
  if (orderStatus !== OrderStatus.PendingPayment) {
    return null;
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-800 mb-2">
            💳 Orden en Estado PENDING_PAYMENT
          </h3>
          <p className="text-sm text-blue-700 mb-3">
            Esta orden está esperando el pago del cliente. En este estado:
          </p>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Package className="h-4 w-4" />
              <span>El stock de los productos ha sido <strong>liberado</strong> y está disponible para otros clientes</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <CreditCard className="h-4 w-4" />
              <span>El cliente debe completar el pago para continuar</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Clock className="h-4 w-4" />
              <span>Una vez pagado, se puede cambiar a <strong>ON_HOLD</strong> (si hay stock) o <strong>COMPLETED</strong></span>
            </div>

            <div className="flex items-start gap-2 text-sm text-blue-700 bg-blue-100 p-2 rounded">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Ediciones de productos:</strong> Los cambios en cantidades, eliminación o adición de productos 
                <strong> NO afectarán el inventario</strong> hasta que se reactive la orden cambiando el estado.
              </div>
            </div>
          </div>
          
          <div className="text-sm text-blue-700">
            <strong>Acciones disponibles:</strong>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>Cambiar a <strong>ON_HOLD</strong>: Reserva el stock nuevamente (requiere disponibilidad)</li>
              <li>Cambiar a <strong>COMPLETED</strong>: Finaliza la orden exitosamente</li>
              <li>Cambiar a <strong>CANCELLED</strong>: Cancela la orden definitivamente</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingPaymentInfo;
