"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addressSchema, AddressFormData } from "@/schemas/order.schema";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useOrders } from "@/hooks/useOrders";
import { CartSyncError, createOrder } from "@/redux/slices/orderSlice";
import type { CreateOrderPayload } from "@/interfaces/order";
import { formatCurrency } from "@/utils/formatCurrency";
import {
  PaymentMethod,
  ShippingMethod,
  DeliveryType,
} from "@/enums/order.enum";
import Link from "next/link";
import Image from "next/image";
import { Check, Package, ShoppingBag } from "lucide-react";
import LoadingSpinner from "@/components/atoms/LoadingSpinner";
import { useRouter } from "next/navigation";

const CheckoutPage = () => {
  const { cart, loading, fetchCart, resetCart } = useCart();
  const { user } = useAuth();
  const { placeOrder, loading: orderLoading, error, resetError } = useOrders();

  const [shippingMethod, setShippingMethod] = useState(
    ShippingMethod.Motorcycle
  );
  const [paymentMethod, setPaymentMethod] = useState(
    PaymentMethod.CashOnDelivery
  );
  const [deliveryType, setDeliveryType] = useState(DeliveryType.HomeDelivery);
  const [syncError, setSyncError] = useState<CartSyncError | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AddressFormData>({
    defaultValues: {
      email: user?.email || "",
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      dni: user?.dni || "",
      cuit: user?.cuit || "",
      phoneNumber: user?.phone || "",
    },
    resolver: async (data, context, options) => {
      // Inyecta shippingMethod y deliveryType en los datos antes de validar
      return zodResolver(addressSchema)(
        {
          ...data,
          shippingMethod,
          deliveryType,
        },
        context,
        options
      );
    },
  });

  // Si el usuario cambia (ej: login), actualiza los campos del form
  useEffect(() => {
    if (user) {
      if (user.email) setValue("email", user.email);
      if (user.firstName) setValue("firstName", user.firstName);
      if (user.lastName) setValue("lastName", user.lastName);
      if (user.dni) setValue("dni", user.dni);
      if (user.phone) setValue("phoneNumber", user.phone);
    }
  }, [user, setValue]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Auto-switch to valid payment method when shipping method changes
  useEffect(() => {
    if (
      shippingMethod === ShippingMethod.ParcelCompany &&
      paymentMethod === PaymentMethod.CashOnDelivery
    ) {
      setPaymentMethod(PaymentMethod.BankTransfer);
    }
  }, [shippingMethod, paymentMethod]);

  // Auto-switch to valid shipping method when payment method changes
  useEffect(() => {
    if (
      paymentMethod === PaymentMethod.CashOnDelivery &&
      shippingMethod === ShippingMethod.ParcelCompany
    ) {
      setShippingMethod(ShippingMethod.Motorcycle);
    }
  }, [paymentMethod, shippingMethod]);

  // Reset delivery type to HomeDelivery when shipping method changes to Motorcycle
  useEffect(() => {
    if (shippingMethod === ShippingMethod.Motorcycle) {
      setDeliveryType(DeliveryType.HomeDelivery);
    }
  }, [shippingMethod]);

  const bankTransferFee =
    paymentMethod === PaymentMethod.BankTransfer
      ? (cart?.subTotal ?? 0) * 0.04
      : 0;

  // Check if cart is loading or empty
  const isCartFetching = loading.getCart;
  const isCartEmpty = !cart?.items?.length;
  const isOrderInProgress = orderLoading;

  const router = useRouter();

  const onSubmit = async (data: AddressFormData) => {
    if (error) resetError();

    // Console.log para verificar qué datos se están enviando
    console.log("=== DATOS DEL FORMULARIO ENVIADOS ===");
    console.log("Datos completos del formulario:", data);
    console.log("CUIT:", data.cuit);
    console.log("DNI:", data.dni);
    console.log("Email:", data.email);
    console.log("Nombre:", data.firstName);
    console.log("Apellido:", data.lastName);
    console.log("Teléfono:", data.phoneNumber);
    console.log("================================");

    const payload: CreateOrderPayload = {
      shippingMethod,
      shippingAddress: {
        ...data,
        deliveryType,
      },
      paymentMethod,
    };

    // Console.log del payload final que se envía al servidor
    console.log("=== PAYLOAD FINAL ENVIADO AL SERVIDOR ===");
    console.log("Payload completo:", payload);
    console.log("Dirección de envío:", payload.shippingAddress);
    console.log("================================");

    const result = await placeOrder(payload);
    
    if (createOrder.fulfilled.match(result)) {
      // Reset cart and redirect to order received page with order id
      resetCart();
      const createdOrderId = result.payload.id;
      if (createdOrderId) {
        router.push(`/checkout/order-received?orderId=${createdOrderId}`);
      } else {
        // fallback: go to orders list
        router.push(`/account/orders`);
      }
    } else if (createOrder.rejected.match(result)) {
      // Si el error es de tipo CartSyncError
      if (
        result.payload &&
        typeof result.payload === "object" &&
        "changes" in result.payload &&
        "cart" in result.payload
      ) {
        setSyncError(result.payload as CartSyncError);
        fetchCart();
      }
    }
  };

  const cartSyncModalRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (syncError && cartSyncModalRef.current) {
      cartSyncModalRef.current.showModal();
    }
  }, [syncError]);

  const closeSyncModal = () => {
    setSyncError(null);
    cartSyncModalRef.current?.close();
    resetError();
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] pt-4 pb-10 px-4">
      <nav aria-label="Checkout steps" className="flex justify-center my-8">
        <ul className="steps w-full max-w-3xl mx-auto">
          <li className="step step-neutral">
            <span className="step-icon">
              <ShoppingBag size={16} />
            </span>
            <Link
              href="/cart"
              className="text-[#111111] text-lg font-bold px-2 py-1"
              style={{
                fontSize: "1.25rem",
                minHeight: "2.5rem",
                display: "inline-block",
              }}
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
              style={{
                fontSize: "1.25rem",
                minHeight: "2.5rem",
                display: "inline-block",
              }}
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
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-none shadow-none p-8">
        {/* Address Form */}
        <form
          className="space-y-4"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <h2 className="text-2xl font-bold mb-4 text-[#111111]">
            FACTURACIÓN Y ENVÍO
          </h2>

          {/* Shipping and Payment Methods */}
          <div className="flex flex-col gap-4 mb-6">
            {/* Método de pago */}
            <div>
              <label className="block text-sm text-[#7A7A7A] mb-2">
                Método de pago *
              </label>
              <div className="flex flex-col gap-2">
                {[PaymentMethod.CashOnDelivery, PaymentMethod.BankTransfer].map(
                  (method) => {
                    const isRestricted =
                      shippingMethod === ShippingMethod.ParcelCompany &&
                      method === PaymentMethod.CashOnDelivery;

                    return (
                      <label
                        key={method}
                        className={`flex items-center gap-2 ${
                          isRestricted
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
                        onClick={
                          isRestricted
                            ? undefined
                            : () => setPaymentMethod(method)
                        }
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method}
                          checked={paymentMethod === method}
                          disabled={isRestricted}
                          onChange={() => {
                            if (!isRestricted) {
                              setPaymentMethod(method);
                            }
                          }}
                          className={`radio border-[#e1e1e1] checked:bg-[#222222] ${
                            isRestricted ? "pointer-events-none" : ""
                          }`}
                        />
                        <span className="text-[#222222] text-sm">
                          {method === PaymentMethod.BankTransfer
                            ? "Transferencia / Depósito bancario"
                            : "Efectivo contra reembolso"}{" "}
                          {method === PaymentMethod.BankTransfer && (
                            <span className="text-xs text-[#7A7A7A]">
                              (4% extra)
                            </span>
                          )}
                          {method === PaymentMethod.CashOnDelivery && (
                            <span className="text-xs text-[#7A7A7A]">
                              (Solo para CABA y AMBA)
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  }
                )}
              </div>
            </div>

            {/* Método de envío */}
            <div>
              <label className="block text-sm text-[#7A7A7A] mb-2">
                Método de envío *
              </label>
              <div className="flex flex-col gap-2">
                {[ShippingMethod.Motorcycle, ShippingMethod.ParcelCompany].map(
                  (method) => {
                    const isRestricted =
                      paymentMethod === PaymentMethod.CashOnDelivery &&
                      method === ShippingMethod.ParcelCompany;

                    return (
                      <label
                        key={method}
                        className={`flex items-center gap-2 ${
                          isRestricted
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
                        onClick={
                          isRestricted
                            ? undefined
                            : () => setShippingMethod(method)
                        }
                      >
                        <input
                          type="radio"
                          name="shippingMethod"
                          value={method}
                          checked={shippingMethod === method}
                          disabled={isRestricted}
                          onChange={() => {
                            if (!isRestricted) {
                              setShippingMethod(method);
                            }
                          }}
                          className={`radio border-[#e1e1e1] checked:bg-[#222222] ${
                            isRestricted ? "pointer-events-none" : ""
                          }`}
                        />
                        <span className="text-[#222222] text-sm">
                          {method === ShippingMethod.Motorcycle
                            ? "Moto"
                            : "Transporte/Empresa de encomienda"}{" "}
                          <span className="text-xs text-[#7A7A7A]">
                            (Costo de envío extra a cargo del Cliente)
                          </span>
                        </span>
                      </label>
                    );
                  }
                )}
              </div>
            </div>

            {/* Tipo de entrega (solo para ParcelCompany) */}
            {shippingMethod === ShippingMethod.ParcelCompany && (
              <div>
                <label className="block text-sm text-[#7A7A7A] mb-2">
                  Tipo de entrega *
                </label>
                <div className="flex flex-col gap-2">
                  {[DeliveryType.HomeDelivery, DeliveryType.PickupPoint].map(
                    (type) => (
                      <label
                        key={type}
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => setDeliveryType(type)}
                      >
                        <input
                          type="radio"
                          name="deliveryType"
                          value={type}
                          checked={deliveryType === type}
                          onChange={() => setDeliveryType(type)}
                          className="radio border-[#e1e1e1] checked:bg-[#222222]"
                        />
                        <span className="text-[#222222] text-sm">
                          {type === DeliveryType.HomeDelivery
                            ? "Entrega a domicilio"
                            : "Retiro en punto de entrega"}
                        </span>
                      </label>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mb-4">
            <div>
              <label
                htmlFor="deliveryWindow"
                className="block mb-1 text-sm"
                style={{ color: "#7A7A7A" }}
              >
                Franja horaria{" "}
                {shippingMethod === ShippingMethod.Motorcycle
                  ? "* (Mínimo 4 horas)"
                  : "(opcional)"}
              </label>
              <input
                id="deliveryWindow"
                type="text"
                {...register("deliveryWindow")}
                className="input w-full border rounded-none bg-[#FFFFFF] text-[#222222]"
                style={{ borderColor: "#e1e1e1" }}
                placeholder="Ej: 11:00 - 16:00"
              />
              {shippingMethod === ShippingMethod.Motorcycle &&
                errors.deliveryWindow && (
                  <span className="text-red-500 text-sm">
                    {errors.deliveryWindow.message}
                  </span>
                )}
            </div>

            {/* Campos condicionales según método de envío */}

            {shippingMethod === ShippingMethod.ParcelCompany && (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="shippingCompany"
                    className="block mb-1 text-sm"
                    style={{ color: "#7A7A7A" }}
                  >
                    Transporte / Empresa de encomienda *
                  </label>
                  <input
                    id="shippingCompany"
                    type="text"
                    {...register("shippingCompany")}
                    className="input w-full border rounded-none bg-[#FFFFFF] text-[#222222]"
                    style={{ borderColor: "#e1e1e1" }}
                  />
                  {errors.shippingCompany && (
                    <span className="text-red-500 text-sm">
                      {errors.shippingCompany.message}
                    </span>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="declaredShippingAmount"
                    className="block mb-1 text-sm"
                    style={{ color: "#7A7A7A" }}
                  >
                    Valor declarado (opcional)
                  </label>
                  <input
                    id="declaredShippingAmount"
                    type="text"
                    {...register("declaredShippingAmount")}
                    className="input w-full border rounded-none bg-[#FFFFFF] text-[#222222]"
                    style={{ borderColor: "#e1e1e1" }}
                  />
                  {errors.declaredShippingAmount && (
                    <span className="text-red-500 text-sm">
                      {errors.declaredShippingAmount.message}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Campos básicos */}
            {[
              ["firstName", "Nombre *"],
              ["lastName", "Apellidos *"],
              ["email", "Email *", "Email"],
              ["phoneNumber", "Teléfono *"],
              ["dni", "DNI *", "DNI"],
              ["cuit", "CUIT (opcional)", "CUIT"],
            ].map(([name, label, type = "text"]) => (
              <div key={name} className={name === "email" ? "col-span-2" : ""}>
                <label
                  htmlFor={name}
                  className="block mb-1 text-sm"
                  style={{ color: "#7A7A7A" }}
                >
                  {label}
                </label>
                <input
                  id={name}
                  type={type}
                  {...register(name as keyof AddressFormData)}
                  className="input w-full border rounded-none bg-[#FFFFFF] text-[#222222]"
                  style={{ borderColor: "#e1e1e1" }}
                />
                {errors[name as keyof AddressFormData] && (
                  <span className="text-red-500 text-sm">
                    {errors[name as keyof AddressFormData]?.message}
                  </span>
                )}
              </div>
            ))}

            {/* Campo de dirección (solo para entrega a domicilio) */}
            {(shippingMethod !== ShippingMethod.ParcelCompany ||
              deliveryType === DeliveryType.HomeDelivery) && (
              <div className="col-span-2">
                <label
                  htmlFor="streetAddress"
                  className="block mb-1 text-sm"
                  style={{ color: "#7A7A7A" }}
                >
                  Dirección *
                </label>
                <input
                  id="streetAddress"
                  type="text"
                  {...register("streetAddress")}
                  className="input w-full border rounded-none bg-[#FFFFFF] text-[#222222]"
                  style={{ borderColor: "#e1e1e1" }}
                />
                {errors.streetAddress && (
                  <span className="text-red-500 text-sm">
                    {errors.streetAddress.message}
                  </span>
                )}
              </div>
            )}

            {/* Campo de punto de retiro (solo para pickup point) */}
            {shippingMethod === ShippingMethod.ParcelCompany &&
              deliveryType === DeliveryType.PickupPoint && (
                <div className="col-span-2">
                  <label
                    htmlFor="pickupPointAddress"
                    className="block mb-1 text-sm"
                    style={{ color: "#7A7A7A" }}
                  >
                    Dirección del punto de retiro *
                  </label>
                  <input
                    id="pickupPointAddress"
                    type="text"
                    {...register("pickupPointAddress")}
                    className="input w-full border rounded-none bg-[#FFFFFF] text-[#222222]"
                    style={{ borderColor: "#e1e1e1" }}
                    placeholder="Ej: Sucursal Correo Argentino - Av. Corrientes 500"
                  />
                  {errors.pickupPointAddress && (
                    <span className="text-red-500 text-sm">
                      {errors.pickupPointAddress.message}
                    </span>
                  )}
                </div>
              )}

            {/* Campos de ubicación */}
            {[
              ["city", "Ciudad *", "Ciudad"],
              ["state", "Provincia *"],
              ["postalCode", "Código Postal *"],
              ["companyName", "Nombre de Empresa (opcional)"],
            ].map(([name, label, type = "text"]) => (
              <div key={name}>
                <label
                  htmlFor={name}
                  className="block mb-1 text-sm"
                  style={{ color: "#7A7A7A" }}
                >
                  {label}
                </label>
                <input
                  id={name}
                  type={type}
                  {...register(name as keyof AddressFormData)}
                  className="input w-full border rounded-none bg-[#FFFFFF] text-[#222222]"
                  style={{ borderColor: "#e1e1e1" }}
                />
                {errors[name as keyof AddressFormData] && (
                  <span className="text-red-500 text-sm">
                    {errors[name as keyof AddressFormData]?.message}
                  </span>
                )}
              </div>
            ))}
          </div>
        </form>
        {/* Cart Summary */}
        <div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: "#222222" }}>
            TU PEDIDO
          </h2>
          {isCartFetching ? (
            <div className="flex justify-center items-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-4">
              {cart?.items.length ? (
                cart.items.map((item, idx) => {
                  const variant =
                    typeof item.productVariant === "string"
                      ? null
                      : item.productVariant;
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3 border-b pb-2"
                    >
                      {variant && (
                        <Image
                          src={
                            variant.images?.[0]
                              ? `${process.env.NEXT_PUBLIC_API_URL}/${variant.thumbnail}`
                              : "/placeholder.png"
                          }
                          width={40}
                          height={40}
                          alt={variant.product.productModel}
                          className="w-10 h-10 object-cover rounded-none"
                        />
                      )}

                      <div className="flex-1">
                        <div
                          className="font-semibold"
                          style={{ color: "#222222" }}
                        >
                          {variant?.product.productModel}
                        </div>
                        <div className="text-sm" style={{ color: "#222222" }}>
                          Color: {variant?.color.name}
                        </div>
                        <div className="text-sm" style={{ color: "#222222" }}>
                          Cantidad: {item.quantity}
                        </div>
                      </div>
                      <div className="font-bold" style={{ color: "#222222" }}>
                        {formatCurrency(item.subTotal, "en-US", "USD")}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-gray-500" style={{ color: "#222222" }}>
                  Tu carrito está vacío.
                </div>
              )}
            </div>
          )}
          <div className="mt-6 border-t pt-4">
            <div
              className="flex justify-between text-lg font-semibold"
              style={{ color: "#222222" }}
            >
              <span>Subtotal</span>
              <span>{formatCurrency(cart?.subTotal ?? 0, "en-US", "USD")}</span>
            </div>
            {paymentMethod === PaymentMethod.BankTransfer && (
              <div
                className="flex justify-between text-base"
                style={{ color: "#222222" }}
              >
                <span>Gasto por transferencia bancaria</span>
                <span>{formatCurrency(bankTransferFee, "en-US", "USD")}</span>
              </div>
            )}
            <div
              className="flex justify-between text-lg font-semibold"
              style={{ color: "#222222" }}
            >
              <span>TOTAL</span>
              <span>
                {formatCurrency(
                  (cart?.subTotal ?? 0) + bankTransferFee,
                  "en-US",
                  "USD"
                )}
              </span>
            </div>
            {typeof error === "string" && error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
            <button
              type="submit"
              className={`mt-4 btn rounded-none shadow-none border-none h-12 px-6 w-full transition-colors duration-300 ease-in-out ${
                isOrderInProgress || isCartFetching || isCartEmpty
                  ? "bg-[#666666] cursor-not-allowed pointer-events-none"
                  : "bg-[#222222] hover:bg-[#111111]"
              } text-white`}
              onClick={
                isOrderInProgress || isCartFetching || isCartEmpty
                  ? undefined
                  : handleSubmit(onSubmit)
              }
            >
              {isOrderInProgress ? (
                <LoadingSpinner />
              ) : isCartEmpty ? (
                "Carrito vacío"
              ) : (
                "Realizar pedido"
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto mt-8 text-center">
        <p className="text-sm text-gray-500" style={{ color: "#7A7A7A" }}>
          Al realizar el pedido, aceptas nuestros{" "}
          <a
            href="/terms"
            className="text-blue-600 hover:underline"
            style={{ color: "#007BFF" }}
          >
            Términos y Condiciones
          </a>
        </p>
      </div>

      {/* Modal de sincronización de carrito */}
      <dialog id="cart_sync_modal" className="modal" ref={cartSyncModalRef}>
        <div className="modal-box bg-white text-[#111111] rounded-none">
          <h3 className="font-bold text-lg">El carrito fue actualizado</h3>
          <p className="py-4">{syncError?.message}</p>
          <ul className="py-2">
            {syncError?.changes.map((change, idx) => {
              const variant = change.productVariant;
              return (
                <li key={idx} className="mb-2 flex items-center gap-3">
                  {variant.images?.[0] && (
                    <Image
                      src={
                        variant.images[0]
                          ? `${process.env.NEXT_PUBLIC_API_URL}/${variant.thumbnail}`
                          : "/placeholder.png"
                      }
                      width={40}
                      height={40}
                      alt={variant.product.productModel}
                      className="w-10 h-10 object-cover rounded-none"
                    />
                  )}
                  <div>
                    <b>
                      {variant.product.productModel} ({variant.product.sku})
                    </b>
                    :&nbsp;
                    {change.removed
                      ? "Eliminado por falta de stock"
                      : `Cantidad ajustada de ${change.oldQuantity} a ${change.newQuantity} (stock disponible: ${change.stock})`}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="modal-action">
            <button
              className="btn rounded-none shadow-none border-none transition-colors duration-300 ease-in-out h-12 text-base px-6 w-full"
              onClick={closeSyncModal}
            >
              Entendido
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
};

export default CheckoutPage;
