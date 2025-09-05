import { OrderStatus } from "@/enums/order.enum";
import { Info, CheckCircle2, XCircle } from "lucide-react";

interface Props {
  status: OrderStatus;
}

export const OrderStatusBadge = ({ status }: Props) => {
  switch (status) {
    case OrderStatus.Processing:
      return (
        <span
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm"
          style={{ backgroundColor: "#C6E1C6", color: "#2C4700" }}
        >
          <Info className="w-4 h-4" />
          Procesando
        </span>
      );
    case OrderStatus.OnHold:
      return (
        <span
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm"
          style={{ backgroundColor: "#F8DDA7", color: "#573B00" }}
        >
          <Info className="w-4 h-4" />
          En espera
        </span>
      );
    case OrderStatus.PendingPayment:
      return (
        <span
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm"
          style={{ backgroundColor: "#E5E5E5", color: "#454545" }}
        >
          <Info className="w-4 h-4" />
          Pendiente de pago
        </span>
      );
    case OrderStatus.Completed:
      return (
        <span
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm"
          style={{ backgroundColor: "#C8D7E1", color: "#003D66" }}
        >
          <CheckCircle2 className="w-4 h-4" />
          Completado
        </span>
      );
    case OrderStatus.Cancelled:
      return (
        <span
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm"
          style={{ backgroundColor: "#E5E5E5", color: "#454545" }}
        >
          <XCircle className="w-4 h-4" />
          Cancelado
        </span>
      );
    case OrderStatus.Refunded:
      return (
        <span
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm"
          style={{ backgroundColor: "#E5E5E5", color: "#454545" }}
        >
          <XCircle className="w-4 h-4" />
          Reembolsado
        </span>
      );
    default:
      return (
        <span
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm"
          style={{ backgroundColor: "#E5E5E5", color: "#454545" }}
        >
          <Info className="w-4 h-4" />
          Desconocido
        </span>
      );
  }
};
