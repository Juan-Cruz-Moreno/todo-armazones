import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  createOrder,
  fetchOrders,
  selectOrders,
  selectOrdersError,
  selectOrdersLoading,
  selectOrdersNextCursor,
  selectOrdersStatusFilter,
  clearOrderError,
  setStatusFilter,
  resetOrders,
} from "@/redux/slices/orderSlice";
import type { CreateOrderPayload } from "@/interfaces/order";
import { OrderStatus } from "@/enums/order.enum";

export const useOrders = () => {
  const dispatch = useAppDispatch();

  const orders = useAppSelector(selectOrders);
  const loading = useAppSelector(selectOrdersLoading);
  const error = useAppSelector(selectOrdersError);
  const nextCursor = useAppSelector(selectOrdersNextCursor);
  const statusFilter = useAppSelector(selectOrdersStatusFilter);

  const getOrders = (
    params?: { status?: OrderStatus; cursor?: string; limit?: number }
  ) => {
    dispatch(fetchOrders(params));
  };

  const placeOrder = async (payload: CreateOrderPayload) => {
    const result = await dispatch(createOrder(payload));
    // Si la orden se creó correctamente, recarga las órdenes
    if (createOrder.fulfilled.match(result)) {
      dispatch(fetchOrders());
    }
    return result;
  };

  const resetError = () => {
    dispatch(clearOrderError());
  };

  const setFilter = (status?: OrderStatus) => {
    dispatch(setStatusFilter(status));
  };

  const clearOrders = () => {
    dispatch(resetOrders());
  };

  return {
    orders,
    loading,
    error,
    nextCursor,
    statusFilter,
    getOrders,
    placeOrder,
    resetError,
    setFilter,
    clearOrders,
  };
};
