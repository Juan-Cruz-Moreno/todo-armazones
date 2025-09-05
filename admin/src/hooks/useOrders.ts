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
  RefundCancelEligibilityResponse
} from "@/interfaces/order";
import { OrderStatus } from "@/enums/order.enum";

const useOrders = () => {
  const dispatch = useAppDispatch();

  // Selectores
  const orders = useAppSelector((state) => state.orders.orders);
  const orderById = useAppSelector((state) => state.orders.orderById);
  const nextCursor = useAppSelector((state) => state.orders.nextCursor);
  const loading = useAppSelector((state) => state.orders.loading);
  const bulkUpdateLoading = useAppSelector((state) => state.orders.bulkUpdateLoading);
  const error = useAppSelector((state) => state.orders.error);
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

  return {
    orders,
    orderById,
    nextCursor,
    loading,
    bulkUpdateLoading,
    error,
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
    setFilter,
    clearOrders,
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
  };
};

export default useOrders;
