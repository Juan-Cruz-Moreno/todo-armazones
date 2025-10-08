import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchOrders,
  updateOrder,
  updateItemPrices,
  setStatusFilter,
  resetOrders,
  createOrderAsAdmin,
  fetchOrderById,
  bulkUpdateOrderStatus,
  checkOrderStockAvailability,
  updateOrderStatusWithConflictHandling,
  clearStockAvailability,
  clearOrderById as clearOrderByIdAction,
  applyRefund,
  checkRefundEligibility,
  cancelRefund,
  checkRefundCancelEligibility,
  clearRefundState,
  fetchOrdersCount,
  fetchOrdersByPage,
  fetchOrdersPaginationInfo,
  hideCancelledOrder,
  searchOrders,
  clearSearchResults,
  CreateOrderAdminPayload,
} from "@/redux/slices/orderSlice";
import type { 
  Order, 
  UpdateOrderPayload,
  UpdateItemPricesPayload,
  BulkUpdateOrderStatusPayload, 
  BulkUpdateOrderStatusResponse,
  StockAvailabilityResponse,
  OrderStatusUpdateResult,
  ApplyRefundPayload,
  ApplyRefundResponse,
  RefundEligibilityResponse,
  CancelRefundResponse,
  RefundCancelEligibilityResponse,
  HideCancelledOrderResponse,
  SearchOrdersPayload,
  SearchOrdersResponse
} from "@/interfaces/order";
import { OrderStatus } from "@/enums/order.enum";

