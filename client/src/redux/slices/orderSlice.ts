import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  CreateOrderPayload,
  Order,
  OrdersResponse,
} from "@/interfaces/order";
import { RootState } from "../store";
import axiosInstance from "@/utils/axiosInstance";
import { authRequiredRequest } from "@/utils/authRequiredRequest";
import { getErrorMessage, ApiResponse, isApiError } from "@/types/api";
import { OrderStatus } from "@/enums/order.enum";
import { IUser } from "@/interfaces/user";

// Tipos para error de sincronización de carrito
export interface CartSyncChange {
  productVariant: {
    _id: string;
    product: {
      _id: string;
      slug: string;
      thumbnail: string;
      primaryImage: string;
      category: string[];
      subcategory: string;
      productModel: string;
      sku: string;
      size: string;
      costUSD: number;
      priceUSD: number;
      createdAt: string;
      updatedAt: string;
    };
    color: { name: string; hex: string };
    stock: number;
    thumbnail: string;
    images: string[];
    __v: number;
    createdAt: string;
    updatedAt: string;
  };
  oldQuantity: number;
  newQuantity: number;
  removed: boolean;
  stock: number;
}

export interface CartSyncError {
  message: string;
  changes: CartSyncChange[];
  cart: import("@/interfaces/cart").Cart;
}

// Thunk para crear una orden
export const createOrder = createAsyncThunk<
  Order,
  CreateOrderPayload,
  { rejectValue: string | CartSyncError }
>("orders/createOrder", async (payload, thunkAPI) => {
  try {
    const res = await axiosInstance.post<ApiResponse<Order>>(
      "/orders",
      payload
    );
    if (res.data.status === "success" && res.data.data) {
      return res.data.data;
    } else {
      throw new Error(res.data.message || "Error al crear la orden.");
    }
  } catch (error: unknown) {
    // Usar los helpers de api.ts para verificar si es un error de API
    if (isApiError(error) && error.response?.status === 409) {
      // Error 409 es el código para CartSyncError
      const data = error.response.data;
      
      // Verificar que tiene la estructura esperada del CartSyncError
      if (
        'changes' in data &&
        'cart' in data &&
        'message' in data &&
        Array.isArray(data.changes) &&
        typeof data.cart === "object" && 
        data.cart !== null &&
        typeof data.message === "string"
      ) {
        return thunkAPI.rejectWithValue({
          message: data.message,
          changes: data.changes as CartSyncChange[],
          cart: data.cart as import("@/interfaces/cart").Cart,
        });
      }
    }
    
    // Para cualquier otro error, usar el helper
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

// Thunk para obtener todas las órdenes con paginación y filtro
export const fetchOrders = createAsyncThunk<
  OrdersResponse,
  { status?: OrderStatus; cursor?: string; limit?: number } | undefined,
  { rejectValue: string }
>("orders/fetchOrders", async (params, thunkAPI) => {
  try {
    let url = "/orders";
    const query: string[] = [];
    if (params?.status) query.push(`status=${params.status}`);
    if (params?.cursor) query.push(`cursor=${params.cursor}`);
    if (params?.limit) query.push(`limit=${params.limit}`);
    if (query.length) url += `?${query.join("&")}`;
    const state = thunkAPI.getState() as { auth: { user: IUser | null } };
    const user = state.auth.user;
    const res = await authRequiredRequest<ApiResponse<OrdersResponse>>({
      method: "GET",
      url,
    }, user);
    if (res.status === "success" && res.data) {
      return res.data;
    } else {
      throw new Error(res.message || "Error al obtener las órdenes.");
    }
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getErrorMessage(error));
  }
});

interface OrdersState {
  orders: Order[];
  nextCursor: string | null;
  loading: boolean;
  error: string | null | CartSyncError;
  statusFilter?: OrderStatus;
}

const initialState: OrdersState = {
  orders: [],
  nextCursor: null,
  loading: false,
  error: null,
  statusFilter: undefined,
};

const orderSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    clearOrderError(state) {
      state.error = null;
    },
    setStatusFilter(state, action: PayloadAction<OrderStatus | undefined>) {
      state.statusFilter = action.payload;
    },
    resetOrders(state) {
      state.orders = [];
      state.nextCursor = null;
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // createOrder
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action: PayloadAction<Order>) => {
        state.loading = false;
        state.orders.unshift(action.payload);
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "No se pudo crear la orden.";
      })

      // fetchOrders
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
        state.error = action.payload || "No se pudieron obtener las órdenes.";
      });
  },
});

export const { clearOrderError, setStatusFilter, resetOrders } =
  orderSlice.actions;

export const selectOrders = (state: RootState) => state.orders.orders;
export const selectOrdersLoading = (state: RootState) => state.orders.loading;
export const selectOrdersError = (state: RootState) => state.orders.error;
export const selectOrdersNextCursor = (state: RootState) =>
  state.orders.nextCursor;
export const selectOrdersStatusFilter = (state: RootState) =>
  state.orders.statusFilter;

export default orderSlice.reducer;
