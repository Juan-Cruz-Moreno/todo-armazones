"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAppSelector } from "@/redux/hooks";
import { selectOrders } from "@/redux/slices/orderSlice";
import { PaymentMethod } from "@/enums/order.enum";
import { Check, Package, ShoppingBag, Info } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { Suspense } from "react";

const formatDate = (iso?: string) => {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

const paymentMethodLabel = (pm?: string) => {
  switch (pm) {
    case PaymentMethod.BankTransfer:
      return "Transferencia / Depósito bancario (4% extra)";
    case PaymentMethod.CashOnDelivery:
      return "Pago contra entrega";
    default:
      return pm || "-";
  }
};

const OrderReceivedContent = () => {
  const search = useSearchParams();
  const orderId = search?.get("orderId");
  const orders = useAppSelector(selectOrders);

  const order = orders.find((o) => o.id === orderId);

  return (
    <div
      className="min-h-screen bg-[#FFFFFF] pt-4 pb-10 px-4 text-center"
      style={{ color: "#222222" }}
    >
      <nav aria-label="Checkout steps" className="flex justify-center my-8">
        <ul className="steps w-full max-w-3xl mx-auto">
          <li className="step step-neutral">
            <span className="step-icon">
              <ShoppingBag size={16} />
            </span>
            <Link
              href="/cart"
              className="text-[#111111] text-lg font-bold px-2 py-1"
              style={{ display: "inline-block" }}
            >
              Carrito
            </Link>
          </li>
          <li className="step step-neutral">
            <span className="step-icon">
              <Package size={16} />
            </span>
            <Link
              href="/checkout"
              className="text-[#111111] text-lg font-bold px-2 py-1"
              style={{ display: "inline-block" }}
            >
              Checkout
            </Link>
          </li>
          <li className="step">
            <span className="step-icon">
              <Check size={16} />
            </span>
            <Link href="/account/orders" className="text-[#111111]">
              Confirmación
            </Link>
          </li>
        </ul>
      </nav>

      <main
        className="max-w-3xl mx-auto bg-white p-8"
        style={{ color: "#222222" }}
      >
        <div className="flex justify-center mb-4">
          <Check size={48} />
        </div>
        <h1 className="text-2xl font-bold mb-4">
          THANK YOU. YOUR ORDER HAS BEEN RECEIVED.
        </h1>

        {order ? (
          <div className="space-y-3">
            <div>
              <strong>Número del pedido:</strong> #{order.orderNumber}
            </div>
            <div>
              <strong>Fecha:</strong> {formatDate(order.createdAt)}
            </div>
            <div>
              <strong>Email:</strong> {order.user?.email || "-"}
            </div>
            <div>
              <strong>Total:</strong>{" "}
              {formatCurrency(order.totalAmount ?? 0, "en-US", "USD")}
            </div>
            <div>
              <strong>Método de pago:</strong>{" "}
              {paymentMethodLabel(order.paymentMethod)}
            </div>

            <div className="mt-6">
              <Link href="/account/orders" className="btn">
                Ver mis pedidos
              </Link>
            </div>
            {order.paymentMethod === PaymentMethod.BankTransfer && (
              <div
                className="mt-6 text-sm text-left mx-auto max-w-2xl bg-[#1565C0] p-4 rounded"
                style={{ color: "#ffffff" }}
              >
                <p className="flex items-start gap-3">
                  <Info size={20} className="mt-1 flex-shrink-0" />
                  <span>
                    Realiza tu pago directamente en nuestra cuenta bancaria
                    brindada por nuestro equipo de ventas. Posterior a efectuar
                    la transferencia o depósito por favor enviar foto clara y
                    completa del comprobante. Tu pedido no se procesará hasta
                    que se haya recibido el importe en nuestra cuenta.
                  </span>
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="py-6">
            <p>
              No se encontró la orden. Puedes ver la lista de pedidos en tu
              cuenta.
            </p>
            <div className="mt-4">
              <Link href="/account/orders" className="btn">
                Ir a mis pedidos
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const OrderReceivedPage = () => {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen bg-[#FFFFFF] pt-4 pb-10 px-4 text-center flex items-center justify-center"
          style={{ color: "#222222" }}
        >
          <div>Cargando...</div>
        </div>
      }
    >
      <OrderReceivedContent />
    </Suspense>
  );
};

export default OrderReceivedPage;
