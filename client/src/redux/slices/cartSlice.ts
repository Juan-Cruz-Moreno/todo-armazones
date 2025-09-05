import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  Cart,
  AddItemToCartPayload,
  UpdateCartItemPayload,
} from "@/interfaces/cart";
import { ApiResponse, getErrorMessage } from "@/types/api";
import { authRequiredRequest, AuthRequiredError } from "@/utils/authRequiredRequest";
import { IUser } from "@/interfaces/user";
import { cartEvents } from "@/utils/eventBus";
import { setPendingAction } from "./pendingActionSlice";
import { authEvents } from "@/utils/eventBus";

// Estado del slice
interface CartState {
  cart: Cart | null;
  // Estados de loading individuales
  loading: {
    getCart: boolean;
    addItem: { [productVariantId: string]: boolean };
    incrementItem: { [productVariantId: string]: boolean };
    decrementItem: { [productVariantId: string]: boolean };
    removeItem: { [productVariantId: string]: boolean };
  };
  // Estados de error individuales
  error: {
    getCart: string | null;
    addItem: { [productVariantId: string]: string | null };
    incrementItem: { [productVariantId: string]: string | null };
    decrementItem: { [productVariantId: string]: string | null };
    removeItem: { [productVariantId: string]: string | null };
  };
}

// Estado inicial
const initialState: CartState = {
  cart: null,
  loading: {
    getCart: false,
    addItem: {},
    incrementItem: {},
    decrementItem: {},
    removeItem: {},
  },
  error: {
    getCart: null,
    addItem: {},
    incrementItem: {},
    decrementItem: {},
    removeItem: {},
  },
};