const useOrders = () => {
  const dispatch = useAppDispatch();

  // Selectores
  const orders = useAppSelector((state) => state.orders.orders);
  const ordersByPage = useAppSelector((state) => state.orders.ordersByPage);
  const pagination = useAppSelector((state) => state.orders.pagination);
  const orderById = useAppSelector((state) => state.orders.orderById);
  const nextCursor = useAppSelector((state) => state.orders.nextCursor);
  const loading = useAppSelector((state) => state.orders.loading);
  const bulkUpdateLoading = useAppSelector((state) => state.orders.bulkUpdateLoading);
  const error = useAppSelector((state) => state.orders.error);
  const paginationInfoLoading = useAppSelector((state) => state.orders.paginationInfoLoading);
  const paginationInfoError = useAppSelector((state) => state.orders.paginationInfoError);
  const statusFilter = useAppSelector((state) => state.orders.statusFilter);
  const stockAvailability = useAppSelector((state) => state.orders.stockAvailability);
  const stockCheckLoading = useAppSelector((state) => state.orders.stockCheckLoading);
  const stockCheckError = useAppSelector((state) => state.orders.stockCheckError);
  const refundLoading = useAppSelector((state) => state.orders.refundLoading);
  const refundError = useAppSelector((state) => state.orders.refundError);
  const refundEligibility = useAppSelector((state) => state.orders.refundEligibility);
  const refundEligibilityLoading = useAppSelector((state) => state.orders.refundEligibilityLoading);
  const cancelRefundLoading = useAppSelector((state) => state.orders.cancelRefundLoading);
  const cancelRefundError = useAppSelector((state) => state.orders.cancelRefundError);
  const refundCancelEligibility = useAppSelector((state) => state.orders.refundCancelEligibility);
  const refundCancelEligibilityLoading = useAppSelector((state) => state.orders.refundCancelEligibilityLoading);
  const counts = useAppSelector((state) => state.orders.counts);
  const countsLoading = useAppSelector((state) => state.orders.countsLoading);
  const countsError = useAppSelector((state) => state.orders.countsError);
  const hideOrderLoading = useAppSelector((state) => state.orders.hideOrderLoading);
  const hideOrderError = useAppSelector((state) => state.orders.hideOrderError);
  const searchResults = useAppSelector((state) => state.orders.searchResults);
  const searchPagination = useAppSelector((state) => state.orders.searchPagination);
  const searchLoading = useAppSelector((state) => state.orders.searchLoading);
  const searchError = useAppSelector((state) => state.orders.searchError);
  
  const getOrderById = useCallback(
    (orderId: string) => {
      dispatch(fetchOrderById(orderId));
    },
    [dispatch]
  );

  // Actions
  const getOrders = useCallback(
    (params?: { status?: OrderStatus; cursor?: string; limit?: number }) => {
      dispatch(fetchOrders(params));
    },
    [dispatch]
  );

  const updateOrderData = useCallback(
    (payload: UpdateOrderPayload) => {
      return dispatch(updateOrder(payload));
    },
    [dispatch]
  );

  const updateItemPricesData = useCallback(
    (payload: UpdateItemPricesPayload) => {
      return dispatch(updateItemPrices(payload));
    },
    [dispatch]
  );

  const setFilter = useCallback(
    (status?: OrderStatus) => {
      dispatch(setStatusFilter(status));
    },
    [dispatch]
  );

  const clearOrders = useCallback(() => {
    dispatch(resetOrders());
  }, [dispatch]);

  const bulkUpdateOrderStatusData = useCallback(
    (
      payload: BulkUpdateOrderStatusPayload,
      onSuccess?: (response: BulkUpdateOrderStatusResponse) => void,
      onError?: (err: unknown) => void
    ) => {
      dispatch(bulkUpdateOrderStatus(payload))
        .unwrap()
        .then((response) => {
          if (onSuccess) onSuccess(response);
        })
        .catch((err) => {
          if (onError) onError(err);
        });
    },
    [dispatch]
  );

  const checkStockAvailability = useCallback(
    (
      orderId: string,
      onSuccess?: (response: StockAvailabilityResponse) => void,
      onError?: (err: unknown) => void
    ) => {
      dispatch(checkOrderStockAvailability(orderId))
        .unwrap()
        .then((response) => {
          if (onSuccess) onSuccess(response);
        })
        .catch((err) => {
          if (onError) onError(err);
        });
    },
    [dispatch]
  );

  const updateOrderStatusWithConflicts = useCallback(
    (
      orderId: string,
      newStatus: OrderStatus,
      onSuccess?: (response: OrderStatusUpdateResult) => void,
      onError?: (err: unknown) => void
    ) => {
      dispatch(updateOrderStatusWithConflictHandling({ orderId, newStatus }))
        .unwrap()
        .then((response) => {
          if (onSuccess) onSuccess(response);
        })
        .catch((err) => {
          if (onError) onError(err);
        });
    },
    [dispatch]
  );

  const clearStockInfo = useCallback(() => {
    dispatch(clearStockAvailability());
  }, [dispatch]);

  const clearOrderById = useCallback(() => {
  dispatch(clearOrderByIdAction());
  }, [dispatch]);

  const applyOrderRefund = useCallback(
    (
      payload: ApplyRefundPayload,
      onSuccess?: (response: ApplyRefundResponse) => void,
      onError?: (err: unknown) => void
    ) => {
      dispatch(applyRefund(payload))
        .unwrap()
        .then((response) => {
          if (onSuccess) onSuccess(response);
        })
        .catch((err) => {
          if (onError) onError(err);
        });
    },
    [dispatch]
  );

  const checkOrderRefundEligibility = useCallback(
    (
      orderId: string,
      onSuccess?: (response: RefundEligibilityResponse) => void,
      onError?: (err: unknown) => void
    ) => {
      dispatch(checkRefundEligibility(orderId))
        .unwrap()
        .then((response) => {
          if (onSuccess) onSuccess(response);
        })
        .catch((err) => {
          if (onError) onError(err);
        });
    },
    [dispatch]
  );

  const clearRefundInfo = useCallback(() => {
    dispatch(clearRefundState());
  }, [dispatch]);

  const cancelOrderRefund = useCallback(
    (
      orderId: string,
      onSuccess?: (response: CancelRefundResponse) => void,
      onError?: (err: unknown) => void
    ) => {
      dispatch(cancelRefund(orderId))
        .unwrap()
        .then((response) => {
          if (onSuccess) onSuccess(response);
        })
        .catch((err) => {
          if (onError) onError(err);
        });
    },
    [dispatch]
  );

  const checkRefundCancelEligibilityData = useCallback(
    (
      orderId: string,
      onSuccess?: (response: RefundCancelEligibilityResponse) => void,
      onError?: (err: unknown) => void
    ) => {
      dispatch(checkRefundCancelEligibility(orderId))
        .unwrap()
        .then((response) => {
          if (onSuccess) onSuccess(response);
        })
        .catch((err) => {
          if (onError) onError(err);
        });
    },
    [dispatch]
  );

  const hideOrder = useCallback(
    (
      orderId: string,
      onSuccess?: (response: HideCancelledOrderResponse) => void,
      onError?: (err: unknown) => void
    ) => {
      dispatch(hideCancelledOrder(orderId))
        .unwrap()
        .then((response) => {
          if (onSuccess) onSuccess(response);
        })
        .catch((err) => {
          if (onError) onError(err);
        });
    },
    [dispatch]
  );

  const searchOrdersData = useCallback(
    (
      payload: SearchOrdersPayload,
      onSuccess?: (response: SearchOrdersResponse) => void,
      onError?: (err: unknown) => void
    ) => {
      dispatch(searchOrders(payload))
        .unwrap()
        .then((response) => {
          if (onSuccess) onSuccess(response);
        })
        .catch((err) => {
          if (onError) onError(err);
        });
    },
    [dispatch]
  );

  const clearSearch = useCallback(() => {
    dispatch(clearSearchResults());
  }, [dispatch]);

  return {
    orders,
    ordersByPage,
    pagination,
    orderById,
    nextCursor,
    loading,
    bulkUpdateLoading,
    error,
    paginationInfoLoading,
    paginationInfoError,
    statusFilter,
    stockAvailability,
    stockCheckLoading,
    stockCheckError,
    refundLoading,
    refundError,
    refundEligibility,
    refundEligibilityLoading,
    cancelRefundLoading,
    cancelRefundError,
    refundCancelEligibility,
    refundCancelEligibilityLoading,
    counts,
    countsLoading,
    countsError,
    hideOrderLoading,
    hideOrderError,
    searchResults,
    searchPagination,
    searchLoading,
    searchError,
    getOrders,
    getOrderById,
    updateOrderData,
    updateItemPricesData,
    bulkUpdateOrderStatusData,
    checkStockAvailability,
    updateOrderStatusWithConflicts,
    clearStockInfo,
    clearOrderById,
    applyOrderRefund,
    checkOrderRefundEligibility,
    clearRefundInfo,
    cancelOrderRefund,
    checkRefundCancelEligibilityData,
    hideOrder,
    setFilter,
    clearOrders,
    searchOrdersData,
    clearSearch,
    createOrderAsAdmin: useCallback(
      (
        payload: CreateOrderAdminPayload,
        onSuccess?: (order: Order) => void,
        onError?: (err: unknown) => void
      ) => {
        dispatch(createOrderAsAdmin(payload))
          .unwrap()
          .then((order) => {
            if (onSuccess) onSuccess(order);
          })
          .catch((err) => {
            if (onError) onError(err);
          });
      },
      [dispatch]
    ),
    getOrdersCount: useCallback(() => {
      dispatch(fetchOrdersCount());
    }, [dispatch]),

    /**
     * Método recomendado para paginación - Optimizado con mejor performance
     * Usa paginación por número de página en lugar de cursors
     */
    fetchOrdersByPage: useCallback(
      (params?: { page?: number; status?: OrderStatus; limit?: number }) => {
        dispatch(fetchOrdersByPage(params));
      },
      [dispatch]
    ),

    /**
     * Obtiene solo metadatos de paginación sin cargar órdenes
     * Útil para contadores rápidos y indicadores de UI - Muy optimizado
     */
    fetchOrdersPaginationInfo: useCallback(
      (params?: { status?: OrderStatus; limit?: number }) => {
        dispatch(fetchOrdersPaginationInfo(params));
      },
      [dispatch]
    ),
  };
};

export default useOrders;
