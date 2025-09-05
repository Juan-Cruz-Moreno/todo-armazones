import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance";
import type {
  StockMovementHistory,
  ProductVariantStockSummary,
  CreateStockEntryPayload,
  CreateStockExitPayload,
  StockMovementResponse,
} from "../../interfaces/inventory";
import type { ApiResponse } from "../../types/api";
import { getErrorMessage } from "../../types/api";

interface InventoryState {
  // Stock movements
  movements: StockMovementHistory | null;
  movementsLoading: boolean;
  movementsError: string | null;

  // Stock summary
  stockSummary: ProductVariantStockSummary[];
  summaryLoading: boolean;
  summaryError: string | null;

  // Operations
  operationLoading: boolean;
  operationError: string | null;
}

const initialState: InventoryState = {
  movements: null,
  movementsLoading: false,
  movementsError: null,
  stockSummary: [],
  summaryLoading: false,
  summaryError: null,
  operationLoading: false,
  operationError: null,
};

// Obtener historial de movimientos de stock
export const fetchStockMovements = createAsyncThunk<
  StockMovementHistory,
  { productVariantId: string; limit?: number; offset?: number }
>("inventory/fetchStockMovements", async (params, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams();
    if (params.limit) query.append("limit", params.limit.toString());
    if (params.offset) query.append("offset", params.offset.toString());

    const url = `/inventory/movements/${params.productVariantId}${
      query.toString() ? "?" + query.toString() : ""
    }`;
    
    const { data } = await axiosInstance.get<ApiResponse<StockMovementHistory>>(url);
    return data.data!;
  } catch (err: unknown) {
    return rejectWithValue(getErrorMessage(err));
  }
});

// Obtener resumen de stock de un producto
export const fetchProductStockSummary = createAsyncThunk<
  ProductVariantStockSummary[],
  string
>("inventory/fetchProductStockSummary", async (productId, { rejectWithValue }) => {
  try {
    const { data } = await axiosInstance.get<ApiResponse<ProductVariantStockSummary[]>>(
      `/inventory/summary/${productId}`
    );
    return data.data!;
  } catch (err: unknown) {
    return rejectWithValue(getErrorMessage(err));
  }
});

// Crear entrada de stock
export const createStockEntry = createAsyncThunk<
  StockMovementResponse,
  CreateStockEntryPayload
>("inventory/createStockEntry", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await axiosInstance.post<ApiResponse<StockMovementResponse>>(
      "/inventory/stock-entry",
      payload
    );
    return data.data!;
  } catch (err: unknown) {
    return rejectWithValue(getErrorMessage(err));
  }
});

// Crear salida de stock
export const createStockExit = createAsyncThunk<
  StockMovementResponse,
  CreateStockExitPayload
>("inventory/createStockExit", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await axiosInstance.post<ApiResponse<StockMovementResponse>>(
      "/inventory/stock-exit",
      payload
    );
    return data.data!;
  } catch (err: unknown) {
    return rejectWithValue(getErrorMessage(err));
  }
});

const inventorySlice = createSlice({
  name: "inventory",
  initialState,
  reducers: {
    clearMovements(state) {
      state.movements = null;
      state.movementsError = null;
    },
    clearSummary(state) {
      state.stockSummary = [];
      state.summaryError = null;
    },
    clearOperationError(state) {
      state.operationError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchStockMovements
      .addCase(fetchStockMovements.pending, (state) => {
        state.movementsLoading = true;
        state.movementsError = null;
      })
      .addCase(fetchStockMovements.fulfilled, (state, action) => {
        state.movementsLoading = false;
        state.movements = action.payload;
      })
      .addCase(fetchStockMovements.rejected, (state, action) => {
        state.movementsLoading = false;
        state.movementsError = action.payload as string;
      })

      // fetchProductStockSummary
      .addCase(fetchProductStockSummary.pending, (state) => {
        state.summaryLoading = true;
        state.summaryError = null;
      })
      .addCase(fetchProductStockSummary.fulfilled, (state, action) => {
        state.summaryLoading = false;
        state.stockSummary = action.payload;
      })
      .addCase(fetchProductStockSummary.rejected, (state, action) => {
        state.summaryLoading = false;
        state.summaryError = action.payload as string;
      })

      // createStockEntry
      .addCase(createStockEntry.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
      })
      .addCase(createStockEntry.fulfilled, (state) => {
        state.operationLoading = false;
        // Refrescar movimientos y resumen después de crear entrada
      })
      .addCase(createStockEntry.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload as string;
      })

      // createStockExit
      .addCase(createStockExit.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
      })
      .addCase(createStockExit.fulfilled, (state) => {
        state.operationLoading = false;
        // Refrescar movimientos y resumen después de crear salida
      })
      .addCase(createStockExit.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload as string;
      });
  },
});

export const { clearMovements, clearSummary, clearOperationError } = inventorySlice.actions;
export default inventorySlice.reducer;
