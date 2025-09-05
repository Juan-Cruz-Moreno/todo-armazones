import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { IUser } from "@/interfaces/user";
import { AuthResponse, CurrentUserResponse } from "@/interfaces/auth";
import { ApiResponse, getErrorMessage } from "@/types/api";
import axiosInstance from "@/utils/axiosInstance";
import { clearPendingAction } from "./pendingActionSlice";
import { RootState } from "@/redux/store";
import { addItemToCart } from "./cartSlice";
import { authEvents } from "@/utils/eventBus";

interface AuthState {
  user: IUser | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
};

// 🔐 Login
export const login = createAsyncThunk<
  IUser,
  { email: string; password: string },
  { rejectValue: string }
>(
  "auth/login",
  async (credentials, { rejectWithValue, dispatch, getState }) => {
    try {
      const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
        "/auth/login",
        credentials
      );
      if (!response.data.data || !response.data.data.user) {
        return rejectWithValue("Respuesta inválida del servidor");
      }
      // Ejecutar acción pendiente si existe
      const state = getState() as RootState;
      const pending = state.pendingAction.action;
      if (pending) {
        if (pending.type === "addItemToCart") {
          dispatch(addItemToCart(pending.payload));
          authEvents.closeAccountDrawer();
        }
        // Aquí puedes agregar más tipos de acciones protegidas
      }
      dispatch(clearPendingAction());
      return response.data.data.user;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// 📝 Registro
export const register = createAsyncThunk<
  IUser,
  { email: string; password: string; confirmPassword: string },
  { rejectValue: string }
>("auth/register", async (data, { rejectWithValue, dispatch, getState }) => {
  try {
    const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
      "/auth/register",
      data
    );
    if (!response.data.data || !response.data.data.user) {
      return rejectWithValue("Respuesta inválida del servidor");
    }
    // Ejecutar acción pendiente si existe
    const state = getState() as RootState;
    const pending = state.pendingAction.action;
    if (pending) {
      if (pending.type === "addItemToCart") {
        dispatch(addItemToCart(pending.payload));
        authEvents.closeAccountDrawer();
      }
      // Aquí puedes agregar más tipos de acciones protegidas
    }
    dispatch(clearPendingAction());
    return response.data.data.user;
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error));
  }
});

// 👤 Obtener usuario actual
export const fetchCurrentUser = createAsyncThunk<
  IUser | null,
  void,
  { rejectValue: string }
>("auth/fetchCurrentUser", async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get<ApiResponse<CurrentUserResponse>>(
      "/auth/me"
    );
    if (!response.data.data) {
      return rejectWithValue("Respuesta inválida del servidor");
    }

    const { user, authenticated } = response.data.data;

    // Si no está autenticado, retornamos null (no es un error)
    if (!authenticated || !user) {
      return null;
    }

    return user;
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error));
  }
});

// 🚪 Logout
export const logout = createAsyncThunk<void, void, { rejectValue: string }>(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await axiosInstance.post("/auth/logout");
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// 📝 Actualizar perfil
const updateUser = createAsyncThunk<
  IUser,
  { email: string; displayName: string; firstName?: string; lastName?: string },
  { rejectValue: string }
>(
  "auth/updateUser",
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch<ApiResponse<IUser>>(
        "/users/me",
        data
      );
      if (!response.data.data) {
        return rejectWithValue("Respuesta inválida del servidor");
      }
      return response.data.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    resetAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<IUser>) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Error inesperado";
      })

      // Registro
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action: PayloadAction<IUser>) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Error inesperado";
      })

      // Obtener usuario actual
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchCurrentUser.fulfilled,
        (state, action: PayloadAction<IUser | null>) => {
          state.loading = false;
          state.user = action.payload;
        }
      )
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.error = action.payload || "Error al verificar autenticación";
      })

      // Actualizar perfil
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action: PayloadAction<IUser>) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Error al actualizar perfil";
      })

      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
      });
  },
});

export const { resetAuthError } = authSlice.actions;
export { updateUser };
export default authSlice.reducer;
