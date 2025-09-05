// Thunk para obtener una orden por id
export const fetchOrderById = createAsyncThunk<
  Order,
  string,
  { rejectValue: string }
>("orders/fetchOrderById", async (orderId, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get<ApiResponse<Order>>(
      `/orders/${orderId}`
    );
    if (response.data.status !== "success" || !response.data.data) {
      return rejectWithValue(
        response.data.message || "Error al obtener la orden"
      );
    }
    return response.data.data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});
// Payload para crear orden como admin
export interface CreateOrderItemAdminPayload {
  productVariantId: string;
  quantity: number;
}

export interface CreateOrderAdminPayload {
  userId: string;
  items: CreateOrderItemAdminPayload[];
  shippingMethod: string;
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  deliveryWindow?: string;
  declaredShippingAmount?: string;
  createdAt?: string;
  allowViewInvoice?: boolean;
}

// Thunk para crear orden como admin
export const createOrderAsAdmin = createAsyncThunk<
  Order,
  CreateOrderAdminPayload,
  { rejectValue: string }
>("orders/createOrderAsAdmin", async (payload, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post<ApiResponse<Order>>(
      "/orders/admin",
      payload
    );
    if (response.data.status !== "success" || !response.data.data) {
      return rejectWithValue(
        response.data.message || "Error al crear la orden"
      );
    }
    return response.data.data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import { 
  OrdersResponse, 
  Order, 
  UpdateOrderPayload,
  UpdateItemPricesPayload,
  BulkUpdateOrderStatusPayload,
  BulkUpdateOrderStatusResponse,
  StockAvailabilityResponse,
  OrderStatusUpdateResult,
  ShippingAddress,
  ApplyRefundPayload,
  ApplyRefundResponse,
  RefundEligibilityResponse,
  CancelRefundResponse,
  RefundCancelEligibilityResponse
} from "@/interfaces/order";
import { ApiResponse, getErrorMessage } from "@/types/api";
import { OrderStatus } from "@/enums/order.enum";

interface OrderState {
  orders: Order[];
  orderById: Order | null;
  nextCursor: string | null;
  loading: boolean;
  bulkUpdateLoading: boolean;
  error: string | null;
  statusFilter?: OrderStatus;
  stockAvailability: StockAvailabilityResponse | null;
  stockCheckLoading: boolean;
  stockCheckError: string | null;
  refundLoading: boolean;
  refundError: string | null;
  refundEligibility: RefundEligibilityResponse | null;
  refundEligibilityLoading: boolean;
  cancelRefundLoading: boolean;
  cancelRefundError: string | null;
  refundCancelEligibility: RefundCancelEligibilityResponse | null;
  refundCancelEligibilityLoading: boolean;
}

const initialState: OrderState = {
  orders: [],
  orderById: null,
  nextCursor: null,
  loading: false,
  bulkUpdateLoading: false,
  error: null,
  statusFilter: undefined,
  stockAvailability: null,
  stockCheckLoading: false,
  stockCheckError: null,
  refundLoading: false,
  refundError: null,
  refundEligibility: null,
  refundEligibilityLoading: false,
  cancelRefundLoading: false,
  cancelRefundError: null,
  refundCancelEligibility: null,
  refundCancelEligibilityLoading: false,
};

// Thunk para obtener todas las órdenes (con filtro opcional por status)
export const fetchOrders = createAsyncThunk<
  OrdersResponse,
  { status?: OrderStatus; cursor?: string; limit?: number } | undefined,
  { rejectValue: string }
>("orders/fetchOrders", async (params, { rejectWithValue }) => {
  try {
    const query = [];
    if (params?.status) query.push(`status=${params.status}`);
    if (params?.cursor) query.push(`cursor=${params.cursor}`);
    if (params?.limit) query.push(`limit=${params.limit}`);
    const queryString = query.length ? `?${query.join("&")}` : "";
    const response = await axiosInstance.get<ApiResponse<OrdersResponse>>(
      `/orders/all${queryString}`
    );
    if (response.data.status !== "success" || !response.data.data) {
      return rejectWithValue(
        response.data.message || "Error al obtener órdenes"
      );
    }
    return response.data.data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

// Thunk para actualizar orden completa
export const updateOrder = createAsyncThunk<
  Order,
  UpdateOrderPayload,
  { rejectValue: string }
>(
  "orders/updateOrder",
  async ({ orderId, ...updateData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch<ApiResponse<Order>>(
        `/orders/${orderId}`,
        updateData
      );
      if (response.data.status !== "success" || !response.data.data) {
        return rejectWithValue(
          response.data.message || "Error al actualizar la orden"
        );
      }
      return response.data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Thunk para actualización rápida de precios de items
export const updateItemPrices = createAsyncThunk<
  Order,
  UpdateItemPricesPayload,
  { rejectValue: string }
>(
  "orders/updateItemPrices",
  async ({ orderId, items }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch<ApiResponse<Order>>(
        `/orders/${orderId}/update-prices`,
        { items }
      );
      if (response.data.status !== "success" || !response.data.data) {
        return rejectWithValue(
          response.data.message || "Error al actualizar precios"
        );
      }
      return response.data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Thunk para actualización masiva de estados de órdenes
export const bulkUpdateOrderStatus = createAsyncThunk<
  BulkUpdateOrderStatusResponse,
  BulkUpdateOrderStatusPayload,
  { rejectValue: string }
>(
  "orders/bulkUpdateOrderStatus",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch<ApiResponse<BulkUpdateOrderStatusResponse>>(
        "/orders/bulk-status",
        payload
      );
      if (response.data.status !== "success" || !response.data.data) {
        return rejectWithValue(
          response.data.message || "Error en actualización masiva"
        );
      }
      return response.data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Thunk para verificar disponibilidad de stock de una orden
export const checkOrderStockAvailability = createAsyncThunk<
  StockAvailabilityResponse,
  string,
  { rejectValue: string }
>(
  "orders/checkOrderStockAvailability",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get<ApiResponse<StockAvailabilityResponse>>(
        `/orders/${orderId}/stock-availability`
      );
      if (response.data.status !== "success" || !response.data.data) {
        return rejectWithValue(
          response.data.message || "Error al verificar disponibilidad de stock"
        );
      }
      return response.data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Thunk para actualizar estado de orden con manejo de conflictos
export const updateOrderStatusWithConflictHandling = createAsyncThunk<
  OrderStatusUpdateResult,
  { orderId: string; newStatus: OrderStatus },
  { rejectValue: string }
>(
  "orders/updateOrderStatusWithConflictHandling",
  async ({ orderId, newStatus }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch<ApiResponse<OrderStatusUpdateResult>>(
        `/orders/${orderId}/status-with-conflicts`,
        { orderStatus: newStatus }
      );
      if (response.data.status !== "success" || !response.data.data) {
        return rejectWithValue(
          response.data.message || "Error al actualizar estado de orden"
        );
      }
      return response.data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Thunk para aplicar reembolso a una orden
export const applyRefund = createAsyncThunk<
  ApplyRefundResponse,
  ApplyRefundPayload,
  { rejectValue: string }
>(
  "orders/applyRefund",
  async ({ orderId, type, amount, reason }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post<ApiResponse<ApplyRefundResponse>>(
        `/orders/${orderId}/refund`,
        { type, amount, reason }
      );
      if (response.data.status !== "success" || !response.data.data) {
        return rejectWithValue(
          response.data.message || "Error al aplicar reembolso"
        );
      }
      return response.data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Thunk para verificar elegibilidad de reembolso
export const checkRefundEligibility = createAsyncThunk<
  RefundEligibilityResponse,
  string,
  { rejectValue: string }
>(
  "orders/checkRefundEligibility",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get<ApiResponse<RefundEligibilityResponse>>(
        `/orders/${orderId}/refund/eligibility`
      );
      if (response.data.status !== "success" || !response.data.data) {
        return rejectWithValue(
          response.data.message || "Error al verificar elegibilidad de reembolso"
        );
      }
      return response.data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Thunk para cancelar reembolso de una orden
export const cancelRefund = createAsyncThunk<
  CancelRefundResponse,
  string,
  { rejectValue: string }
>(
  "orders/cancelRefund",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete<ApiResponse<CancelRefundResponse>>(
        `/orders/${orderId}/refund`
      );
      if (response.data.status !== "success" || !response.data.data) {
        return rejectWithValue(
          response.data.message || "Error al cancelar reembolso"
        );
      }
      return response.data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Thunk para verificar elegibilidad de cancelación de reembolso
export const checkRefundCancelEligibility = createAsyncThunk<
  RefundCancelEligibilityResponse,
  string,
  { rejectValue: string }
>(
  "orders/checkRefundCancelEligibility",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get<ApiResponse<RefundCancelEligibilityResponse>>(
        `/orders/${orderId}/refund/cancel-eligibility`
      );
      if (response.data.status !== "success" || !response.data.data) {
        return rejectWithValue(
          response.data.message || "Error al verificar elegibilidad de cancelación de reembolso"
        );
      }
      return response.data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const orderSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    setStatusFilter(state, action: PayloadAction<OrderStatus | undefined>) {
      state.statusFilter = action.payload;
    },
    resetOrders(state) {
      state.orders = [];
      state.nextCursor = null;
      state.error = null;
      state.loading = false;
    },
    // Permite agregar la orden creada al principio del array
    addOrder(state, action: PayloadAction<Order>) {
      state.orders = [action.payload, ...state.orders];
    },
    // Limpiar información de stock
    clearStockAvailability(state) {
      state.stockAvailability = null;
      state.stockCheckError = null;
    },
    // Limpiar orderById guardada en el store
    clearOrderById(state) {
      state.orderById = null;
    },
    // Limpiar información de reembolso
    clearRefundState(state) {
      state.refundError = null;
      state.refundEligibility = null;
      state.cancelRefundError = null;
      state.refundCancelEligibility = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Si es paginación, concatenar; si no, reemplazar
        if (action.meta.arg?.cursor) {
          state.orders = [...state.orders, ...action.payload.orders];
        } else {
          state.orders = action.payload.orders;
        }
        state.nextCursor = action.payload.nextCursor;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Error al obtener órdenes";
      })
      .addCase(updateOrder.pending, (state) => {
        // No cambiar loading para evitar parpadeo en la UI
        state.error = null;
      })
      .addCase(updateOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Actualiza la orden en el array si existe
        const idx = state.orders.findIndex((o) => o.id === action.payload.id);
        if (idx !== -1) {
          state.orders[idx] = action.payload;
        }
        // También actualizar orderById si es la misma orden
        if (state.orderById && state.orderById.id === action.payload.id) {
          state.orderById = action.payload;
        }
      })
      .addCase(updateOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Error al actualizar la orden";
      })
      // updateItemPrices cases
      .addCase(updateItemPrices.pending, (state) => {
        state.error = null;
      })
      .addCase(updateItemPrices.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Actualiza la orden en el array si existe
        const idx = state.orders.findIndex((o) => o.id === action.payload.id);
        if (idx !== -1) {
          state.orders[idx] = action.payload;
        }
        // También actualizar orderById si es la misma orden
        if (state.orderById && state.orderById.id === action.payload.id) {
          state.orderById = action.payload;
        }
      })
      .addCase(updateItemPrices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Error al actualizar precios";
      })
      .addCase(createOrderAsAdmin.fulfilled, (state, action) => {
        // Agrega la orden creada al principio
        state.orders = [action.payload, ...state.orders];
        state.error = null;
        state.loading = false;
      })
      .addCase(createOrderAsAdmin.rejected, (state, action) => {
        state.error = action.payload || "Error al crear la orden";
        state.loading = false;
      })
      .addCase(createOrderAsAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.orderById = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.orderById = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Error al obtener la orden";
        state.orderById = null;
      })
      .addCase(bulkUpdateOrderStatus.pending, (state) => {
        state.bulkUpdateLoading = true;
        state.error = null;
      })
      .addCase(bulkUpdateOrderStatus.fulfilled, (state, action) => {
        state.bulkUpdateLoading = false;
        state.error = null;
        // Actualizar el estado de las órdenes que fueron exitosamente actualizadas
        const successfulIds = action.payload.successfulUpdates;
        const newStatus = action.meta.arg.newStatus;
        
        state.orders = state.orders.map(order => 
          successfulIds.includes(order.id) 
            ? { ...order, orderStatus: newStatus }
            : order
        );
        
        // También actualizar orderById si fue afectada
        if (state.orderById && successfulIds.includes(state.orderById.id)) {
          state.orderById = { ...state.orderById, orderStatus: newStatus };
        }
      })
      .addCase(bulkUpdateOrderStatus.rejected, (state, action) => {
        state.bulkUpdateLoading = false;
        state.error = action.payload || "Error en actualización masiva";
      })
      // checkOrderStockAvailability
      .addCase(checkOrderStockAvailability.pending, (state) => {
        state.stockCheckLoading = true;
        state.stockCheckError = null;
      })
      .addCase(checkOrderStockAvailability.fulfilled, (state, action) => {
        state.stockCheckLoading = false;
        state.stockCheckError = null;
        state.stockAvailability = action.payload;
      })
      .addCase(checkOrderStockAvailability.rejected, (state, action) => {
        state.stockCheckLoading = false;
        state.stockCheckError = action.payload || "Error al verificar stock";
        state.stockAvailability = null;
      })
      // updateOrderStatusWithConflictHandling
      .addCase(updateOrderStatusWithConflictHandling.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOrderStatusWithConflictHandling.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        
        // Si fue exitoso, actualizar la orden
        if (action.payload.success && action.payload.order) {
          const updatedOrder = action.payload.order;
          
          // Actualizar en la lista de órdenes
          const idx = state.orders.findIndex((o) => o.id === updatedOrder.id);
          if (idx !== -1) {
            state.orders[idx] = updatedOrder;
          }
          
          // También actualizar orderById si es la misma orden
          if (state.orderById && state.orderById.id === updatedOrder.id) {
            state.orderById = updatedOrder;
          }
        }
      })
      .addCase(updateOrderStatusWithConflictHandling.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Error al actualizar estado de orden";
      })
      // applyRefund cases
      .addCase(applyRefund.pending, (state) => {
        state.refundLoading = true;
        state.refundError = null;
      })
      .addCase(applyRefund.fulfilled, (state, action) => {
        state.refundLoading = false;
        state.refundError = null;
        
        // Si fue exitoso, actualizar la orden
        if (action.payload.success && action.payload.order) {
          const updatedOrder = action.payload.order;
          
          // Actualizar en la lista de órdenes
          const idx = state.orders.findIndex((o) => o.id === updatedOrder.id);
          if (idx !== -1) {
            state.orders[idx] = updatedOrder;
          }
          
          // También actualizar orderById si es la misma orden
          if (state.orderById && state.orderById.id === updatedOrder.id) {
            state.orderById = updatedOrder;
          }
        }
      })
      .addCase(applyRefund.rejected, (state, action) => {
        state.refundLoading = false;
        state.refundError = action.payload || "Error al aplicar reembolso";
      })
      // checkRefundEligibility cases
      .addCase(checkRefundEligibility.pending, (state) => {
        state.refundEligibilityLoading = true;
        state.refundError = null;
      })
      .addCase(checkRefundEligibility.fulfilled, (state, action) => {
        state.refundEligibilityLoading = false;
        state.refundError = null;
        state.refundEligibility = action.payload;
      })
      .addCase(checkRefundEligibility.rejected, (state, action) => {
        state.refundEligibilityLoading = false;
        state.refundError = action.payload || "Error al verificar elegibilidad de reembolso";
        state.refundEligibility = null;
      })
      // cancelRefund cases
      .addCase(cancelRefund.pending, (state) => {
        state.cancelRefundLoading = true;
        state.cancelRefundError = null;
      })
      .addCase(cancelRefund.fulfilled, (state, action) => {
        state.cancelRefundLoading = false;
        state.cancelRefundError = null;
        
        // Si fue exitoso, actualizar la orden
        if (action.payload.success && action.payload.order) {
          const updatedOrder = action.payload.order;
          
          // Actualizar en la lista de órdenes
          const idx = state.orders.findIndex((o) => o.id === updatedOrder.id);
          if (idx !== -1) {
            state.orders[idx] = updatedOrder;
          }
          
          // También actualizar orderById si es la misma orden
          if (state.orderById && state.orderById.id === updatedOrder.id) {
            state.orderById = updatedOrder;
          }
        }
      })
      .addCase(cancelRefund.rejected, (state, action) => {
        state.cancelRefundLoading = false;
        state.cancelRefundError = action.payload || "Error al cancelar reembolso";
      })
      // checkRefundCancelEligibility cases
      .addCase(checkRefundCancelEligibility.pending, (state) => {
        state.refundCancelEligibilityLoading = true;
        state.cancelRefundError = null;
      })
      .addCase(checkRefundCancelEligibility.fulfilled, (state, action) => {
        state.refundCancelEligibilityLoading = false;
        state.cancelRefundError = null;
        state.refundCancelEligibility = action.payload;
      })
      .addCase(checkRefundCancelEligibility.rejected, (state, action) => {
        state.refundCancelEligibilityLoading = false;
        state.cancelRefundError = action.payload || "Error al verificar elegibilidad de cancelación de reembolso";
        state.refundCancelEligibility = null;
      });
  },
});

export const { setStatusFilter, resetOrders, addOrder, clearStockAvailability, clearOrderById, clearRefundState } = orderSlice.actions;
export default orderSlice.reducer;
