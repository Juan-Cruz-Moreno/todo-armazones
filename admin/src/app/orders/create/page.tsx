"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useUsers } from "@/hooks/useUsers";
import { useProducts } from "@/hooks/useProducts";
import useOrders from "@/hooks/useOrders";
import { ShippingMethod, PaymentMethod, DeliveryType } from "@/enums/order.enum";
import type { IUser } from "@/interfaces/user";
import type { Product, ProductVariant } from "@/interfaces/product";
import type { CreateOrderAdminPayload } from "@/redux/slices/orderSlice";
import { debounce } from "@/utils/debounce";

const initialAddress = {
  firstName: "",
  lastName: "",
  companyName: "",
  email: "",
  phoneNumber: "",
  dni: "",
  cuit: "",
  streetAddress: "",
  city: "",
  state: "",
  postalCode: "",
  deliveryWindow: "",
  declaredShippingAmount: "",
  shippingCompany: "",
  pickupPointAddress: "",
};

function CreateOrderPage() {
  // Orders
  const { createOrderAsAdmin, loading, error } = useOrders();
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [userIdError, setUserIdError] = useState<string>("");

  // User search state (cambiado a búsqueda flexible)
  const [userQuery, setUserQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const {
    searchResults: userSearchResults,
    searchNextCursor,
    searchLoading: loadingUserSearch,
    searchError: errorUserSearch,
    searchUsersByQuery,
    clearSearch,
    getMostRecentAddress,
    recentAddress,
    loadingRecentAddress,
    clearRecentAddress,
  } = useUsers();

  // Ref para el último elemento de la lista (para paginación por scroll)
  const lastUserRef = useRef<HTMLDivElement | null>(null);

  // Product search state
  const { searchProducts, searchResults, searchLoading, clearSearchResults } = useProducts();
  const [selectedProducts, setSelectedProducts] = useState<
    Array<{ variant: ProductVariant; product: Product; quantity: number }>
  >([]);

  // Estados para el modal de añadir items
  const [addItemsModal, setAddItemsModal] = useState<{
    isOpen: boolean;
    productQuery: string;
    quantities: Record<string, number>; // variantId -> quantity
  }>({
    isOpen: false,
    productQuery: "",
    quantities: {},
  });

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
  const [deliveryType, setDeliveryType] = useState<DeliveryType>(
    DeliveryType.HomeDelivery
  );
  const [createdAt, setCreatedAt] = useState("");
  const [allowViewInvoice, setAllowViewInvoice] = useState(false);

  const handleSelectUser = (user: IUser) => {
    setSelectedUser(user);
    // Auto-completar campos de dirección con información del usuario
    setAddress((prev) => ({
      ...prev,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      dni: user.dni || "",
      cuit: user.cuit || "",
      phoneNumber: user.phone || "",
    }));
    // Cargar dirección más reciente del usuario
    getMostRecentAddress(user.id);
    // Limpiar búsqueda
    clearSearch();
    setUserQuery("");
  };

  // Funciones para manejar el modal de añadir items
  const handleOpenAddItemsModal = () => {
    setAddItemsModal({ isOpen: true, productQuery: "", quantities: {} });
  };

  const handleCloseAddItemsModal = () => {
    setAddItemsModal({ isOpen: false, productQuery: "", quantities: {} });
    clearSearchResults();
  };

  // Función para actualizar la cantidad de una variante en el modal
  const handleVariantQuantityChange = (variantId: string, quantity: number) => {
    setAddItemsModal((prev) => ({
      ...prev,
      quantities: {
        ...prev.quantities,
        [variantId]: Math.max(1, quantity),
      },
    }));
  };

  // Función para agregar variante con cantidad desde el modal
  const handleAddVariantWithQuantity = async (variant: ProductVariant, product: Product) => {
    const quantity = addItemsModal.quantities[variant.id] || 1;
    handleAddVariant(variant, product);
    // Actualizar la cantidad en el state de selectedProducts
    setSelectedProducts((prev) => 
      prev.map((item) => 
        item.variant.id === variant.id 
          ? { ...item, quantity: quantity }
          : item
      )
    );
    // Resetear la cantidad de esa variante específica a 1
    setAddItemsModal((prev) => ({
      ...prev,
      quantities: {
        ...prev.quantities,
        [variant.id]: 1,
      },
    }));
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

  // Auto-completar campos de dirección cuando se cargue la dirección más reciente
  useEffect(() => {
    if (recentAddress) {
      setAddress({
        firstName: recentAddress.firstName || "",
        lastName: recentAddress.lastName || "",
        companyName: recentAddress.companyName || "",
        email: recentAddress.email || "",
        phoneNumber: recentAddress.phoneNumber || "",
        dni: recentAddress.dni || "",
        cuit: recentAddress.cuit || "",
        streetAddress: recentAddress.streetAddress || "",
        city: recentAddress.city || "",
        state: recentAddress.state || "",
        postalCode: recentAddress.postalCode || "",
        deliveryWindow: recentAddress.deliveryWindow || "",
        declaredShippingAmount: recentAddress.declaredShippingAmount || "",
        shippingCompany: recentAddress.shippingCompany || "",
        pickupPointAddress: recentAddress.pickupPointAddress || "",
      });
      
      // Establecer el tipo de entrega si está disponible
      if (recentAddress.deliveryType) {
        setDeliveryType(recentAddress.deliveryType);
      }
    }
  }, [recentAddress]);

  // Limpiar dirección reciente al desmontar el componente
  useEffect(() => {
    return () => {
      clearRecentAddress();
    };
  }, [clearRecentAddress]);

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
      shippingAddress: {
        ...address,
        deliveryType,
      },
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
        setDeliveryType(DeliveryType.HomeDelivery);
        setUserQuery("");
        setAddItemsModal({ isOpen: false, productQuery: "", quantities: {} });
        clearRecentAddress();
      },
      (err) => {
        setSuccessMsg("");
        console.error("Error al crear la orden:", err);
      }
    );
  };

  // Función para cargar más resultados (debounced)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadMoreUsers = useCallback(
    debounce(() => {
      if (searchNextCursor && !loadingUserSearch && userQuery.trim()) {
        searchUsersByQuery(userQuery.trim(), "firstName,lastName,displayName,email", 20, searchNextCursor);
      }
    }, 300),
    [searchNextCursor, loadingUserSearch, userQuery, searchUsersByQuery]
  );

  // useEffect para configurar IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreUsers();
        }
      },
      { threshold: 1.0 }
    );

    if (lastUserRef.current) {
      observer.observe(lastUserRef.current);
    }

    return () => {
      if (lastUserRef.current) {
        observer.unobserve(lastUserRef.current);
      }
    };
  }, [loadMoreUsers]);

  // Limpiar ref cuando cambie la búsqueda o se seleccione usuario
  useEffect(() => {
    lastUserRef.current = null;
  }, [userQuery, selectedUser]);

  // useEffect para búsqueda automática con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (userQuery.trim()) {
        searchUsersByQuery(userQuery.trim(), "firstName,lastName,displayName,email", 20);
      } else {
        clearSearch();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [userQuery, searchUsersByQuery, clearSearch]); // Incluir funciones para evitar stale closures

  // useEffect para búsqueda automática de productos con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (addItemsModal.productQuery.trim()) {
        searchProducts({ q: addItemsModal.productQuery.trim(), inStock: true });
      } else {
        clearSearchResults();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [addItemsModal.productQuery, clearSearchResults, searchProducts]); // Incluir dependencias para evitar stale closures

  // Reset delivery type to HomeDelivery when shipping method changes to Motorcycle
  useEffect(() => {
    if (shippingMethod === ShippingMethod.Motorcycle) {
      setDeliveryType(DeliveryType.HomeDelivery);
    }
  }, [shippingMethod]);

  return (
    <div className="min-h-screen bg-[#FFFFFF] pt-4 pb-10 px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-none shadow-none p-8">
        {/* Columna 1: Usuario, productos y dirección */}
        <form className="space-y-4" onSubmit={handleCreateOrder} noValidate>
          <h2 className="text-2xl font-bold mb-4 text-[#111111]">
            CREAR ORDEN
          </h2>
          {/* Buscar usuario por query flexible */}
          <div className="mb-2">
            <label className="block mb-1 text-sm" style={{ color: "#7A7A7A" }}>
              Buscar usuario *
            </label>
            <input
              type="text"
              placeholder="Buscar usuario..."
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              className="input w-full border rounded-none bg-[#FFFFFF] text-[#222222]"
              style={{ borderColor: "#e1e1e1" }}
            />
            {loadingUserSearch && (
              <div className="text-[#222222] mt-1">Buscando usuarios...</div>
            )}
            {errorUserSearch && (
              <div className="text-red-500 text-sm mt-1">
                {errorUserSearch}
              </div>
            )}
            {userSearchResults.length > 0 && !selectedUser && (
              <div className="mt-2 max-h-40 overflow-y-auto border rounded bg-[#f5f5f5]">
                {userSearchResults.map((user, index) => (
                  <div
                    key={user.id}
                    ref={index === userSearchResults.length - 1 ? lastUserRef : null}
                    className="p-2 border-b last:border-b-0 flex justify-between items-center"
                  >
                    <span className="text-[#222222]">{user.displayName} ({user.email})</span>
                    <button
                      type="button"
                      className="btn btn-sm bg-[#222222] text-white rounded-none"
                      onClick={() => handleSelectUser(user)}
                    >
                      Seleccionar
                    </button>
                  </div>
                ))}
                {loadingUserSearch && searchNextCursor && (
                  <div className="p-2 text-center text-[#222222]">Cargando más...</div>
                )}
              </div>
            )}
            {selectedUser && (
              <div className="mt-2 p-2 border rounded bg-[#e8f5e9]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#222222]">Seleccionado: {selectedUser.displayName} ({selectedUser.email})</span>
                  <button
                    type="button"
                    className="btn btn-sm bg-red-500 text-white rounded-none"
                    onClick={() => {
                      setSelectedUser(null);
                      clearRecentAddress();
                      setAddress(initialAddress);
                    }}
                  >
                    Cambiar
                  </button>
                </div>
                {loadingRecentAddress && (
                  <div className="text-sm text-[#666666] flex items-center gap-2">
                    <span className="loading loading-spinner loading-xs"></span>
                    Cargando dirección más reciente...
                  </div>
                )}
                {!loadingRecentAddress && recentAddress && (
                  <div className="text-sm text-[#666666]">
                    ✓ Dirección más reciente cargada: {recentAddress.city}, {recentAddress.state}
                  </div>
                )}
                {!loadingRecentAddress && !recentAddress && selectedUser && (
                  <div className="text-sm text-[#999999]">
                    ℹ Este usuario no tiene direcciones previas
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botón para abrir modal de productos */}
          <div className="mb-2">
            <label className="block mb-1 text-sm" style={{ color: "#7A7A7A" }}>
              Productos de la orden *
            </label>
            <button
              type="button"
              onClick={handleOpenAddItemsModal}
              className="btn rounded-none shadow-none border-none h-12 px-6 w-full transition-colors duration-300 ease-in-out text-white bg-[#222222] hover:bg-[#111111]"
            >
              Agregar productos
            </button>
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

          {/* Métodos de pago, envío y tipo de entrega */}
          <div className="flex flex-col gap-4 mt-4">
            {/* Método de pago */}
            <div>
              <label className="block text-sm text-[#7A7A7A] mb-2">
                Método de pago *
              </label>
              <div className="flex flex-col gap-2">
                {[PaymentMethod.BankTransfer, PaymentMethod.CashOnDelivery].map(
                  (method) => {
                    // Deshabilitar CashOnDelivery si el shipping method es ParcelCompany
                    const isDisabled = method === PaymentMethod.CashOnDelivery && 
                                     shippingMethod === ShippingMethod.ParcelCompany;
                    
                    return (
                      <label
                        key={method}
                        className={`flex items-center gap-2 cursor-pointer ${
                          isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method}
                          checked={paymentMethod === method}
                          onChange={() => setPaymentMethod(method)}
                          disabled={isDisabled}
                          className="radio border-[#e1e1e1] checked:bg-[#222222] disabled:opacity-50"
                        />
                        <span className={`text-sm ${
                          isDisabled ? 'text-gray-400' : 'text-[#222222]'
                        }`}>
                          {method === PaymentMethod.BankTransfer
                            ? "Transferencia / Depósito bancario"
                            : "Efectivo contra reembolso"}
                          {method === PaymentMethod.BankTransfer && (
                            <span className="text-xs text-[#7A7A7A]">
                              {" "}
                              (4% extra)
                            </span>
                          )}
                          {isDisabled && (
                            <span className="text-xs text-red-400">
                              {" "}
                              (No disponible con empresa de encomienda)
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
                    // Deshabilitar ParcelCompany si el payment method es CashOnDelivery
                    const isDisabled = method === ShippingMethod.ParcelCompany && 
                                     paymentMethod === PaymentMethod.CashOnDelivery;
                    
                    return (
                      <label
                        key={method}
                        className={`flex items-center gap-2 cursor-pointer ${
                          isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name="shippingMethod"
                          value={method}
                          checked={shippingMethod === method}
                          onChange={() => setShippingMethod(method)}
                          disabled={isDisabled}
                          className="radio border-[#e1e1e1] checked:bg-[#222222] disabled:opacity-50"
                        />
                        <span className={`text-sm ${
                          isDisabled ? 'text-gray-400' : 'text-[#222222]'
                        }`}>
                          {method === ShippingMethod.Motorcycle
                            ? "Moto"
                            : "Transporte/Empresa de encomienda"}
                          <span className="text-xs text-[#7A7A7A]">
                            {" "}
                            (Costo de envío extra a cargo del Cliente)
                          </span>
                          {isDisabled && (
                            <span className="text-xs text-red-400">
                              {" "}
                              (No disponible con pago contra reembolso)
                            </span>
                          )}
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

            {/* Campos específicos de transporte */}
            {shippingMethod === ShippingMethod.ParcelCompany && (
              <>
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
                    name="shippingCompany"
                    value={address.shippingCompany}
                    onChange={handleAddressChange}
                    className="input w-full border rounded-none bg-[#FFFFFF] text-[#222222]"
                    style={{ borderColor: "#e1e1e1" }}
                  />
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
                    name="declaredShippingAmount"
                    value={address.declaredShippingAmount}
                    onChange={handleAddressChange}
                    className="input w-full border rounded-none bg-[#FFFFFF] text-[#222222]"
                    style={{ borderColor: "#e1e1e1" }}
                  />
                </div>
              </>
            )}

            {/* Franja horaria */}
            <div>
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
                placeholder="Ej: 11:00 - 16:00"
              />
            </div>
          </div>

          {/* Formulario de dirección y datos personales */}
          <div className="grid grid-cols-2 gap-4">
            {[
              "firstName",
              "lastName",
              "email",
              "phoneNumber",
              "dni",
              "cuit",
            ].map((name) => (
              <div
                key={name}
                className={
                  name === "email"
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
                    : name === "cuit"
                    ? "CUIT (opcional)"
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
                  required={!["companyName", "cuit"].includes(name)}
                />
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
                  value={address.streetAddress}
                  onChange={handleAddressChange}
                  name="streetAddress"
                  className="input w-full border rounded-none bg-[#FFFFFF] text-[#222222]"
                  style={{ borderColor: "#e1e1e1" }}
                />
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
                    value={address.pickupPointAddress}
                    onChange={handleAddressChange}
                    name="pickupPointAddress"
                    className="input w-full border rounded-none bg-[#FFFFFF] text-[#222222]"
                    style={{ borderColor: "#e1e1e1" }}
                    placeholder="Ej: Sucursal Correo Argentino - Av. Corrientes 500"
                  />
                </div>
              )}

            {[
              "city",
              "state",
              "postalCode",
              "companyName",
            ].map((name) => (
              <div key={name}>
                <label
                  htmlFor={name}
                  className="block mb-1 text-sm"
                  style={{ color: "#7A7A7A" }}
                >
                  {name === "city"
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
                  type="text"
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

      {/* Modal de Añadir Items */}
      {addItemsModal.isOpen && (
        <dialog className="modal modal-open">
          <div className="modal-box w-full max-w-4xl rounded-none border border-[#e1e1e1] bg-[#FFFFFF] text-[#222222] p-0 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#FFFFFF] border-b border-[#e1e1e1] flex justify-between items-center h-12 z-30">
              <h3 className="font-bold text-lg text-[#111111] m-0 px-4">
                Añadir Productos a la Orden
              </h3>
              <button
                className="btn btn-sm bg-transparent text-[#333333] hover:text-[#111111] shadow-none h-full w-12 border-l border-[#e1e1e1] border-t-0 border-r-0 border-b-0 m-0"
                onClick={handleCloseAddItemsModal}
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {/* Campo de búsqueda automática */}
              <div className="mb-6">
                <label className="block text-sm text-[#7A7A7A] mb-2">
                  Buscar producto o SKU
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Buscar producto o SKU"
                    value={addItemsModal.productQuery}
                    onChange={(e) =>
                      setAddItemsModal((prev) => ({
                        ...prev,
                        productQuery: e.target.value,
                      }))
                    }
                    className="input w-full border rounded-none bg-[#FFFFFF] text-[#222222]"
                    style={{ borderColor: "#e1e1e1" }}
                  />
                  <button
                    type="button"
                    className="btn rounded-none shadow-none border-none h-12 px-4 text-[#222222] bg-[#e0e0e0] hover:bg-[#d0d0d0]"
                    onClick={() => {
                      setAddItemsModal((prev) => ({
                        ...prev,
                        productQuery: "",
                      }));
                      clearSearchResults();
                    }}
                  >
                    Limpiar
                  </button>
                </div>
                {addItemsModal.productQuery && (
                  <p className="text-xs text-[#7A7A7A] mt-2">
                    Buscando: &quot;{addItemsModal.productQuery}&quot;
                  </p>
                )}
              </div>

              {/* Productos actualmente en la orden */}
              {selectedProducts.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-[#111111] mb-3">
                    Productos actuales en la orden:
                  </h4>
                  <div className="space-y-2">
                    {selectedProducts.map((item) => (
                      <div
                        key={item.variant.id}
                        className="flex items-center justify-between p-2 bg-white border border-green-200 rounded-none"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{
                              backgroundColor: item.variant.color.hex,
                            }}
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-[#222222]">
                              {item.product.productModel}
                            </span>
                            <div className="text-xs text-[#7A7A7A]">
                              Color: {item.variant.color.name} | SKU:{" "}
                              {item.product.sku}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-green-700">
                            Cantidad: {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(item.variant.id)}
                            className="btn btn-xs text-white bg-[#d32f2f] border-[#d32f2f] rounded-none hover:bg-[#b71c1c]"
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resultados de búsqueda */}
              {searchLoading && (
                <div className="text-center py-4">
                  <span className="loading loading-spinner loading-md"></span>
                  <p className="text-[#7A7A7A] mt-2">Buscando productos...</p>
                </div>
              )}

              {!searchLoading && searchResults.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-[#111111] mb-3">
                    Resultados de búsqueda:
                  </h4>
                  <div className="space-y-4">
                    {searchResults.map((product) => (
                      <div
                        key={product.id}
                        className="border border-[#e1e1e1] rounded-none bg-white"
                      >
                        <div className="p-3 border-b border-[#e1e1e1] bg-[#f9f9f9]">
                          <h5 className="font-semibold text-[#222222]">
                            {product.productModel}
                          </h5>
                          <p className="text-sm text-[#7A7A7A]">
                            SKU: {product.sku}
                          </p>
                        </div>
                        <div className="p-3">
                          <h6 className="text-sm font-medium text-[#222222] mb-2">
                            Variantes disponibles:
                          </h6>
                          <div className="space-y-2">
                            {product.variants.map((variant) => {
                              const isAlreadyInOrder = selectedProducts.some(
                                (item) => item.variant.id === variant.id
                              );
                              const currentQuantity =
                                addItemsModal.quantities[variant.id] || 1;

                              return (
                                <div
                                  key={variant.id}
                                  className={`flex items-center justify-between p-3 border rounded-none ${
                                    isAlreadyInOrder
                                      ? "bg-[#f9f9f9] border-[#e1e1e1]"
                                      : "bg-white border-[#e1e1e1]"
                                  }`}
                                >
                                  {/* Información de la variante */}
                                  <div className="flex items-center gap-3 flex-1">
                                    <div
                                      className="w-4 h-4 rounded-full border border-gray-300"
                                      style={{
                                        backgroundColor: variant.color.hex,
                                      }}
                                    />
                                    <div>
                                      <span className="text-sm font-medium text-[#222222]">
                                        {variant.color.name}
                                      </span>
                                      <div className="text-xs text-[#7A7A7A]">
                                        Stock: {variant.stock}
                                        {isAlreadyInOrder && (
                                          <span className="ml-2 text-green-600">
                                            ✓ En orden
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Controles de cantidad y botón agregar */}
                                  {!isAlreadyInOrder && (
                                    <div className="flex items-center gap-2">
                                      {/* Control de cantidad */}
                                      <div className="flex items-center border border-[#e1e1e1] rounded-none">
                                        <button
                                          type="button"
                                          className="px-2 py-1 text-[#222222] hover:bg-[#f9f9f9] disabled:opacity-50"
                                          onClick={() =>
                                            handleVariantQuantityChange(
                                              variant.id,
                                              currentQuantity - 1
                                            )
                                          }
                                          disabled={currentQuantity <= 1}
                                        >
                                          -
                                        </button>
                                        <input
                                          type="number"
                                          min="1"
                                          max={variant.stock}
                                          value={currentQuantity}
                                          onChange={(e) =>
                                            handleVariantQuantityChange(
                                              variant.id,
                                              parseInt(e.target.value) || 1
                                            )
                                          }
                                          className="w-16 px-2 py-1 text-center text-sm border-none outline-none bg-transparent"
                                        />
                                        <button
                                          type="button"
                                          className="px-2 py-1 text-[#222222] hover:bg-[#f9f9f9] disabled:opacity-50"
                                          onClick={() =>
                                            handleVariantQuantityChange(
                                              variant.id,
                                              currentQuantity + 1
                                            )
                                          }
                                          disabled={
                                            currentQuantity >= variant.stock
                                          }
                                        >
                                          +
                                        </button>
                                      </div>

                                      {/* Botón agregar */}
                                      <button
                                        type="button"
                                        className="btn btn-sm rounded-none shadow-none border border-[#222222] bg-[#222222] text-white hover:bg-[#111111] disabled:bg-gray-400 disabled:border-gray-400"
                                        onClick={() =>
                                          handleAddVariantWithQuantity(
                                            variant,
                                            product
                                          )
                                        }
                                        disabled={currentQuantity > variant.stock}
                                      >
                                        Agregar
                                      </button>
                                    </div>
                                  )}

                                  {/* Indicador para variantes ya en orden */}
                                  {isAlreadyInOrder && (
                                    <div className="text-sm text-[#7A7A7A]">
                                      Ya agregado
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Estado vacío */}
              {!searchLoading &&
                searchResults.length === 0 &&
                addItemsModal.productQuery && (
                  <div className="text-center py-8">
                    <p className="text-[#7A7A7A]">
                      No se encontraron productos para &quot;{addItemsModal.productQuery}&quot;
                    </p>
                  </div>
                )}

              {/* Instrucciones iniciales */}
              {!addItemsModal.productQuery && searchResults.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-[#7A7A7A]">
                    Usa el campo de búsqueda para encontrar productos por nombre
                    o SKU
                  </p>
                </div>
              )}
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}

export default CreateOrderPage;