// Async thunks
export const getCart = createAsyncThunk(
  "cart/getCart",
  async (_, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as { auth: { user: IUser | null } };
      const user = state.auth.user;
      const response = await authRequiredRequest<ApiResponse<Cart>>(
        {
          method: "GET",
          url: "/cart",
        },
        user
      );
      return response.data!;
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const addItemToCart = createAsyncThunk(
  "cart/addItemToCart",
  async (payload: AddItemToCartPayload, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as { auth: { user: IUser | null } };
      const user = state.auth.user;
      const response = await authRequiredRequest<ApiResponse<Cart>>(
        {
          method: "POST",
          url: "/cart/add-item",
          data: payload,
        },
        user
      );
      return response.data!;
    } catch (error: unknown) {
      if (error instanceof AuthRequiredError) {
        thunkAPI.dispatch(setPendingAction({ type: "addItemToCart", payload }));
        authEvents.openAccountDrawer();
        return thunkAPI.rejectWithValue("Usuario no autenticado");
      }
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const incrementItemInCart = createAsyncThunk(
  "cart/incrementItemInCart",
  async (payload: UpdateCartItemPayload, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as { auth: { user: IUser | null } };
      const user = state.auth.user;
      const response = await authRequiredRequest<ApiResponse<Cart>>(
        {
          method: "PATCH",
          url: "/cart/increment-item",
          data: payload,
        },
        user
      );
      return response.data!;
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const decrementItemInCart = createAsyncThunk(
  "cart/decrementItemInCart",
  async (payload: UpdateCartItemPayload, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as { auth: { user: IUser | null } };
      const user = state.auth.user;
      const response = await authRequiredRequest<ApiResponse<Cart>>(
        {
          method: "PATCH",
          url: "/cart/decrement-item",
          data: payload,
        },
        user
      );
      return response.data!;
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

export const removeItemFromCart = createAsyncThunk(
  "cart/removeItemFromCart",
  async (payload: UpdateCartItemPayload, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as { auth: { user: IUser | null } };
      const user = state.auth.user;
      const response = await authRequiredRequest<ApiResponse<Cart>>(
        {
          method: "POST",
          url: "/cart/remove-item",
          data: payload,
        },
        user
      );
      return response.data!;
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

// Slice
const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // Limpiar errores específicos
    clearError: (state, action: PayloadAction<keyof CartState["error"]>) => {
      if (
        action.payload === "addItem" ||
        action.payload === "incrementItem" ||
        action.payload === "decrementItem" ||
        action.payload === "removeItem"
      ) {
        state.error[action.payload] = {};
      } else {
        state.error[action.payload] = null;
      }
    },
    // Limpiar todos los errores
    clearAllErrors: (state) => {
      state.error = {
        getCart: null,
        addItem: {},
        incrementItem: {},
        decrementItem: {},
        removeItem: {},
      };
    },
    // Limpiar carrito (para logout)
    clearCart: (state) => {
      state.cart = null;
      state.loading = {
        getCart: false,
        addItem: {},
        incrementItem: {},
        decrementItem: {},
        removeItem: {},
      };
      state.error = {
        getCart: null,
        addItem: {},
        incrementItem: {},
        decrementItem: {},
        removeItem: {},
      };
    },
  },
  extraReducers: (builder) => {
    // Get Cart
    builder
      .addCase(getCart.pending, (state) => {
        state.loading.getCart = true;
        state.error.getCart = null;
      })
      .addCase(getCart.fulfilled, (state, action) => {
        state.loading.getCart = false;
        state.cart = action.payload;
      })
      .addCase(getCart.rejected, (state, action) => {
        state.loading.getCart = false;
        state.error.getCart = action.payload as string;
      })

      // Add Item to Cart
      .addCase(addItemToCart.pending, (state, action) => {
        const id = action.meta.arg.productVariantId;
        state.loading.addItem[id] = true;
        state.error.addItem[id] = null;
      })
      .addCase(addItemToCart.fulfilled, (state, action) => {
        state.loading.addItem = {};
        state.error.addItem = {};
        state.cart = action.payload;
        // Abrir el CartDrawer solo después de que el carrito se haya actualizado correctamente
        if (typeof window !== "undefined") {
          cartEvents.openCartDrawer();
        }
      })
      .addCase(addItemToCart.rejected, (state, action) => {
        const id = action.meta.arg.productVariantId;
        state.loading.addItem[id] = false;
        state.error.addItem[id] = action.payload as string;
      })

      // Increment Item in Cart
      .addCase(incrementItemInCart.pending, (state, action) => {
        const id = action.meta.arg.productVariantId;
        state.loading.incrementItem[id] = true;
        state.error.incrementItem[id] = null;
      })
      .addCase(incrementItemInCart.fulfilled, (state, action) => {
        // Limpiar todos los loading y error de incrementItem
        state.loading.incrementItem = {};
        state.error.incrementItem = {};
        state.cart = action.payload;
      })
      .addCase(incrementItemInCart.rejected, (state, action) => {
        const id = action.meta.arg.productVariantId;
        state.loading.incrementItem[id] = false;
        state.error.incrementItem[id] = action.payload as string;
      })

      // Decrement Item in Cart
      .addCase(decrementItemInCart.pending, (state, action) => {
        const id = action.meta.arg.productVariantId;
        state.loading.decrementItem[id] = true;
        state.error.decrementItem[id] = null;
      })
      .addCase(decrementItemInCart.fulfilled, (state, action) => {
        state.loading.decrementItem = {};
        state.error.decrementItem = {};
        state.cart = action.payload;
      })
      .addCase(decrementItemInCart.rejected, (state, action) => {
        const id = action.meta.arg.productVariantId;
        state.loading.decrementItem[id] = false;
        state.error.decrementItem[id] = action.payload as string;
      })

      // Remove Item from Cart
      .addCase(removeItemFromCart.pending, (state, action) => {
        const id = action.meta.arg.productVariantId;
        state.loading.removeItem[id] = true;
        state.error.removeItem[id] = null;
      })
      .addCase(removeItemFromCart.fulfilled, (state, action) => {
        state.loading.removeItem = {};
        state.error.removeItem = {};
        state.cart = action.payload;
      })
      .addCase(removeItemFromCart.rejected, (state, action) => {
        const id = action.meta.arg.productVariantId;
        state.loading.removeItem[id] = false;
        state.error.removeItem[id] = action.payload as string;
      });
  },
});

export const { clearError, clearAllErrors, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
