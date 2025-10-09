"use client";

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { OrderStatusBadge } from "@/components/atoms/OrderStatusBadge";
import {
  OrderStatus,
  PaymentMethod,
  ShippingMethod,
  DeliveryType,
} from "@/enums/order.enum";
import { useOrders } from "@/hooks/useOrders";
import { debounce } from "@/utils/debounce";
import { formatCurrency } from "@/utils/formatCurrency";
import LoadingSpinner from "@/components/atoms/LoadingSpinner";
import { Eye, X } from "lucide-react";
import { OrderItem, Order } from "@/interfaces/order";
import { downloadOrderPDF } from "@/utils/downloadOrderPDF";
import Image from "next/image";

const OrdersPage = () => {
  const {
    orders,
    nextCursor,
    loading,
    error,
    statusFilter,
    getOrders,
    setFilter,
    clearOrders,
  } = useOrders();

  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);
  const [localStatusFilter, setLocalStatusFilter] = useState<OrderStatus | "">(
    ""
  );

  const observer = useRef<IntersectionObserver | null>(null);
  const lastOrderRef = useRef<HTMLTableRowElement | null>(null);
  const isLoadingMore = loading && orders.length > 0;

  const debouncedLoadMore = useMemo(
    () =>
      debounce(() => {
        if (nextCursor && !loading) {
          getOrders({ status: statusFilter, cursor: nextCursor });
        }
      }, 300),
    [nextCursor, loading, statusFilter, getOrders]
  );

  const loadMore = useCallback(() => {
    debouncedLoadMore();
  }, [debouncedLoadMore]);

  const handleDownloadPDF = async (
    orderId: string,
    firstName: string,
    lastName: string,
    orderNumber: number
  ) => {
    setIsDownloading(orderId);
    try {
      await downloadOrderPDF(orderId, firstName, lastName, orderNumber);
    } catch {
    } finally {
      setIsDownloading(null);
    }
  };

  useEffect(() => {
    if (!nextCursor || loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new window.IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMore();
      }
    });
    if (lastOrderRef.current) {
      observer.current.observe(lastOrderRef.current);
    }
    return () => observer.current?.disconnect();
  }, [orders, nextCursor, loading, loadMore]);

  useEffect(() => {
    clearOrders();
    getOrders(localStatusFilter ? { status: localStatusFilter } : undefined);
    setFilter(
      localStatusFilter ? (localStatusFilter as OrderStatus) : undefined
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStatusFilter]);

  return (
    <div className="px-4 py-6">
      <h1 className="text-[#111111] font-bold text-2xl mb-4">Mis pedidos</h1>

      {error && (
        <div className="p-4 text-center text-error">
          {typeof error === "string" ? error : error.message}
        </div>
      )}

      {/* Filtro */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <span className="text-[#666666] text-sm">Filtrar por estado:</span>
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            <button
              className={`text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
                !localStatusFilter
                  ? "bg-[#2271B1] text-white"
                  : "text-[#2271B1] hover:bg-[#f0f0f0] hover:text-[#111111]"
              }`}
              onClick={() => setLocalStatusFilter("")}
            >
              Todos
            </button>
            <button
              className={`text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
                localStatusFilter === OrderStatus.Processing
                  ? "bg-[#2271B1] text-white"
                  : "text-[#2271B1] hover:bg-[#f0f0f0] hover:text-[#111111]"
              }`}
              onClick={() => setLocalStatusFilter(OrderStatus.Processing)}
            >
              Procesando
            </button>
            <button
              className={`text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
                localStatusFilter === OrderStatus.OnHold
                  ? "bg-[#2271B1] text-white"
                  : "text-[#2271B1] hover:bg-[#f0f0f0] hover:text-[#111111]"
              }`}
              onClick={() => setLocalStatusFilter(OrderStatus.OnHold)}
            >
              En espera
            </button>
            <button
              className={`text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
                localStatusFilter === OrderStatus.PendingPayment
                  ? "bg-[#2271B1] text-white"
                  : "text-[#2271B1] hover:bg-[#f0f0f0] hover:text-[#111111]"
              }`}
              onClick={() => setLocalStatusFilter(OrderStatus.PendingPayment)}
            >
              Pendiente de pago
            </button>
            <button
              className={`text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
                localStatusFilter === OrderStatus.Completed
                  ? "bg-[#2271B1] text-white"
                  : "text-[#2271B1] hover:bg-[#f0f0f0] hover:text-[#111111]"
              }`}
              onClick={() => setLocalStatusFilter(OrderStatus.Completed)}
            >
              Completado
            </button>
            <button
              className={`text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
                localStatusFilter === OrderStatus.Cancelled
                  ? "bg-[#2271B1] text-white"
                  : "text-[#2271B1] hover:bg-[#f0f0f0] hover:text-[#111111]"
              }`}
              onClick={() => setLocalStatusFilter(OrderStatus.Cancelled)}
            >
              Cancelado
            </button>
            <button
              className={`text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
                localStatusFilter === OrderStatus.Refunded
                  ? "bg-[#2271B1] text-white"
                  : "text-[#2271B1] hover:bg-[#f0f0f0] hover:text-[#111111]"
              }`}
              onClick={() => setLocalStatusFilter(OrderStatus.Refunded)}
            >
              Reembolsado
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="table border border-[#e1e1e1]">
          <thead>
            <tr className="border-b border-[#e1e1e1]">
              <th className="text-[#222222]">Orden</th>
              <th className="hidden sm:table-cell text-[#222222]">Fecha</th>
              <th className="text-[#222222]">Estado</th>
              <th className="hidden sm:table-cell text-[#222222]">Total USD</th>
              <th className="text-[#222222]">Total ARS</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, idx) => {
              const isLast = idx === orders.length - 1;
              return (
                <tr
                  key={order.id}
                  ref={isLast && nextCursor ? lastOrderRef : undefined}
                  className="text-[#333333] border-b border-[#e1e1e1]"
                >
                  <td>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="font-bold text-[#2271B1]">
                          #{order.orderNumber} - {order.user.firstName}{" "}
                          {order.user.lastName}
                        </div>
                      </div>
                      <button
                        className="btn btn-xs bg-transparent border-none shadow-none text-[#2271B1]"
                        onClick={() => setPreviewOrder(order)}
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                    {order.allowViewInvoice && (
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          className="text-xs text-[#999999] hover:underline flex items-center gap-1 cursor-pointer"
                          onClick={() =>
                            handleDownloadPDF(
                              order.id,
                              order.shippingAddress.firstName,
                              order.shippingAddress.lastName,
                              order.orderNumber
                            )
                          }
                          disabled={isDownloading === order.id}
                        >
                          {isDownloading === order.id ? (
                            <span>Descargando...</span>
                          ) : (
                            <>
                              <Image
                                src="/pdf.svg"
                                alt="PDF Icon"
                                width={16}
                                height={16}
                              />
                              Ver factura
                            </>
                          )}
                        </button>
                      </div>
                    )}
                    {/* Mobile: show date inside main cell when there's room */}
                    <div className="sm:hidden mt-1 text-sm text-[#555555]">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="hidden sm:table-cell text-[#555555]">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <OrderStatusBadge status={order.orderStatus} />
                  </td>
                  <td className="hidden sm:table-cell text-[#555555]">
                    {order.refund && order.refund.originalSubTotal ? (
                      <>
                        <span className="line-through">
                          {formatCurrency(
                            order.refund.originalSubTotal,
                            "en-US",
                            "USD"
                          )}
                        </span>{" "}
                        {formatCurrency(order.totalAmount, "en-US", "USD")}
                      </>
                    ) : (
                      formatCurrency(order.totalAmount, "en-US", "USD")
                    )}
                  </td>
                  <td>
                    {formatCurrency(order.totalAmountARS, "es-AR", "ARS")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {loading && orders.length === 0 && (
        <div className="p-4 text-center text-[#666666]">
          <LoadingSpinner />
        </div>
      )}

      {isLoadingMore && (
        <div className="flex justify-center py-4 text-[#666666]">
          <LoadingSpinner />
        </div>
      )}

      {!nextCursor && !loading && orders.length > 0 && (
        <div className="p-4 text-center text-sm text-[#222222] opacity-60">
          No hay más órdenes.
        </div>
      )}

      {orders.length === 0 && !loading && (
        <div className="p-4 text-center text-sm text-[#222222] opacity-60">
          No hay órdenes
        </div>
      )}

      {/* Modal Preview */}
      {previewOrder && (
        <dialog id="preview_modal" className="modal modal-open">
          <div className="modal-box w-full sm:max-w-3xl rounded-none border border-[#e1e1e1] bg-[#FFFFFF] text-[#222222] p-0 h-screen sm:h-auto sm:max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#FFFFFF] border-b border-[#e1e1e1] flex justify-between items-center h-12 z-30">
              <h3 className="font-bold text-lg text-[#111111] m-0 px-4">
                Orden #{previewOrder.orderNumber}
              </h3>
              <div className="flex items-center gap-4 h-full">
                <OrderStatusBadge status={previewOrder.orderStatus} />
                <button
                  className="btn btn-sm bg-transparent text-[#333333] hover:text-[#111111] shadow-none h-full w-12 border-l border-[#e1e1e1] border-t-0 border-r-0 border-b-0 m-0"
                  onClick={() => setPreviewOrder(null)}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-12 gap-4">
              {/* Client Details */}
              <div className="col-span-1 sm:col-span-5">
                <h4 className="font-bold text-md mb-2 text-[#111111]">
                  Datos del cliente:
                </h4>
                <p className="mb-2 text-[#333333]">
                  <strong>Nombre:</strong> {previewOrder.user.firstName}{" "}
                  {previewOrder.user.lastName}
                </p>
                <p className="mb-2 text-[#333333]">
                  <strong>Email:</strong>{" "}
                  <a
                    href={`mailto:${previewOrder.user.email}`}
                    className="text-[#2271B1] hover:underline"
                  >
                    {previewOrder.user.email}
                  </a>
                </p>
                <p className="mb-2 text-[#333333]">
                  <strong>DNI:</strong> {previewOrder.user.dni || "N/A"}
                </p>
                {previewOrder.user.cuit && (
                  <p className="mb-2 text-[#333333]">
                    <strong>CUIT:</strong> {previewOrder.user.cuit}
                  </p>
                )}
                <p className="mb-2 text-[#333333]">
                  <strong>Teléfono:</strong>{" "}
                  {previewOrder.shippingAddress.phoneNumber || "N/A"}
                </p>
              </div>

              {/* Shipping Details */}
              <div className="col-span-1 sm:col-span-7">
                <h4 className="font-bold text-md mb-2 text-[#111111]">
                  Detalles de envío:
                </h4>
                <p className="mb-2 text-[#333333]">
                  <strong>Nombre:</strong>{" "}
                  {previewOrder.shippingAddress.firstName}{" "}
                  {previewOrder.shippingAddress.lastName}
                </p>

                {/* Tipo de entrega */}
                {previewOrder.shippingAddress.deliveryType && (
                  <p className="mb-2 text-[#333333]">
                    <strong>Tipo de entrega:</strong>{" "}
                    {previewOrder.shippingAddress.deliveryType ===
                    DeliveryType.HomeDelivery
                      ? "Entrega a domicilio"
                      : "Punto de retiro"}
                  </p>
                )}

                {/* Dirección de entrega o punto de retiro */}
                {previewOrder.shippingAddress.deliveryType ===
                  DeliveryType.PickupPoint &&
                previewOrder.shippingAddress.pickupPointAddress ? (
                  <p className="mb-2 text-[#333333]">
                    <strong>Punto de retiro:</strong>{" "}
                    {previewOrder.shippingAddress.pickupPointAddress}
                  </p>
                ) : (
                  <p className="mb-2 text-[#333333]">
                    <strong>Dirección:</strong>{" "}
                    {previewOrder.shippingAddress.streetAddress},{" "}
                    {previewOrder.shippingAddress.city},{" "}
                    {previewOrder.shippingAddress.state}{" "}
                    {previewOrder.shippingAddress.postalCode}
                  </p>
                )}

                <p className="mb-2 text-[#333333]">
                  <strong>Método de envío:</strong>{" "}
                  {previewOrder.shippingMethod ===
                    ShippingMethod.ParcelCompany &&
                    "Transporte / Empresa de encomienda"}
                  {previewOrder.shippingMethod === ShippingMethod.Motorcycle &&
                    "Moto"}
                </p>

                {previewOrder.shippingAddress &&
                  previewOrder.shippingAddress.shippingCompany && (
                    <p className="mb-2 text-[#333333]">
                      <strong>Empresa de encomienda:</strong>{" "}
                      {previewOrder.shippingAddress.shippingCompany}
                    </p>
                  )}
                {previewOrder.shippingAddress &&
                  previewOrder.shippingAddress.declaredShippingAmount && (
                    <p className="mb-2 text-[#333333]">
                      <strong>Monto declarado:</strong>{" "}
                      {previewOrder.shippingAddress.declaredShippingAmount}
                    </p>
                  )}
                {previewOrder.shippingAddress &&
                  previewOrder.shippingAddress.deliveryWindow && (
                    <p className="mb-2 text-[#333333]">
                      <strong>Ventana de entrega:</strong>{" "}
                      {previewOrder.shippingAddress.deliveryWindow}
                    </p>
                  )}
                <p className="mb-2 text-[#333333]">
                  <strong>Método de pago:</strong>{" "}
                  {previewOrder.paymentMethod ===
                    PaymentMethod.CashOnDelivery && "Efectivo contra reembolso"}
                  {previewOrder.paymentMethod === PaymentMethod.BankTransfer &&
                    "Transferencia / Depósito bancario (4% extra)"}
                </p>
              </div>
            </div>
            <div className="p-4">
              {previewOrder.items.length > 0 && (
                <div className="mb-4">
                  <div className="overflow-x-auto">
                    <table className="table border border-[#e1e1e1]">
                      <thead>
                        <tr className="border-b border-[#e1e1e1]">
                          <th className="text-[#222222]">Producto</th>
                          <th className="text-[#222222]">Cantidad</th>
                          <th className="text-[#222222]">Subtotal USD</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewOrder.items.map(
                          (item: OrderItem, index: number) => (
                            <tr
                              key={index}
                              className="text-[#333333] border-b border-[#e1e1e1]"
                            >
                              <td>
                                <a
                                  href={`https://tienda.todoarmazonesarg.com/producto/${item.productVariant.product.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block"
                                >
                                  <div className="flex items-start gap-3">
                                    {/* Imagen del producto (responsive) */}
                                    <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 overflow-hidden rounded-md bg-gray-50 border border-gray-200">
                                      <Image
                                        src={`${
                                          process.env.NEXT_PUBLIC_API_URL
                                        }/${
                                          item.productVariant.images?.[0] ||
                                          "placeholder-image.jpg"
                                        }`}
                                        alt={`${
                                          item.productVariant.product
                                            .productModel
                                        } - ${
                                          item.productVariant.color?.name ||
                                          "variant"
                                        }`}
                                        width={64}
                                        height={64}
                                        className="object-cover w-full h-full"
                                      />
                                    </div>

                                    {/* Información del producto (truncate en pantallas pequeñas) */}
                                    <div className="flex flex-col min-w-0 flex-1">
                                      <span
                                        className="font-medium text-[#222222] truncate block"
                                        title={`${item.productVariant.product.productModel} ${item.productVariant.product.sku}`}
                                      >
                                        {
                                          item.productVariant.product
                                            .productModel
                                        }
                                      </span>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span
                                          className="text-sm text-gray-500 truncate"
                                          title={`Color: ${item.productVariant.color?.name}`}
                                        >
                                          Color:{" "}
                                          {item.productVariant.color?.name}
                                        </span>
                                        <span
                                          className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                                          style={{
                                            backgroundColor:
                                              item.productVariant.color?.hex ||
                                              "transparent",
                                          }}
                                          aria-hidden
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </a>
                              </td>
                              <td>{item.quantity}</td>
                              <td>
                                {formatCurrency(item.subTotal, "es-AR", "ARS")}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <p className="mb-2 text-[#333333]">
                <strong>Cantidad de Items:</strong> {previewOrder.itemsCount}
              </p>
              {previewOrder.refund && previewOrder.refund.originalSubTotal && (
                <p className="mb-2 text-[#333333]">
                  <strong>Subtotal USD:</strong>{" "}
                  <span style={{ textDecoration: "line-through" }}>
                    {formatCurrency(
                      previewOrder.refund.originalSubTotal,
                      "en-US",
                      "USD"
                    )}
                  </span>
                </p>
              )}
              {previewOrder.refund && (
                <>
                  <p className="mb-2 text-[#A00000]">
                    <strong>Reembolso USD:</strong>{" "}
                    {previewOrder.refund.type === "fixed"
                      ? `Fijo de ${formatCurrency(
                          previewOrder.refund.amount,
                          "en-US",
                          "USD"
                        )}`
                      : `${previewOrder.refund.amount}% (equivalente a ${formatCurrency(
                          previewOrder.refund.appliedAmount,
                          "en-US",
                          "USD"
                        )})`}
                  </p>
                  {previewOrder.refund.reason && (
                    <p className="mb-2 text-[#A00000]">
                      <strong>Razón:</strong> {previewOrder.refund.reason}
                    </p>
                  )}
                </>
              )}
              <p className="mb-2 text-[#333333]">
                <strong>Subtotal USD:</strong>{" "}
                {formatCurrency(previewOrder.subTotal, "en-US", "USD")}
              </p>
              {previewOrder.bankTransferExpense &&
                previewOrder.paymentMethod === PaymentMethod.BankTransfer && (
                  <p className="mb-2 text-[#333333]">
                    <strong>Gasto por Transferencia bancaria USD:</strong>{" "}
                    {formatCurrency(
                      previewOrder.bankTransferExpense,
                      "en-US",
                      "USD"
                    )}
                  </p>
                )}
              <p className="mb-2 text-[#333333]">
                <strong>Total USD:</strong>{" "}
                {formatCurrency(previewOrder.totalAmount, "en-US", "USD")}
              </p>
              <p className="mb-2 text-[#333333]">
                <strong>Total ARS:</strong>{" "}
                {formatCurrency(previewOrder.totalAmountARS, "es-AR", "ARS")}{" "}
                <span className="text-sm text-gray-500">
                  (tipo de cambio:{" "}
                  {formatCurrency(previewOrder.exchangeRate, "es-AR", "ARS")})
                </span>
              </p>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
};

export default OrdersPage;
