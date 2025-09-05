"use client";

import { useState } from "react";
import { useUsers } from "@/hooks/useUsers";
import { useProducts } from "@/hooks/useProducts";
import useOrders from "@/hooks/useOrders";
import { ShippingMethod, PaymentMethod } from "@/enums/order.enum";
import type { IUser } from "@/interfaces/user";
import type { Product, ProductVariant } from "@/interfaces/product";
import type { CreateOrderAdminPayload } from "@/redux/slices/orderSlice";

const initialAddress = {
  firstName: "",
  lastName: "",
  companyName: "",
  email: "",
  phoneNumber: "",
  dni: "",
  streetAddress: "",
  city: "",
  state: "",
  postalCode: "",
  deliveryWindow: "",
  declaredShippingAmount: "",
  shippingCompany: "",
};

function CreateOrderPage() {
  // Orders
  const { createOrderAsAdmin, loading, error } = useOrders();
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [userIdError, setUserIdError] = useState<string>("");

  // User search state
  const [userEmail, setUserEmail] = useState("");
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const {
    userByEmail,
    loading: loadingUserByEmail,
    error: errorUserByEmail,
    findUserByEmail,
  } = useUsers();

  // Product search state
  const [productQuery, setProductQuery] = useState("");
  const { searchProducts, searchResults, searchLoading } = useProducts();
  const [selectedProducts, setSelectedProducts] = useState<
    Array<{ variant: ProductVariant; product: Product; quantity: number }>
  >([]);

  // Address and order details
  const [address, setAddress] = useState<typeof initialAddress>({
    ...initialAddress,
  });
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>(
    ShippingMethod.Motorcycle
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.BankTransfer
  );
  const [createdAt, setCreatedAt] = useState("");
  const [allowViewInvoice, setAllowViewInvoice] = useState(false);
  const handleUserSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (userEmail) findUserByEmail(userEmail);
  };

  const handleSelectUser = () => {
    if (userByEmail) {
      setSelectedUser(userByEmail);
      // Auto-completar campos de dirección con información del usuario
      setAddress((prev) => ({
        ...prev,
        firstName: userByEmail.firstName || "",
        lastName: userByEmail.lastName || "",
        email: userByEmail.email || "",
        dni: userByEmail.dni || "",
        phoneNumber: userByEmail.phone || "",
      }));
    }
  };

  const handleProductSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (productQuery) searchProducts(productQuery);
  };

  const handleAddVariant = (variant: ProductVariant, product: Product) => {
    if (selectedProducts.some((v) => v.variant.id === variant.id)) return;
    setSelectedProducts((prev) => [...prev, { variant, product, quantity: 1 }]);
  };

  const handleRemoveVariant = (variantId: string) => {
    setSelectedProducts((prev) =>
      prev.filter((v) => v.variant.id !== variantId)
    );
  };

  const handleQuantityChange = (variantId: string, qty: number) => {
    setSelectedProducts((prev) =>
      prev.map((v) =>
        v.variant.id === variantId ? { ...v, quantity: Math.max(1, qty) } : v
      )
    );
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setUserIdError("");
    if (!selectedUser) return;
    if (selectedProducts.length === 0) return;
    // Validar que el userId es un ObjectId válido (24 hex chars)
    const userId = selectedUser.id;
    const isValidObjectId =
      typeof userId === "string" && /^[a-fA-F0-9]{24}$/.test(userId);
    if (!isValidObjectId) {
      setUserIdError(
        "El usuario seleccionado no tiene un ID válido para crear la orden. (Debe ser un ObjectId de MongoDB)"
      );
      return;
    }
    // Build payload
    const payload: CreateOrderAdminPayload = {
      userId,
      items: selectedProducts.map((v) => ({
        productVariantId: v.variant.id,
        quantity: v.quantity,
      })),
      shippingMethod,
      shippingAddress: address,
      paymentMethod,
      ...(address.deliveryWindow && { deliveryWindow: address.deliveryWindow }),
      ...(address.declaredShippingAmount && {
        declaredShippingAmount: address.declaredShippingAmount,
      }),
      ...(createdAt && { createdAt }),
      allowViewInvoice,
    };
    createOrderAsAdmin(
      payload,
      (order) => {
        setSuccessMsg(`Orden #${order.orderNumber} creada exitosamente.`);
        setUserIdError("");
        // Reset form
        setSelectedUser(null);
        setSelectedProducts([]);
        setAddress(initialAddress);
        setCreatedAt("");
        setAllowViewInvoice(false);
        setUserEmail("");
        setProductQuery("");
      },
      (err) => {
        setSuccessMsg("");
        console.error("Error al crear la orden:", err);
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] pt-4 pb-10 px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-none shadow-none p-8">
        {/* Columna 1: Usuario, productos y dirección */}
        <form className="space-y-4" onSubmit={handleCreateOrder} noValidate>
          <h2 className="text-2xl font-bold mb-4 text-[#111111]">
            CREAR ORDEN
          </h2>
          {/* Buscar usuario por email */}
          <div className="mb-2">
            <label className="block mb-1 text-sm" style={{ color: "#7A7A7A" }}>
              Buscar usuario por email *
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Email del usuario"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="input w-full border rounded-none bg-[#FFFFFF] text-[#222222]"
                style={{ borderColor: "#e1e1e1" }}
                required
              />
              <button
                type="button"
                className="btn rounded-none shadow-none border-none h-12 px-4 text-white bg-[#222222]"
                onClick={handleUserSearch}
              >
                Buscar
              </button>
            </div>
            {loadingUserByEmail && (
              <div className="text-[#222222] mt-1">Buscando usuario...</div>
            )}
            {errorUserByEmail && (
              <div className="text-red-500 text-sm mt-1">
                {errorUserByEmail}
              </div>
            )}
            {userByEmail && !selectedUser && (
              <div className="mt-2 p-2 border rounded bg-[#f5f5f5] flex items-center justify-between">
                <span className="text-[#222222]">
                  {userByEmail.displayName} ({userByEmail.email})
                </span>
                <button
                  className="btn btn-sm text-white bg-[#388e3c] border-[#388e3c] rounded-none"
                  onClick={handleSelectUser}
                >
                  Seleccionar
                </button>
              </div>
            )}
            {selectedUser && (
              <div className="mt-2 p-2 border rounded bg-[#e8f5e9] flex items-center justify-between">
                <span className="text-[#222222]">
                  Usuario seleccionado: {selectedUser.displayName} (
                  {selectedUser.email})
                </span>
                <button
                  className="btn btn-sm text-white bg-[#d32f2f] border-[#d32f2f] rounded-none"
                  onClick={() => {
                    setSelectedUser(null);
                    // Restablecer campos auto-completados del usuario
                    setAddress((prev) => ({
                      ...prev,
                      firstName: "",
                      lastName: "",
                      email: "",
                      dni: "",
                      phoneNumber: "",
                    }));
                  }}
                >
                  Quitar
                </button>
              </div>
            )}
          </div>

          {/* Buscar y agregar productos/variantes */}
          <div className="mb-2">
            <label className="block mb-1 text-sm" style={{ color: "#7A7A7A" }}>
              Buscar producto o SKU *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Buscar producto o SKU"
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                className="input w-full border rounded-none bg-[#FFFFFF] text-[#222222]"
                style={{ borderColor: "#e1e1e1" }}
              />
              <button
                type="button"
                className="btn rounded-none shadow-none border-none h-12 px-4 text-white bg-[#222222]"
                onClick={handleProductSearch}
              >
                Buscar
              </button>
            </div>
            {searchLoading && (
              <div className="text-[#222222] mt-1">Buscando productos...</div>
            )}
            {searchResults.length > 0 && (
              <div className="mt-2">
                <div className="font-semibold mb-1 text-[#222222]">
                  Resultados:
                </div>
                <ul className="space-y-1">
                  {searchResults.map((product) => (
                    <li
                      key={product.id}
                      className="border rounded p-2 bg-white"
                    >
                      <div className="font-medium text-[#222222]">
                        {product.productModel} ({product.sku})
                      </div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {product.variants.map((variant) => (
                          <button
                            key={variant.id}
                            className="btn btn-xs btn-outline text-[#222222] border-[#bdbdbd] bg-white rounded-none"
                            onClick={() => handleAddVariant(variant, product)}
                            disabled={selectedProducts.some(
                              (v) => v.variant.id === variant.id
                            )}
                          >
                            {variant.color.name} (Stock: {variant.stock})
                          </button>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Lista de variantes seleccionadas */}
          {selectedProducts.length > 0 && (
            <div className="mb-2">
              <div className="font-semibold mb-1 text-[#222222]">
                Ítems de la orden:
              </div>
              <ul className="space-y-2">
                {selectedProducts.map((item) => (
                  <li
                    key={item.variant.id}
                    className="border rounded p-2 flex items-center gap-2 bg-white"
                  >
                    <span className="text-[#222222]">
                      {item.product.productModel} - {item.variant.color.name}
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        handleQuantityChange(
                          item.variant.id,
                          Number(e.target.value)
                        )
                      }
                      className="input input-xs w-16 text-[#222222] bg-white border-[#bdbdbd] rounded-none"
                    />
                    <button
                      className="btn btn-xs text-white bg-[#d32f2f] border-[#d32f2f] rounded-none"
                      onClick={() => handleRemoveVariant(item.variant.id)}
                    >
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Formulario de dirección y detalles de envío */}
          <div className="grid grid-cols-2 gap-4">
            {[
              "firstName",
              "lastName",
              "email",
              "phoneNumber",
              "dni",
              "streetAddress",
              "city",
              "state",
              "postalCode",
              "companyName",
            ].map((name) => (
              <div
                key={name}
                className={
                  name === "email" || name === "streetAddress"
                    ? "col-span-2"
                    : ""
                }
              >
                <label
                  htmlFor={name}
                  className="block mb-1 text-sm"
                  style={{ color: "#7A7A7A" }}
                >
                  {name === "firstName"
                    ? "Nombre *"
                    : name === "lastName"
                    ? "Apellidos *"
                    : name === "email"
                    ? "Email *"
                    : name === "phoneNumber"
                    ? "Teléfono *"
                    : name === "dni"
                    ? "DNI *"
                    : name === "streetAddress"
                    ? "Dirección *"
                    : name === "city"
                    ? "Ciudad *"
                    : name === "state"
                    ? "Provincia *"
                    : name === "postalCode"
                    ? "Código Postal *"
                    : name === "companyName"
                    ? "Nombre de Empresa (opcional)"
                    : name}
                </label>
                <input
                  id={name}
                  type={name === "email" ? "email" : "text"}
                  value={address[name as keyof typeof address]}
                  onChange={handleAddressChange}
                  name={name}
                  className="input w-full border rounded-none bg-[#FFFFFF] text-[#222222]"
                  style={{ borderColor: "#e1e1e1" }}
                  required={!["companyName"].includes(name)}
                />
              </div>
            ))}
          </div>
          {/* Métodos de envío y pago */}
          <div className="flex flex-col gap-4 mt-4">
            <div>
              <label className="block text-sm text-[#7A7A7A] mb-2">
                Método de envío *
              </label>
              <div className="flex flex-col gap-2">
                {[ShippingMethod.Motorcycle, ShippingMethod.ParcelCompany].map(
                  (method) => {
                    return (
                      <label
                        key={method}
                        className={`flex items-center gap-2 cursor-pointer`}
                      >
                        <input
                          type="radio"
                          name="shippingMethod"
                          value={method}
                          checked={shippingMethod === method}
                          onChange={() => setShippingMethod(method)}
                          className="radio border-[#e1e1e1] checked:bg-[#222222]"
                        />
                        <span className="text-[#222222] text-sm">
                          {method === ShippingMethod.Motorcycle
                            ? "Moto"
                            : "Transporte/Empresa de encomienda"}
                          <span className="text-xs text-[#7A7A7A]">
                            {" "}
                            (Costo de envío extra a cargo del Cliente)
                          </span>
                        </span>
                      </label>
                    );
                  }
                )}
              </div>
            </div>
            {shippingMethod === ShippingMethod.Motorcycle && (
              <div className="col-span-2">
                <label
                  htmlFor="deliveryWindow"
                  className="block mb-1 text-sm"
                  style={{ color: "#7A7A7A" }}
                >
                  Franja horaria (opcional)
                </label>
                <input
                  id="deliveryWindow"
                  type="text"
                  name="deliveryWindow"
                  value={address.deliveryWindow}
                  onChange={handleAddressChange}
                  className="input w-full border rounded-none bg-[#FFFFFF] text-[#222222]"
                  style={{ borderColor: "#e1e1e1" }}
                />
              </div>
            )}
            {shippingMethod === ShippingMethod.ParcelCompany && (
              <>
                <div className="col-span-2">
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
                    name="shippingCompany"
                    value={address.shippingCompany}
                    onChange={handleAddressChange}
                    className="input w-full border rounded-none bg-[#FFFFFF] text-[#222222]"
                    style={{ borderColor: "#e1e1e1" }}
                  />
                </div>
                <div className="col-span-2">
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
                    name="declaredShippingAmount"
                    value={address.declaredShippingAmount}
                    onChange={handleAddressChange}
                    className="input w-full border rounded-none bg-[#FFFFFF] text-[#222222]"
                    style={{ borderColor: "#e1e1e1" }}
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm text-[#7A7A7A] mb-2">
                Método de pago *
              </label>
              <div className="flex flex-col gap-2">
                {[PaymentMethod.BankTransfer, PaymentMethod.CashOnDelivery].map(
                  (method) => (
                    <label
                      key={method}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method}
                        checked={paymentMethod === method}
                        onChange={() => setPaymentMethod(method)}
                        className="radio border-[#e1e1e1] checked:bg-[#222222]"
                      />
                      <span className="text-[#222222] text-sm">
                        {method === PaymentMethod.BankTransfer
                          ? "Transferencia / Depósito bancario"
                          : "Efectivo contra reembolso"}
                        {method === PaymentMethod.BankTransfer && (
                          <span className="text-xs text-[#7A7A7A]">
                            {" "}
                            (4% extra)
                          </span>
                        )}
                      </span>
                    </label>
                  )
                )}
              </div>
            </div>
          </div>
          <div>
            <label className="block mb-1 text-[#222222]">
              Fecha personalizada (opcional):
            </label>
            <input
              type="datetime-local"
              value={createdAt}
              onChange={(e) => setCreatedAt(e.target.value)}
              className="input w-full border rounded-none bg-[#FFFFFF] text-[#222222]"
              style={{ borderColor: "#e1e1e1" }}
            />
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allowViewInvoice}
                onChange={(e) => setAllowViewInvoice(e.target.checked)}
                className="checkbox checkbox-sm border-[#e1e1e1] checked:bg-[#222222] checked:border-[#222222]"
              />
              <span className="text-sm text-[#222222]">
                Permitir ver factura de compra
              </span>
            </label>
          </div>
          <button
            type="submit"
            className="mt-4 btn rounded-none shadow-none border-none h-12 px-6 w-full transition-colors duration-300 ease-in-out text-white bg-[#388e3c] border-[#388e3c]"
            disabled={loading || !selectedUser || selectedProducts.length === 0}
          >
            {loading ? "Creando orden..." : "Crear orden"}
          </button>
          {userIdError && (
            <div className="text-red-500 text-sm mt-2">{userIdError}</div>
          )}
          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
          {successMsg && (
            <div className="text-green-600 font-semibold mt-2">
              {successMsg}
            </div>
          )}
        </form>
        {/* Columna 2: Resumen de la orden (opcional, puedes agregar un resumen similar al checkout si lo deseas) */}
      </div>
    </div>
  );
}

export default CreateOrderPage;
