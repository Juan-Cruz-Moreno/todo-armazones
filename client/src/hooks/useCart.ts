import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  getCart,
  addItemToCart,
  incrementItemInCart,
  decrementItemInCart,
  removeItemFromCart,
  clearError,
  clearAllErrors,
  clearCart,
} from "@/redux/slices/cartSlice";
import { AddItemToCartPayload, UpdateCartItemPayload } from "@/interfaces/cart";

export const useCart = () => {
  const dispatch = useAppDispatch();
  const { cart, loading, error } = useAppSelector((state) => state.cart);
  const { user } = useAppSelector((state) => state.auth); // ✅ Obtener user del estado

  // Métodos para manejar el carrito
  const fetchCart = useCallback(() => {
    dispatch(getCart());
  }, [dispatch]);

  const addItem = useCallback(
    (payload: AddItemToCartPayload) => {
      return dispatch(addItemToCart(payload));
    },
    [dispatch]
  );

  const incrementItem = useCallback(
    (payload: UpdateCartItemPayload) => {
      return dispatch(incrementItemInCart(payload));
    },
    [dispatch]
  );

  const decrementItem = useCallback(
    (payload: UpdateCartItemPayload) => {
      return dispatch(decrementItemInCart(payload));
    },
    [dispatch]
  );

  const removeItem = useCallback(
    (payload: UpdateCartItemPayload) => {
      return dispatch(removeItemFromCart(payload));
    },
    [dispatch]
  );

  // Métodos para manejar errores
  const clearSpecificError = useCallback(
    (errorType: keyof typeof error) => {
      dispatch(clearError(errorType));
    },
    [dispatch]
  );

  const clearErrors = useCallback(() => {
    dispatch(clearAllErrors());
  }, [dispatch]);

  const resetCart = useCallback(() => {
    dispatch(clearCart());
  }, [dispatch]);

  // Cargar carrito automáticamente solo si hay usuario autenticado
  useEffect(() => {
    if (user && !cart && !loading.getCart) {
      fetchCart();
    }
  }, [user, cart, loading.getCart, fetchCart]);

  // ✅ Limpiar carrito cuando el usuario hace logout
  useEffect(() => {
    if (!user && cart) {
      resetCart();
    }
  }, [user, cart, resetCart]);

  // Computed values
  const totalItems =
    cart?.items.reduce((total, item) => total + item.quantity, 0) || 0;
  const isEmpty = !cart || cart.items.length === 0;
  const isLoading = Object.values(loading).some(Boolean);
  const hasErrors = Object.values(error).some(Boolean);

  // Helper para obtener la cantidad de un producto específico
  const getItemQuantity = useCallback(
    (productVariantId: string): number => {
      if (!cart) return 0;
      const item = cart.items.find(
        (item) => item.productVariant._id === productVariantId
      );
      return item?.quantity || 0;
    },
    [cart]
  );

  // Helper para verificar si un producto está en el carrito
  const isItemInCart = useCallback(
    (productVariantId: string): boolean => {
      if (!cart) return false;
      return cart.items.some(
        (item) => item.productVariant._id === productVariantId
      );
    },
    [cart]
  );

  // Helper para obtener un item específico del carrito
  const getCartItem = useCallback(
    (productVariantId: string) => {
      if (!cart) return null;
      return (
        cart.items.find(
          (item) => item.productVariant._id === productVariantId
        ) || null
      );
    },
    [cart]
  );

  // Helpers para loading/error por ítem
  const getItemLoading = useCallback(
    (type: "incrementItem" | "decrementItem" | "removeItem", productVariantId: string) => {
      return loading[type][productVariantId] || false;
    },
    [loading]
  );

  const getItemError = useCallback(
    (type: "incrementItem" | "decrementItem" | "removeItem", productVariantId: string) => {
      return error[type][productVariantId] || null;
    },
    [error]
  );

  // Helpers para loading/error de addItem
  const getAddItemLoading = useCallback(
    (productVariantId: string) => {
      return loading.addItem[productVariantId] || false;
    },
    [loading.addItem]
  );

  const getAddItemError = useCallback(
    (productVariantId: string) => {
      return error.addItem[productVariantId] || null;
    },
    [error.addItem]
  );

  return {
    // Estado del carrito
    cart,
    totalItems,
    isEmpty,
    isLoading,
    hasErrors,

    // Estados de loading específicos
    loading,
    getItemLoading,
    getAddItemLoading,

    // Estados de error específicos
    error,
    getItemError,
    getAddItemError,

    // Métodos para manejar el carrito
    fetchCart,
    addItem,
    incrementItem,
    decrementItem,
    removeItem,

    // Métodos para manejar errores
    clearSpecificError,
    clearErrors,
    resetCart,

    // Helpers
    getItemQuantity,
    isItemInCart,
    getCartItem,
  };
};
