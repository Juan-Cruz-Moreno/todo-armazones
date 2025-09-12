"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import useOrders from "@/hooks/useOrders";
import type {
  ShippingAddress,
  Order,
  UpdateOrderPayload,
  OrderItem,
  ApplyRefundPayload,
} from "@/interfaces/order";
import type { ProductVariant } from "@/interfaces/product";
import {
  ShippingMethod,
  PaymentMethod,
  OrderStatus,
  DeliveryType,
} from "@/enums/order.enum";
import { useProducts } from "@/hooks/useProducts";
import { Trash, Edit3 } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { useUsersAnalytics } from "@/hooks/useUsersAnalytics";
import EditItemPricesModal from "@/components/EditItemPricesModal";
import { AnalyticsPeriod } from "@/enums/analytics.enum";
import StockConflictAlert from "@/components/StockConflictAlert";
import PendingPaymentInfo from "@/components/PendingPaymentInfo";
import { downloadOrderPDF } from "@/utils/downloadOrderPDF";
import LoadingSpinner from "@/components/atoms/LoadingSpinner";

const EditOrderPage = () => {
  // All hooks at the top, always called in the same order
  const { id } = useParams();
  const router = useRouter();
  const {
    getOrderById,
    orderById,
    loading,
    error,
    updateOrderData,
    stockAvailability,
    stockCheckLoading,
    stockCheckError,
    checkStockAvailability,
    clearStockInfo,
    clearOrderById,
    refundLoading,
    refundError,
    refundEligibility,
    refundEligibilityLoading,
    applyOrderRefund,
    checkOrderRefundEligibility,
    clearRefundInfo,
    cancelRefundLoading,
    cancelOrderRefund,
  } = useOrders();
  const [form, setForm] = useState<Order | null>(null);
  const [originalForm, setOriginalForm] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const [itemOperationLoading, setItemOperationLoading] = useState<
    string | null
  >(null);
  const [isPaymentMethodUpdating, setIsPaymentMethodUpdating] = useState(false);
  const [isOrderStatusUpdating, setIsOrderStatusUpdating] = useState(false);
  const [isAllowViewInvoiceUpdating, setIsAllowViewInvoiceUpdating] =
    useState(false);

  // Estado para debounce de cambios de cantidad
  const [quantityTimeouts, setQuantityTimeouts] = useState<
    Record<string, NodeJS.Timeout>
  >({});

  // Estado para manejar errores inline
  const [errors, setErrors] = useState<
    {
      id: string;
      message: string;
      type: "error" | "success" | "warning";
      timestamp: number;
    }[]
  >([]);

  // Estados para el modal de edición de precios
  const [editPricesModal, setEditPricesModal] = useState<{
    isOpen: boolean;
    item: OrderItem | null;
    loading: boolean;
  }>({
    isOpen: false,
    item: null,
    loading: false,
  });

  // Estados para el sistema de reembolsos
  const [refundForm, setRefundForm] = useState<{
    isOpen: boolean;
    type: "fixed" | "percentage";
    amount: string;
    reason: string;
  }>({
    isOpen: false,
    type: "fixed",
    amount: "",
    reason: "",
  });

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

  const { searchProducts, searchResults, searchLoading, clearSearchResults } =
    useProducts();

  // Users analytics hook for customer history
  const {
    loadUserDetailedAnalytics,
    currentUserMetrics,
    isLoadingUserDetails,
  } = useUsersAnalytics();

  // Cada vez que cambia el id en la ruta, limpiar el formulario local
  // y solicitar la orden al store/backend. Esto evita mostrar datos
  // de la orden anterior mientras se carga la nueva.
  useEffect(() => {
    if (id) {
      setForm(null);
      setOriginalForm(null);
      getOrderById(id as string);
    }

    return () => {
      // Limpiar orderById en el store cuando se desmonta o cambia el id
      clearOrderById();
      // Limpiar todos los timeouts de debounce
      Object.values(quantityTimeouts).forEach((timeout) =>
        clearTimeout(timeout)
      );
      setQuantityTimeouts({});
    };
  }, [id, getOrderById, clearOrderById]);

  // Sincronizar el orderFromStore con el formulario local solo si
  // el order recibido corresponde al id actual de la ruta. Esto
  // previene condiciones de carrera donde el store contiene una
  // orden previa y se renderiza incorrectamente para la nueva ruta.
  useEffect(() => {
    if (orderById && id && orderById.id === id) {
      setForm(orderById);
      setOriginalForm(orderById);
    }
  }, [orderById, id]);

  // Load user analytics when form is available
  useEffect(() => {
    if (form?.user?.id) {
      loadUserDetailedAnalytics(form.user.id, AnalyticsPeriod.AllTime);
    }
  }, [form?.user?.id, loadUserDetailedAnalytics]);

  // Check stock availability when order is PENDING_PAYMENT
  useEffect(() => {
    if (form?.id && form.orderStatus === OrderStatus.PendingPayment) {
      // Limpiar información anterior de stock
      clearStockInfo();
      // Verificar disponibilidad de stock
      checkStockAvailability(form.id);
    } else {
      // Si no es PENDING_PAYMENT, limpiar información de stock
      clearStockInfo();
    }
  }, [form?.id, form?.orderStatus, checkStockAvailability, clearStockInfo]);

  // Reset delivery type to HomeDelivery when shipping method changes to Motorcycle
  useEffect(() => {
    if (
      form?.shippingMethod === ShippingMethod.Motorcycle &&
      form?.shippingAddress?.deliveryType === DeliveryType.PickupPoint
    ) {
      setForm((prev) =>
        prev
          ? {
              ...prev,
              shippingAddress: {
                ...prev.shippingAddress,
                deliveryType: DeliveryType.HomeDelivery,
              },
            }
          : prev
      );
    }
  }, [form?.shippingMethod]);

  // useEffect para búsqueda automática de productos con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (addItemsModal.productQuery.trim()) {
        searchProducts(addItemsModal.productQuery.trim());
      } else {
        clearSearchResults();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [addItemsModal.productQuery]); // Solo dependemos del query, no de las funciones

  // Funciones helper para manejar errores
  const addError = (
    message: string,
    type: "error" | "success" | "warning" = "error"
  ) => {
    const newError = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: Date.now(),
    };
    setErrors((prev) => [...prev, newError]);

    // Auto-remover después de 5 segundos para success y warning, 8 segundos para error
    setTimeout(
      () => {
        setErrors((prev) => prev.filter((err) => err.id !== newError.id));
      },
      type === "error" ? 8000 : 5000
    );
  };

  const removeError = (id: string) => {
    setErrors((prev) => prev.filter((err) => err.id !== id));
  };

  const addSuccess = (message: string) => addError(message, "success");
  const addWarning = (message: string) => addError(message, "warning");

  if (loading || !form) return <div className="p-8">Cargando orden...</div>;
  if (error)
    return (
      <div className="min-h-screen bg-[#FFFFFF] pt-4 pb-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-bold">!</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-800">
                  Error al cargar la orden
                </h3>
                <p className="text-red-600 mt-1">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

  // Handler para cambios en los campos de dirección
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) =>
      prev
        ? {
            ...prev,
            shippingAddress: { ...prev.shippingAddress, [name]: value },
          }
        : prev
    );
  };

  // Handler para cambios en campos específicos de entrega
  const handleDeliveryFieldChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) =>
      prev
        ? {
            ...prev,
            shippingAddress: { ...prev.shippingAddress, [name]: value },
          }
        : prev
    );
  };

  // Handler para cambios en deliveryType
  const handleDeliveryTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const newDeliveryType = value as DeliveryType;

    // Actualizar estado local inmediatamente para mostrar/ocultar campos
    setForm((prev) =>
      prev
        ? {
            ...prev,
            shippingAddress: {
              ...prev.shippingAddress,
              deliveryType: newDeliveryType,
            },
          }
        : prev
    );
  };

  // Handler para cambios en métodos de envío/pago/estado
  const handleFieldChange = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Actualizar estado local inmediatamente
    setForm((prev) => (prev ? { ...prev, [name]: value } : prev));

    // Si es paymentMethod, enviar automáticamente al backend
    if (name === "paymentMethod" && form) {
      setIsPaymentMethodUpdating(true);

      try {
        const updatePayload = {
          orderId: form.id,
          paymentMethod: value as PaymentMethod,
        };

        const result = await updateOrderData(updatePayload).unwrap();

        // Actualizar estado local con la respuesta del servidor
        setForm(result);
        setOriginalForm(result);
        addSuccess("Método de pago actualizado correctamente");
      } catch (error) {
        console.error("Error al actualizar método de pago:", error);
        addError(
          `Error al actualizar el método de pago: ${
            error || "Error desconocido"
          }`
        );

        // Revertir el cambio local en caso de error
        if (originalForm) {
          setForm((prev) =>
            prev ? { ...prev, paymentMethod: originalForm.paymentMethod } : prev
          );
        }
      } finally {
        setIsPaymentMethodUpdating(false);
      }
    }

    // Si es orderStatus, enviar automáticamente al backend
    if (name === "orderStatus" && form) {
      setIsOrderStatusUpdating(true);

      try {
        const updatePayload = {
          orderId: form.id,
          orderStatus: value as OrderStatus,
        };

        const result = await updateOrderData(updatePayload).unwrap();

        // Actualizar estado local con la respuesta del servidor
        setForm(result);
        setOriginalForm(result);
        addSuccess("Estado de la orden actualizado correctamente");
      } catch (error) {
        console.error("Error al actualizar estado de la orden:", error);
        addError(
          `Error al actualizar el estado de la orden: ${
            error || "Error desconocido"
          }`
        );

        // Revertir el cambio local en caso de error
        if (originalForm) {
          setForm((prev) =>
            prev ? { ...prev, orderStatus: originalForm.orderStatus } : prev
          );
        }
      } finally {
        setIsOrderStatusUpdating(false);
      }
    }
  };

  // Handler para verificar stock manualmente
  const handleRefreshStock = () => {
    if (form?.id) {
      checkStockAvailability(form.id);
    }
  };

  // Handler para cambios en la fecha de creación
  const handleCreatedAtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    // Convertir el datetime-local a ISO string manteniendo la hora local
    if (value) {
      // Agregar segundos y milisegundos para crear un formato ISO completo
      const isoString = value + ":00.000Z";
      setForm((prev) => (prev ? { ...prev, createdAt: isoString } : prev));
    } else {
      setForm((prev) => (prev ? { ...prev, createdAt: "" } : prev));
    }
  };

  // Handler para cambios en allowViewInvoice checkbox
  const handleAllowViewInvoiceChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { checked } = e.target;

    // Actualizar estado local inmediatamente
    setForm((prev) => (prev ? { ...prev, allowViewInvoice: checked } : prev));

    if (!form) return;

    setIsAllowViewInvoiceUpdating(true);

    try {
      const updatePayload = {
        orderId: form.id,
        allowViewInvoice: checked,
      };

      const result = await updateOrderData(updatePayload).unwrap();

      // Actualizar estado local con la respuesta del servidor
      setForm(result);
      setOriginalForm(result);
      addSuccess(
        `Permiso de ver factura ${
          checked ? "habilitado" : "deshabilitado"
        } correctamente`
      );
    } catch (error) {
      console.error("Error al actualizar permiso de ver factura:", error);
      addError(
        `Error al actualizar el permiso de ver factura: ${
          error || "Error desconocido"
        }`
      );

      // Revertir el cambio local en caso de error
      if (originalForm) {
        setForm((prev) =>
          prev
            ? { ...prev, allowViewInvoice: originalForm.allowViewInvoice }
            : prev
        );
      }
    } finally {
      setIsAllowViewInvoiceUpdating(false);
    }
  };

  // Buscar productos/variantes para el modal
  const handleProductSearch = (query: string) => {
    if (query) searchProducts(query);
  };

  // Agregar ProductVariant a la orden
  const handleAddVariant = async (
    variant: ProductVariant,
    quantity: number = 1
  ) => {
    if (!form) return;
    if (form.items.some((v) => v.productVariant.id === variant.id)) {
      addWarning("Este producto ya está en la orden");
      return;
    }

    setItemOperationLoading(variant.id);

    try {
      const updatePayload = {
        orderId: form.id,
        items: [
          {
            productVariantId: variant.id,
            action: "add" as const,
            quantity: quantity,
          },
        ],
      };

      const result = await updateOrderData(updatePayload).unwrap();

      // Actualizar estado local con la respuesta del servidor
      setForm(result);
      setOriginalForm(result);
      addSuccess(`Producto agregado correctamente`);

      // Solo limpiar la cantidad de la variante agregada, no toda la búsqueda
      if (addItemsModal.isOpen) {
        setAddItemsModal((prev) => ({
          ...prev,
          quantities: {
            ...prev.quantities,
            [variant.id]: 1,
          },
        }));
      }
    } catch (error) {
      console.error("Error al agregar variante:", error);
      addError(`Error al agregar el producto: ${error || "Error desconocido"}`);
    } finally {
      setItemOperationLoading(null);
    }
  };

  // Quitar ProductVariant
  const handleRemoveVariant = async (variantId: string) => {
    if (!form) return;

    setItemOperationLoading(variantId);

    try {
      const updatePayload = {
        orderId: form.id,
        items: [
          {
            productVariantId: variantId,
            action: "remove" as const,
          },
        ],
      };

      const result = await updateOrderData(updatePayload).unwrap();

      // Actualizar estado local con la respuesta del servidor
      setForm(result);
      setOriginalForm(result);
      addSuccess("Producto eliminado correctamente");
    } catch (error) {
      console.error("Error al eliminar variante:", error);
      addError(
        `Error al eliminar el producto: ${error || "Error desconocido"}`
      );
    } finally {
      setItemOperationLoading(null);
    }
  };

  // Cambiar cantidad
  const handleQuantityChange = async (variantId: string, qty: number) => {
    if (!form) return;

    const newQuantity = Math.max(1, qty);
    const currentItem = form.items.find(
      (item) => item.productVariant.id === variantId
    );

    if (!currentItem || currentItem.quantity === newQuantity) return;

    // Limpiar timeout anterior si existe
    if (quantityTimeouts[variantId]) {
      clearTimeout(quantityTimeouts[variantId]);
    }

    // Actualizar estado local inmediatamente para mejor UX
    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((item) =>
          item.productVariant.id === variantId
            ? { ...item, quantity: newQuantity }
            : item
        ),
      };
    });

    // Función que ejecuta la actualización al backend
    const updateQuantity = async () => {
      setItemOperationLoading(variantId);

      try {
        const updatePayload = {
          orderId: form.id,
          items: [
            {
              productVariantId: variantId,
              action: "set" as const,
              quantity: newQuantity,
            },
          ],
        };

        const result = await updateOrderData(updatePayload).unwrap();

        // Actualizar estado local con la respuesta del servidor
        setForm(result);
        setOriginalForm(result);
        addSuccess(`Cantidad actualizada a ${newQuantity}`);
      } catch (error) {
        console.error("Error al cambiar cantidad:", error);
        addError(
          `Error al actualizar la cantidad: ${error || "Error desconocido"}`
        );
        // Revertir el cambio local en caso de error
        setForm((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            items: prev.items.map((item) =>
              item.productVariant.id === variantId
                ? { ...item, quantity: currentItem.quantity }
                : item
            ),
          };
        });
      } finally {
        setItemOperationLoading(null);
        // Limpiar el timeout del estado
        setQuantityTimeouts((prev) => {
          const newTimeouts = { ...prev };
          delete newTimeouts[variantId];
          return newTimeouts;
        });
      }
    };

    // Crear nuevo timeout con debounce de 800ms
    const timeout = setTimeout(updateQuantity, 800);
    setQuantityTimeouts((prev) => ({ ...prev, [variantId]: timeout }));
  };

  // Abrir modal de edición de precios
  const handleEditPrices = (item: OrderItem) => {
    setEditPricesModal({
      isOpen: true,
      item,
      loading: false,
    });
  };

  // Cerrar modal de edición de precios
  const handleClosePricesModal = () => {
    setEditPricesModal({
      isOpen: false,
      item: null,
      loading: false,
    });
  };

  // Guardar cambios de precios
  const handleSavePrices = async (
    productVariantId: string,
    data: {
      action: "update_prices" | "update_all";
      costUSDAtPurchase?: number;
      priceUSDAtPurchase?: number;
      subTotal?: number;
      contributionMarginUSD?: number;
      quantity?: number;
    }
  ) => {
    if (!form) return;

    setEditPricesModal((prev) => ({ ...prev, loading: true }));

    try {
      const updatePayload = {
        orderId: form.id,
        items: [
          {
            productVariantId,
            ...data,
          },
        ],
      };

      const result = await updateOrderData(updatePayload).unwrap();

      // Actualizar estado local con la respuesta del servidor
      setForm(result);
      setOriginalForm(result);
      addSuccess("Precios actualizados correctamente");
    } catch (error) {
      console.error("Error al actualizar precios:", error);
      addError(`Error al actualizar precios: ${error || "Error desconocido"}`);
      throw error; // Re-throw para que el modal maneje el error
    } finally {
      setEditPricesModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // Verificar si hay cambios pendientes
  const hasChanges = () => {
    if (!form || !originalForm) return false;

    // Verificar cambios en createdAt
    const hasCreatedAtChanges = form.createdAt !== originalForm.createdAt;

    // Verificar cambios en shippingMethod
    const hasShippingMethodChanges =
      form.shippingMethod !== originalForm.shippingMethod;

    // Verificar cambios en deliveryType
    const hasDeliveryTypeChanges =
      form.shippingAddress.deliveryType !==
      originalForm.shippingAddress.deliveryType;

    // Verificar cambios en deliveryWindow y declaredShippingAmount
    const hasDeliveryChanges =
      form.shippingAddress.deliveryWindow !==
        originalForm.shippingAddress.deliveryWindow ||
      form.shippingAddress.declaredShippingAmount !==
        originalForm.shippingAddress.declaredShippingAmount;

    // Verificar cambios en los campos de dirección
    const hasAddressChanges =
      form.shippingAddress.firstName !==
        originalForm.shippingAddress.firstName ||
      form.shippingAddress.lastName !== originalForm.shippingAddress.lastName ||
      form.shippingAddress.email !== originalForm.shippingAddress.email ||
      form.shippingAddress.phoneNumber !==
        originalForm.shippingAddress.phoneNumber ||
      form.shippingAddress.dni !== originalForm.shippingAddress.dni ||
      form.shippingAddress.cuit !== originalForm.shippingAddress.cuit ||
      form.shippingAddress.streetAddress !==
        originalForm.shippingAddress.streetAddress ||
      form.shippingAddress.city !== originalForm.shippingAddress.city ||
      form.shippingAddress.state !== originalForm.shippingAddress.state ||
      form.shippingAddress.postalCode !==
        originalForm.shippingAddress.postalCode ||
      form.shippingAddress.companyName !==
        originalForm.shippingAddress.companyName ||
      form.shippingAddress.shippingCompany !==
        originalForm.shippingAddress.shippingCompany ||
      form.shippingAddress.pickupPointAddress !==
        originalForm.shippingAddress.pickupPointAddress;

    return (
      hasCreatedAtChanges ||
      hasShippingMethodChanges ||
      hasDeliveryTypeChanges ||
      hasDeliveryChanges ||
      hasAddressChanges
    );
  };

  // Manejar el submit del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !originalForm || isSubmitting) return;

    // Validar que los campos requeridos estén completos según el tipo de entrega
    if (form.shippingAddress.deliveryType === DeliveryType.HomeDelivery) {
      if (!form.shippingAddress.streetAddress?.trim()) {
        addError("Debe completar la dirección para entrega a domicilio");
        return;
      }
    } else if (form.shippingAddress.deliveryType === DeliveryType.PickupPoint) {
      if (!form.shippingAddress.pickupPointAddress?.trim()) {
        addError("Debe completar la dirección del punto de retiro");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const updatePayload: UpdateOrderPayload = {
        orderId: form.id,
      };

      let hasChanges = false;

      // Verificar cambios en createdAt
      if (form.createdAt !== originalForm.createdAt) {
        updatePayload.createdAt = form.createdAt;
        hasChanges = true;
      }

      // Verificar cambios en shippingMethod
      if (form.shippingMethod !== originalForm.shippingMethod) {
        updatePayload.shippingMethod = form.shippingMethod;
        hasChanges = true;
      }

      // Verificar cambios en deliveryType
      if (
        form.shippingAddress.deliveryType !==
        originalForm.shippingAddress.deliveryType
      ) {
        // Cuando cambia el deliveryType, siempre enviar la shippingAddress completa
        // para asegurar que los campos requeridos estén incluidos
        // Limpiar campos vacíos antes de enviar al backend
        const cleanedShippingAddress = { ...form.shippingAddress };
        
        // Convertir campos opcionales vacíos a undefined para que no se guarden como strings vacías
        if (cleanedShippingAddress.cuit === "") {
          cleanedShippingAddress.cuit = undefined;
        }
        if (cleanedShippingAddress.companyName === "") {
          cleanedShippingAddress.companyName = undefined;
        }
        if (cleanedShippingAddress.shippingCompany === "") {
          cleanedShippingAddress.shippingCompany = undefined;
        }
        if (cleanedShippingAddress.declaredShippingAmount === "") {
          cleanedShippingAddress.declaredShippingAmount = undefined;
        }
        if (cleanedShippingAddress.deliveryWindow === "") {
          cleanedShippingAddress.deliveryWindow = undefined;
        }
        if (cleanedShippingAddress.pickupPointAddress === "") {
          cleanedShippingAddress.pickupPointAddress = undefined;
        }
        
        updatePayload.shippingAddress = cleanedShippingAddress;
        hasChanges = true;
      }

      // Verificar cambios en deliveryWindow y declaredShippingAmount
      if (
        form.shippingAddress.deliveryWindow !==
          originalForm.shippingAddress.deliveryWindow ||
        form.shippingAddress.declaredShippingAmount !==
          originalForm.shippingAddress.declaredShippingAmount
      ) {
        if (
          form.shippingAddress.deliveryWindow !==
          originalForm.shippingAddress.deliveryWindow
        ) {
          updatePayload.deliveryWindow = form.shippingAddress.deliveryWindow;
          hasChanges = true;
        }
        if (
          form.shippingAddress.declaredShippingAmount !==
          originalForm.shippingAddress.declaredShippingAmount
        ) {
          updatePayload.declaredShippingAmount =
            form.shippingAddress.declaredShippingAmount;
          hasChanges = true;
        }
      }

      // Verificar cambios en la dirección completa (solo si no se envió ya por deliveryType)
      const hasAddressChanges =
        form.shippingAddress.firstName !==
          originalForm.shippingAddress.firstName ||
        form.shippingAddress.lastName !==
          originalForm.shippingAddress.lastName ||
        form.shippingAddress.email !== originalForm.shippingAddress.email ||
        form.shippingAddress.phoneNumber !==
          originalForm.shippingAddress.phoneNumber ||
        form.shippingAddress.dni !== originalForm.shippingAddress.dni ||
        form.shippingAddress.cuit !== originalForm.shippingAddress.cuit ||
        form.shippingAddress.streetAddress !==
          originalForm.shippingAddress.streetAddress ||
        form.shippingAddress.city !== originalForm.shippingAddress.city ||
        form.shippingAddress.state !== originalForm.shippingAddress.state ||
        form.shippingAddress.postalCode !==
          originalForm.shippingAddress.postalCode ||
        form.shippingAddress.companyName !==
          originalForm.shippingAddress.companyName ||
        form.shippingAddress.shippingCompany !==
          originalForm.shippingAddress.shippingCompany ||
        form.shippingAddress.pickupPointAddress !==
          originalForm.shippingAddress.pickupPointAddress;

      // Solo enviar shippingAddress si hay cambios y no se envió ya por deliveryType
      const hasDeliveryTypeChanges =
        form.shippingAddress.deliveryType !==
        originalForm.shippingAddress.deliveryType;
      if (hasAddressChanges && !hasDeliveryTypeChanges) {
        // Limpiar campos vacíos antes de enviar al backend
        const cleanedShippingAddress = { ...form.shippingAddress };
        
        // Convertir campos opcionales vacíos a undefined para que no se guarden como strings vacías
        if (cleanedShippingAddress.cuit === "") {
          cleanedShippingAddress.cuit = undefined;
        }
        if (cleanedShippingAddress.companyName === "") {
          cleanedShippingAddress.companyName = undefined;
        }
        if (cleanedShippingAddress.shippingCompany === "") {
          cleanedShippingAddress.shippingCompany = undefined;
        }
        if (cleanedShippingAddress.declaredShippingAmount === "") {
          cleanedShippingAddress.declaredShippingAmount = undefined;
        }
        if (cleanedShippingAddress.deliveryWindow === "") {
          cleanedShippingAddress.deliveryWindow = undefined;
        }
        if (cleanedShippingAddress.pickupPointAddress === "") {
          cleanedShippingAddress.pickupPointAddress = undefined;
        }
        
        updatePayload.shippingAddress = cleanedShippingAddress;
        hasChanges = true;
      }

      // Solo enviar si hay cambios
      if (hasChanges) {
        const result = await updateOrderData(updatePayload).unwrap();

        // Actualizar el estado local con los datos del servidor
        setForm(result);
        setOriginalForm(result);
        addSuccess("Orden actualizada correctamente");
      } else {
        addWarning("No hay cambios que guardar");
      }
    } catch (error) {
      console.error("Error al actualizar la orden:", error);
      addError(`Error al actualizar la orden: ${error || "Error desconocido"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Funciones para manejar reembolsos
  const handleOpenRefundForm = () => {
    if (form?.id) {
      checkOrderRefundEligibility(form.id);
    }
    setRefundForm((prev) => ({ ...prev, isOpen: true }));
  };

  const handleCloseRefundForm = () => {
    setRefundForm({
      isOpen: false,
      type: "fixed",
      amount: "",
      reason: "",
    });
    clearRefundInfo();
  };

  const handleRefundFormChange = (
    field: "type" | "amount" | "reason",
    value: string
  ) => {
    setRefundForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyRefund = async () => {
    if (!form?.id || !refundForm.amount) return;

    const amount = parseFloat(refundForm.amount);
    if (isNaN(amount) || amount <= 0) {
      addError("El monto del reembolso debe ser un número válido mayor a 0");
      return;
    }

    if (refundForm.type === "percentage" && amount > 100) {
      addError("El porcentaje no puede ser mayor a 100");
      return;
    }

    const payload: ApplyRefundPayload = {
      orderId: form.id,
      type: refundForm.type,
      amount,
      reason: refundForm.reason || undefined,
    };

    applyOrderRefund(
      payload,
      (response) => {
        if (response.success) {
          addSuccess("Reembolso aplicado correctamente");
          handleCloseRefundForm();
          // La orden se actualiza automáticamente por el Redux state
        } else {
          addError(response.message || "Error al aplicar el reembolso");
        }
      },
      (error) => {
        addError(
          `Error al aplicar el reembolso: ${error || "Error desconocido"}`
        );
      }
    );
  };

  const handleCancelRefund = async () => {
    if (!form?.id) return;

    const confirmed = window.confirm(
      "¿Estás seguro de que quieres cancelar el reembolso? Esta acción restaurará los montos originales de la orden."
    );

    if (!confirmed) return;

    cancelOrderRefund(
      form.id,
      (response) => {
        if (response.success) {
          addSuccess("Reembolso cancelado correctamente");
          // Actualizar el formulario local con la respuesta del servidor
          if (response.order) {
            setForm(response.order);
            setOriginalForm(response.order);
          }
        } else {
          addError(response.message || "Error al cancelar el reembolso");
        }
      },
      (error) => {
        addError(
          `Error al cancelar el reembolso: ${error || "Error desconocido"}`
        );
      }
    );
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
  const handleAddVariantWithQuantity = async (variant: ProductVariant) => {
    const quantity = addItemsModal.quantities[variant.id] || 1;
    await handleAddVariant(variant, quantity);
    // La cantidad ya se resetea en handleAddVariant, no necesitamos hacer nada más aquí
  };

  const handleDownloadPDF = async () => {
    if (
      !form?.id ||
      !form.shippingAddress.firstName ||
      !form.shippingAddress.lastName ||
      !form.orderNumber
    ) {
      addError("Faltan datos para descargar el PDF.");
      return;
    }

    setIsDownloading(true);
    try {
      await downloadOrderPDF(
        form.id,
        form.shippingAddress.firstName,
        form.shippingAddress.lastName,
        form.orderNumber
      );
      addSuccess("PDF descargado exitosamente.");
    } catch {
      addError("Error al descargar el PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] pt-4 pb-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Order Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-none shadow-none p-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-[#111111]">
                  Editar Orden #{form.orderNumber}
                  {hasChanges() && (
                    <span className="ml-2 text-sm px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                      Cambios pendientes
                    </span>
                  )}
                </h2>
                <button
                  type="button"
                  onClick={() => router.push("/orders")}
                  className="btn btn-sm rounded-none shadow-none border-none px-4 text-[#222222] bg-[#e0e0e0]"
                >
                  Volver
                </button>
              </div>

              {/* Sistema de notificaciones/errores inline */}
              {errors.length > 0 && (
                <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
                  {errors.map((error) => (
                    <div
                      key={error.id}
                      className={`
                  flex items-center justify-between p-4 rounded-lg shadow-lg border
                  ${
                    error.type === "error"
                      ? "bg-red-50 border-red-200 text-red-800"
                      : error.type === "success"
                      ? "bg-green-50 border-green-200 text-green-800"
                      : "bg-yellow-50 border-yellow-200 text-yellow-800"
                  }
                  animate-in slide-in-from-right duration-300
                `}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            error.type === "error"
                              ? "bg-red-500"
                              : error.type === "success"
                              ? "bg-green-500"
                              : "bg-yellow-500"
                          }`}
                        />
                        <span className="text-sm font-medium">
                          {error.message}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeError(error.id)}
                        className={`ml-2 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center hover:opacity-70 ${
                          error.type === "error"
                            ? "text-red-600 hover:bg-red-100"
                            : error.type === "success"
                            ? "text-green-600 hover:bg-green-100"
                            : "text-yellow-600 hover:bg-yellow-100"
                        }`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Alerta de conflictos de stock para órdenes PENDING_PAYMENT */}
              {form.orderStatus === OrderStatus.PendingPayment &&
                stockAvailability &&
                stockAvailability.hasConflicts && (
                  <StockConflictAlert
                    conflicts={stockAvailability.conflicts}
                    onRefreshStock={handleRefreshStock}
                    isRefreshing={stockCheckLoading}
                    className="mb-6"
                  />
                )}

              {/* Indicador de verificación de stock */}
              {form.orderStatus === OrderStatus.PendingPayment &&
                stockCheckLoading &&
                !stockAvailability && (
                  <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-blue-700">
                        Verificando disponibilidad de stock...
                      </span>
                    </div>
                  </div>
                )}

              {/* Error de verificación de stock */}
              {form.orderStatus === OrderStatus.PendingPayment &&
                stockCheckError && (
                  <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-red-700">
                        Error al verificar stock: {stockCheckError}
                      </span>
                      <button
                        type="button"
                        onClick={handleRefreshStock}
                        className="text-sm text-red-600 underline hover:no-underline"
                      >
                        Reintentar
                      </button>
                    </div>
                  </div>
                )}

              {/* Indicador de stock OK para órdenes PENDING_PAYMENT */}
              {form.orderStatus === OrderStatus.PendingPayment &&
                stockAvailability &&
                !stockAvailability.hasConflicts &&
                !stockCheckLoading && (
                  <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-700 font-medium">
                          ✅ Stock disponible para todos los productos
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRefreshStock}
                        disabled={stockCheckLoading}
                        className="text-sm text-green-600 underline hover:no-underline"
                      >
                        Verificar nuevamente
                      </button>
                    </div>
                  </div>
                )}

              {/* Información sobre estado PENDING_PAYMENT */}
              <PendingPaymentInfo
                orderStatus={form.orderStatus}
                className="mb-6"
              />
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Fecha de creación */}
                <div className="mb-4">
                  <label className="block text-sm text-[#7A7A7A] mb-2">
                    Fecha de creación *
                  </label>
                  <input
                    type="datetime-local"
                    value={form.createdAt ? form.createdAt.slice(0, 16) : ""}
                    onChange={handleCreatedAtChange}
                    className="input w-full border rounded-none bg-[#FFFFFF] text-[#222222]"
                    style={{ borderColor: "#e1e1e1" }}
                    required
                  />
                </div>
                {/* Estado de la orden */}
                <div className="mb-6 p-4 border border-[#e1e1e1] rounded-none bg-[#f9f9f9]">
                  <label className="block text-sm text-[#7A7A7A] mb-2">
                    Estado de la orden *
                  </label>
                  <div className="flex items-center gap-4">
                    <select
                      name="orderStatus"
                      value={form.orderStatus}
                      onChange={handleFieldChange}
                      disabled={isOrderStatusUpdating}
                      className="select rounded-none border border-[#e1e1e1] bg-[#FFFFFF] text-[#222222] px-3 py-2 flex-1"
                    >
                      <option value={OrderStatus.Processing}>Processing</option>
                      <option value={OrderStatus.OnHold}>On Hold</option>
                      <option value={OrderStatus.PendingPayment}>
                        Pending Payment
                      </option>
                      <option value={OrderStatus.Completed}>Completed</option>
                      <option value={OrderStatus.Cancelled}>Cancelled</option>
                      <option value={OrderStatus.Refunded}>Refunded</option>
                    </select>
                    {isOrderStatusUpdating && (
                      <span className="loading loading-spinner loading-sm"></span>
                    )}
                  </div>
                  <p className="text-xs text-[#7A7A7A] mt-2">
                    El estado se actualiza automáticamente al seleccionar una
                    nueva opción.
                  </p>
                </div>
                {/* Permitir ver factura */}
                <div className="mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.allowViewInvoice}
                      onChange={handleAllowViewInvoiceChange}
                      disabled={isAllowViewInvoiceUpdating}
                      className="checkbox checkbox-sm border-[#e1e1e1] checked:bg-[#222222] checked:border-[#222222]"
                    />
                    <span className="text-sm text-[#222222]">
                      Permitir ver factura de compra
                    </span>
                    {isAllowViewInvoiceUpdating && (
                      <span className="loading loading-spinner loading-xs ml-2"></span>
                    )}
                  </label>
                </div>

                {/* Métodos de pago, envío y tipo de entrega */}
                <div className="flex flex-col gap-4 mt-4">
                  {/* Método de pago */}
                  <div>
                    <label className="block text-sm text-[#7A7A7A] mb-2">
                      Método de pago *
                    </label>
                    <div className="flex flex-col gap-2">
                      {[
                        PaymentMethod.BankTransfer,
                        PaymentMethod.CashOnDelivery,
                      ].map((method) => (
                        <label
                          key={method}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={method}
                            checked={form.paymentMethod === method}
                            onChange={handleFieldChange}
                            disabled={isPaymentMethodUpdating}
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
                          {isPaymentMethodUpdating && (
                            <span className="loading loading-spinner loading-xs ml-2"></span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Método de envío */}
                  <div>
                    <label className="block text-sm text-[#7A7A7A] mb-2">
                      Método de envío *
                    </label>
                    <div className="flex flex-col gap-2">
                      {[
                        ShippingMethod.Motorcycle,
                        ShippingMethod.ParcelCompany,
                      ].map((method) => (
                        <label
                          key={method}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="shippingMethod"
                            value={method}
                            checked={form.shippingMethod === method}
                            onChange={handleFieldChange}
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
                      ))}
                    </div>
                  </div>

                  {/* Tipo de entrega (solo para ParcelCompany) */}
                  {form.shippingMethod === ShippingMethod.ParcelCompany && (
                    <div>
                      <label className="block text-sm text-[#7A7A7A] mb-2">
                        Tipo de entrega *
                      </label>
                      <div className="flex flex-col gap-2">
                        {[
                          DeliveryType.HomeDelivery,
                          DeliveryType.PickupPoint,
                        ].map((type) => (
                          <label
                            key={type}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              type="radio"
                              name="deliveryType"
                              value={type}
                              checked={
                                form.shippingAddress.deliveryType === type
                              }
                              onChange={handleDeliveryTypeChange}
                              className="radio border-[#e1e1e1] checked:bg-[#222222]"
                            />
                            <span className="text-[#222222] text-sm">
                              {type === DeliveryType.HomeDelivery
                                ? "Entrega a domicilio"
                                : "Retiro en punto de entrega"}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Campos específicos de transporte */}
                  {form.shippingMethod === ShippingMethod.ParcelCompany && (
                    <>
                      <div>
                        <label className="block text-sm text-[#7A7A7A] mb-2">
                          Transporte / Empresa de encomienda *
                        </label>
                        <input
                          type="text"
                          name="shippingCompany"
                          value={form.shippingAddress.shippingCompany || ""}
                          onChange={handleAddressChange}
                          className="input w-full border rounded-none bg-[#FFFFFF] text-[#222222]"
                          style={{ borderColor: "#e1e1e1" }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-[#7A7A7A] mb-2">
                          Valor declarado (opcional)
                        </label>
                        <input
                          type="text"
                          name="declaredShippingAmount"
                          value={
                            form.shippingAddress.declaredShippingAmount || ""
                          }
                          onChange={handleAddressChange}
                          className="input w-full border rounded-none bg-[#FFFFFF] text-[#222222]"
                          style={{ borderColor: "#e1e1e1" }}
                        />
                      </div>
                    </>
                  )}

                  {/* Franja horaria */}
                  <div>
                    <label className="block text-sm text-[#7A7A7A] mb-2">
                      Franja horaria (opcional)
                    </label>
                    <input
                      type="text"
                      name="deliveryWindow"
                      value={form.shippingAddress.deliveryWindow || ""}
                      onChange={handleAddressChange}
                      placeholder="Ej: 11:00 - 16:00"
                      className="input w-full border rounded-none bg-[#FFFFFF] text-[#222222]"
                      style={{ borderColor: "#e1e1e1" }}
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
                      className={name === "email" ? "col-span-2" : ""}
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
                        value={
                          form.shippingAddress[name as keyof ShippingAddress] ||
                          ""
                        }
                        onChange={handleAddressChange}
                        name={name}
                        className="input w-full border rounded-none bg-[#FFFFFF] text-[#222222]"
                        style={{ borderColor: "#e1e1e1" }}
                        required={!["companyName", "cuit"].includes(name)}
                      />
                    </div>
                  ))}

                  {/* Campo de dirección (solo para entrega a domicilio) */}
                  {(form.shippingMethod !== ShippingMethod.ParcelCompany ||
                    form.shippingAddress.deliveryType ===
                      DeliveryType.HomeDelivery) && (
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
                        value={form.shippingAddress.streetAddress || ""}
                        onChange={handleAddressChange}
                        name="streetAddress"
                        className="input w-full border rounded-none bg-[#FFFFFF] text-[#222222]"
                        style={{ borderColor: "#e1e1e1" }}
                      />
                    </div>
                  )}

                  {/* Campo de punto de retiro (solo para pickup point) */}
                  {form.shippingMethod === ShippingMethod.ParcelCompany &&
                    form.shippingAddress.deliveryType ===
                      DeliveryType.PickupPoint && (
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
                          value={form.shippingAddress.pickupPointAddress || ""}
                          onChange={handleAddressChange}
                          name="pickupPointAddress"
                          className="input w-full border rounded-none bg-[#FFFFFF] text-[#222222]"
                          style={{ borderColor: "#e1e1e1" }}
                          placeholder="Ej: Sucursal Correo Argentino - Av. Corrientes 500"
                        />
                      </div>
                    )}

                  {["city", "state", "postalCode", "companyName"].map(
                    (name) => (
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
                          value={
                            form.shippingAddress[
                              name as keyof ShippingAddress
                            ] || ""
                          }
                          onChange={handleAddressChange}
                          name={name}
                          className="input w-full border rounded-none bg-[#FFFFFF] text-[#222222]"
                          style={{ borderColor: "#e1e1e1" }}
                          required={!["companyName"].includes(name)}
                        />
                      </div>
                    )
                  )}
                </div>
                {/* Lista de variantes seleccionadas */}
                {form.items.length > 0 && (
                  <div className="mb-2">
                    <div className="font-semibold mb-1 text-[#222222]">
                      Ítems de la orden:
                    </div>
                    <div className="overflow-x-auto">
                      <table className="table table-auto w-full min-w-[720px] border border-[#e1e1e1]">
                        {/* head */}
                        <thead>
                          <tr className="text-[#111111]">
                            <th>Producto</th>
                            <th>Cost of Goods</th>
                            <th>Precio</th>
                            <th>Cantidad</th>
                            <th>Subtotal</th>
                            <th>Contribución Marginal</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {form.items.map((item) => (
                            <tr
                              key={item.productVariant.id}
                              className="text-[#222222]"
                            >
                              <td>
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
                                        item.productVariant.product.productModel
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
                                      {item.productVariant.product.productModel}
                                    </span>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span
                                        className="text-sm text-gray-500 truncate"
                                        title={`Color: ${item.productVariant.color?.name}`}
                                      >
                                        Color: {item.productVariant.color?.name}
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
                              </td>
                              <td>
                                {formatCurrency(item.cogsUSD, "en-US", "USD")}
                              </td>
                              <td>
                                {formatCurrency(
                                  item.priceUSDAtPurchase,
                                  "en-US",
                                  "USD"
                                )}
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min={1}
                                  value={item.quantity}
                                  onChange={(e) =>
                                    handleQuantityChange(
                                      item.productVariant.id,
                                      Number(e.target.value)
                                    )
                                  }
                                  disabled={
                                    itemOperationLoading ===
                                    item.productVariant.id
                                  }
                                  className="input input-xs w-16 text-[#222222] bg-white border-[#bdbdbd] rounded-md shadow-sm focus:ring-2 focus:ring-[#388e3c] focus:outline-none disabled:opacity-50"
                                />
                              </td>
                              <td>
                                {formatCurrency(item.subTotal, "en-US", "USD")}
                              </td>
                              <td>
                                {formatCurrency(
                                  item.contributionMarginUSD,
                                  "en-US",
                                  "USD"
                                )}
                              </td>
                              <td>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    className="btn btn-xs text-white bg-[#2196f3] border-[#2196f3] rounded-md shadow-md hover:bg-[#1976d2] hover:border-[#1976d2] transition-colors duration-200 ease-in-out"
                                    onClick={() => handleEditPrices(item)}
                                    disabled={
                                      itemOperationLoading ===
                                      item.productVariant.id
                                    }
                                    title="Editar precios"
                                  >
                                    <Edit3 size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-xs text-white bg-[#d32f2f] border-[#d32f2f] rounded-md shadow-md hover:bg-[#b71c1c] hover:border-[#b71c1c] transition-colors duration-200 ease-in-out"
                                    onClick={() =>
                                      handleRemoveVariant(
                                        item.productVariant.id
                                      )
                                    }
                                    disabled={
                                      itemOperationLoading ===
                                      item.productVariant.id
                                    }
                                    title="Eliminar producto"
                                  >
                                    {itemOperationLoading ===
                                    item.productVariant.id ? (
                                      <span className="loading loading-spinner loading-xs"></span>
                                    ) : (
                                      <Trash size={16} />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {form.refund && (
                            <tr>
                              <td
                                colSpan={6}
                                className="text-sm text-[#A00000]"
                              >
                                Reembolso: -
                                {formatCurrency(
                                  form.refund.appliedAmount,
                                  "en-US",
                                  "USD"
                                )}
                                {form.refund.reason && (
                                  <span className="text-xs text-[#A00000]">
                                    {" "}
                                    - {form.refund.reason}
                                  </span>
                                )}
                              </td>
                              <td className="text-right">
                                <button
                                  type="button"
                                  onClick={() => handleCancelRefund()}
                                  disabled={cancelRefundLoading}
                                  className="btn btn-xs text-white bg-[#d32f2f] border-[#d32f2f] rounded-md shadow-md hover:bg-[#b71c1c] hover:border-[#b71c1c] transition-colors duration-200 ease-in-out disabled:opacity-50"
                                  title="Cancelar reembolso"
                                >
                                  {cancelRefundLoading ? (
                                    <span className="loading loading-spinner loading-xs"></span>
                                  ) : (
                                    "×"
                                  )}
                                </button>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {/* Subtotal y Total */}
                <div className="mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-[#222222]">
                      Subtotal:
                    </span>
                    <span className="text-sm text-[#222222]">
                      {formatCurrency(form.subTotal, "en-US", "USD")}
                    </span>
                  </div>
                  {form.bankTransferExpense &&
                    form.paymentMethod === PaymentMethod.BankTransfer && (
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm font-semibold text-[#222222]">
                          Gasto por Transferencia bancaria:
                        </span>
                        <span className="text-sm text-[#222222]">
                          {formatCurrency(
                            form.bankTransferExpense,
                            "en-US",
                            "USD"
                          )}
                        </span>
                      </div>
                    )}
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm font-semibold text-[#222222]">
                      Total:
                    </span>
                    <span className="text-sm text-[#222222]">
                      {formatCurrency(form.totalAmount, "en-US", "USD")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm font-semibold text-[#222222]">
                      Total en ARS:
                    </span>
                    <span className="text-sm text-[#222222]">
                      {formatCurrency(form.totalAmountARS, "es-AR", "ARS")}
                    </span>
                  </div>
                  {form.refund && (
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm font-semibold text-[#A00000]">
                        Reembolso:
                      </span>
                      <span className="text-sm text-[#A00000]">
                        -
                        {formatCurrency(
                          form.refund.appliedAmount,
                          "en-US",
                          "USD"
                        )}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm font-semibold text-[#222222]">
                      Cost of Goods:
                    </span>
                    <span className="text-sm text-[#222222]">
                      {formatCurrency(form.totalCogsUSD, "en-US", "USD")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm font-semibold text-[#222222]">
                      Contribución Marginal:
                    </span>
                    <span className="text-sm text-[#222222]">
                      {formatCurrency(
                        form.totalContributionMarginUSD,
                        "en-US",
                        "USD"
                      )}
                    </span>
                  </div>
                </div>
                {/* Botón para añadir items */}
                <button
                  type="button"
                  onClick={handleOpenAddItemsModal}
                  className="mt-4 btn rounded-none shadow-none border-none h-12 px-6 w-full transition-colors duration-300 ease-in-out text-white bg-[#222222] hover:bg-[#111111]"
                >
                  Add Items
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !hasChanges()}
                  className="mt-4 btn rounded-none shadow-none border-none h-12 px-6 w-full transition-colors duration-300 ease-in-out text-white bg-[#388e3c] border-[#388e3c] disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? "Guardando..."
                    : hasChanges()
                    ? "Guardar cambios"
                    : "Sin cambios"}
                </button>
              </form>
            </div>
          </div>

          {/* Customer History Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Remito Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-[#111111]">Remito</h4>
                <span className="text-xs text-gray-500">
                  #{form.orderNumber}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Descargar remito de la orden
              </p>
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="btn w-full rounded-none shadow-none border-none h-10 px-4 text-white bg-[#222222] hover:bg-[#111111]"
                aria-label="Descargar remito"
              >
                {isDownloading ? <LoadingSpinner /> : "Descargar remito"}
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-[#111111] mb-4">
                Customer History
              </h3>

              {/* Customer Info */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-medium text-sm">
                      {form.user.displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {form.user.displayName}
                    </p>
                    <p className="text-xs text-gray-500">{form.user.email}</p>
                  </div>
                </div>
              </div>

              {/* Analytics Metrics */}
              {isLoadingUserDetails ? (
                <div className="space-y-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ) : currentUserMetrics ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                    <p className="text-xl font-bold text-gray-900">
                      {currentUserMetrics.totalOrders}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(
                        currentUserMetrics.totalRevenue,
                        "en-US",
                        "USD"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Average Order Value
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(
                        currentUserMetrics.averageOrderValue,
                        "en-US",
                        "USD"
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  No analytics data available
                </div>
              )}
            </div>

            {/* Refund Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-[#111111] mb-4">
                Reembolsos
              </h3>

              {/* Current Refund Display */}
              {form.refund ? (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-800">
                      Reembolso Aplicado
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-green-700">
                    <p>
                      <span className="font-medium">Tipo:</span>{" "}
                      {form.refund.type === "fixed"
                        ? "Monto Fijo"
                        : "Porcentaje"}
                    </p>
                    <p>
                      <span className="font-medium">Valor:</span>{" "}
                      {form.refund.type === "fixed"
                        ? formatCurrency(form.refund.amount, "en-US", "USD")
                        : `${form.refund.amount}%`}
                    </p>
                    <p>
                      <span className="font-medium">Monto aplicado:</span>{" "}
                      {formatCurrency(
                        form.refund.appliedAmount,
                        "en-US",
                        "USD"
                      )}
                    </p>
                    {form.refund.reason && (
                      <p>
                        <span className="font-medium">Razón:</span>{" "}
                        {form.refund.reason}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Procesado:</span>{" "}
                      {new Date(form.refund.processedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-3">
                    No se ha aplicado ningún reembolso a esta orden.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenRefundForm}
                    className="btn btn-sm w-full rounded-md shadow-sm border border-blue-500 bg-blue-500 text-white hover:bg-blue-600 hover:border-blue-600 transition-colors"
                    disabled={refundLoading}
                  >
                    {refundLoading ? "Verificando..." : "Aplicar Reembolso"}
                  </button>
                </div>
              )}

              {/* Refund Error Display */}
              {refundError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{refundError}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de edición de precios */}
      {editPricesModal.item && (
        <EditItemPricesModal
          item={editPricesModal.item}
          isOpen={editPricesModal.isOpen}
          onClose={handleClosePricesModal}
          onSave={handleSavePrices}
          loading={editPricesModal.loading}
        />
      )}

      {/* Modal de Añadir Items */}
      {addItemsModal.isOpen && (
        <dialog className="modal modal-open">
          <div className="modal-box w-full max-w-4xl rounded-none border border-[#e1e1e1] bg-[#FFFFFF] text-[#222222] p-0 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#FFFFFF] border-b border-[#e1e1e1] flex justify-between items-center h-12 z-30">
              <h3 className="font-bold text-lg text-[#111111] m-0 px-4">
                Añadir Items a la Orden
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
                    💡 Los items agregados permanecerán visibles arriba. Usa
                    &quot;Limpiar&quot; para nueva búsqueda.
                  </p>
                )}
              </div>

              {/* Estado de carga */}
              {searchLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#222222]"></div>
                  <span className="ml-3 text-[#222222]">
                    Buscando productos...
                  </span>
                </div>
              )}

              {/* Items agregados en esta sesión */}
              {form && form.items.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-4 text-[#222222]">
                    Items en la orden ({form.items.length} items)
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto bg-green-50 border border-green-200 rounded-none p-4">
                    {form.items.map((item) => (
                      <div
                        key={item.productVariant.id}
                        className="flex items-center justify-between p-2 bg-white border border-green-200 rounded-none"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{
                              backgroundColor: item.productVariant.color.hex,
                            }}
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-[#222222]">
                              {item.productVariant.product.productModel}
                            </span>
                            <div className="text-xs text-[#7A7A7A]">
                              Color: {item.productVariant.color.name} | SKU:{" "}
                              {item.productVariant.product.sku}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-green-700">
                            Cantidad: {item.quantity}
                          </span>
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-none">
                            ✓ Agregado
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resultados de búsqueda */}
              {searchResults.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-4 text-[#222222]">
                    Resultados de búsqueda ({searchResults.length} productos
                    encontrados)
                  </h4>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {searchResults.map((product) => (
                      <div
                        key={product.id}
                        className="border border-[#e1e1e1] rounded-none p-4 bg-white"
                      >
                        <div className="flex items-start gap-4">
                          {/* Imagen del producto */}
                          <div className="flex-shrink-0 w-16 h-16 overflow-hidden rounded-md bg-gray-50 border border-gray-200">
                            <Image
                              src={`${process.env.NEXT_PUBLIC_API_URL}/${
                                product.thumbnail || "placeholder-image.jpg"
                              }`}
                              alt={product.productModel}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Información del producto */}
                          <div className="flex-1">
                            <h5 className="font-medium text-[#222222] mb-1">
                              {product.productModel}
                            </h5>
                            <p className="text-sm text-[#7A7A7A] mb-2">
                              SKU: {product.sku}
                            </p>

                            {/* Variantes disponibles */}
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-[#222222]">
                                Variantes disponibles:
                              </p>
                              <div className="space-y-3">
                                {product.variants.map((variant) => {
                                  const isAlreadyInOrder = form?.items.some(
                                    (item) =>
                                      item.productVariant.id === variant.id
                                  );
                                  const isLoading =
                                    itemOperationLoading === variant.id;
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
                                                variant
                                              )
                                            }
                                            disabled={
                                              isLoading ||
                                              currentQuantity > variant.stock
                                            }
                                          >
                                            {isLoading ? (
                                              <>
                                                <span className="loading loading-spinner loading-xs mr-1"></span>
                                                Agregando...
                                              </>
                                            ) : (
                                              "Agregar"
                                            )}
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
                      No se encontraron productos para &quot;
                      {addItemsModal.productQuery}&quot;
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

      {/* Modal de Reembolso */}
      {refundForm.isOpen && (
        <dialog className="modal modal-open">
          <div className="modal-box w-full max-w-md rounded-none border border-[#e1e1e1] bg-[#FFFFFF] text-[#222222] p-0 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#FFFFFF] border-b border-[#e1e1e1] flex justify-between items-center h-12 z-30">
              <h3 className="font-bold text-lg text-[#111111] m-0 px-4">
                Aplicar Reembolso
              </h3>
              <button
                className="btn btn-sm bg-transparent text-[#333333] hover:text-[#111111] shadow-none h-full w-12 border-l border-[#e1e1e1] border-t-0 border-r-0 border-b-0 m-0"
                onClick={handleCloseRefundForm}
                disabled={refundLoading}
              >
                ✕
              </button>
            </div>

            <div className="p-4">
              {/* Refund Eligibility Check */}
              {refundEligibilityLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2271B1] mx-auto"></div>
                  <p className="text-sm text-[#333333] mt-2">
                    Verificando elegibilidad...
                  </p>
                </div>
              ) : refundEligibility ? (
                refundEligibility.canRefund ? (
                  <div className="space-y-4">
                    {/* Order Info */}
                    <div className="mb-4">
                      <p className="text-sm text-[#333333]">
                        <strong className="text-[#111111]">Orden:</strong> #
                        {form.orderNumber}
                      </p>
                      <p className="text-sm text-[#333333]">
                        <strong className="text-[#111111]">Cliente:</strong>{" "}
                        {form.user.displayName}
                      </p>
                    </div>

                    {/* Refund Type */}
                    <div>
                      <label className="block text-sm font-medium text-[#111111] mb-2">
                        Tipo de Reembolso
                      </label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="refundType"
                            value="fixed"
                            checked={refundForm.type === "fixed"}
                            onChange={(e) =>
                              handleRefundFormChange("type", e.target.value)
                            }
                            className="mr-2 text-[#2271B1]"
                          />
                          <span className="text-sm text-[#333333]">
                            Monto Fijo (USD)
                          </span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="refundType"
                            value="percentage"
                            checked={refundForm.type === "percentage"}
                            onChange={(e) =>
                              handleRefundFormChange("type", e.target.value)
                            }
                            className="mr-2 text-[#2271B1]"
                          />
                          <span className="text-sm text-[#333333]">
                            Porcentaje (%)
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Amount */}
                    <div>
                      <label className="block text-sm font-medium text-[#111111] mb-1">
                        {refundForm.type === "fixed"
                          ? "Monto (USD)"
                          : "Porcentaje (%)"}
                      </label>
                      <input
                        type="number"
                        step={refundForm.type === "fixed" ? "0.01" : "1"}
                        min="0"
                        max={
                          refundForm.type === "percentage" ? "100" : undefined
                        }
                        value={refundForm.amount}
                        onChange={(e) =>
                          handleRefundFormChange("amount", e.target.value)
                        }
                        placeholder={refundForm.type === "fixed" ? "0.00" : "0"}
                        className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                        required
                      />
                      {refundEligibility.maxRefundAmount &&
                        refundForm.type === "fixed" && (
                          <p className="text-xs text-[#333333] mt-1">
                            Máximo reembolsable:{" "}
                            {formatCurrency(
                              refundEligibility.maxRefundAmount,
                              "en-US",
                              "USD"
                            )}
                          </p>
                        )}
                    </div>

                    {/* Reason */}
                    <div>
                      <label className="block text-sm font-medium text-[#111111] mb-1">
                        Razón (Opcional)
                      </label>
                      <textarea
                        value={refundForm.reason}
                        onChange={(e) =>
                          handleRefundFormChange("reason", e.target.value)
                        }
                        placeholder="Descripción del motivo del reembolso..."
                        className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                        rows={3}
                      />
                    </div>

                    {/* Preview */}
                    {refundForm.amount && (
                      <div className="bg-[#f8f9fa] p-3 rounded-none border border-[#e1e1e1]">
                        <h4 className="text-sm font-medium text-[#111111] mb-2">
                          Vista Previa:
                        </h4>
                        <div className="text-xs text-[#333333] space-y-1">
                          <div>
                            Tipo:{" "}
                            {refundForm.type === "fixed"
                              ? "Monto Fijo"
                              : "Porcentaje"}
                          </div>
                          <div>
                            Valor:{" "}
                            {refundForm.type === "fixed"
                              ? `$${parseFloat(
                                  refundForm.amount || "0"
                                ).toFixed(2)}`
                              : `${refundForm.amount}%`}
                          </div>
                          {refundForm.type === "percentage" && (
                            <div>
                              Monto estimado: $
                              {(
                                (parseFloat(refundForm.amount || "0") / 100) *
                                (form.subTotal || 0)
                              ).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={handleCloseRefundForm}
                        className="flex-1 px-4 py-2 text-[#333333] bg-[#f1f1f1] rounded-none hover:bg-[#e1e1e1] transition-colors border border-[#e1e1e1]"
                        disabled={refundLoading}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyRefund}
                        disabled={refundLoading || !refundForm.amount}
                        className="flex-1 px-4 py-2 text-white bg-[#222222] rounded-none hover:bg-[#111111] transition-colors disabled:opacity-50 shadow-none"
                      >
                        {refundLoading ? "Aplicando..." : "Aplicar Reembolso"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-red-600 font-bold">!</span>
                    </div>
                    <p className="text-red-600 font-medium mb-2">
                      No se puede aplicar reembolso
                    </p>
                    <p className="text-sm text-[#333333]">
                      {refundEligibility.reason}
                    </p>
                    <button
                      type="button"
                      onClick={handleCloseRefundForm}
                      className="mt-4 px-4 py-2 text-white bg-[#222222] rounded-none hover:bg-[#111111] transition-colors shadow-none"
                    >
                      Cerrar
                    </button>
                  </div>
                )
              ) : (
                <div className="text-center py-4">
                  <p className="text-[#333333]">
                    Error al verificar elegibilidad
                  </p>
                  <button
                    type="button"
                    onClick={handleCloseRefundForm}
                    className="mt-4 px-4 py-2 text-white bg-[#222222] rounded-none hover:bg-[#111111] transition-colors shadow-none"
                  >
                    Cerrar
                  </button>
                </div>
              )}
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
};

export default EditOrderPage;
