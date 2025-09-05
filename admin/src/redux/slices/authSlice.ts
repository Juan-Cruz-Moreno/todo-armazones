import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import { ApiResponse, getErrorMessage } from "@/types/api";
import { LoginPayload } from "@/interfaces/auth";
import { AuthResponse, AdminCheckResponse } from "@/interfaces/auth";
import { IUser } from "@/interfaces/user";

interface AuthState {
  user: IUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  sessionChecked: boolean; // Nuevo flag
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  isAdmin: false,
  sessionChecked: false, // Inicialmente no se ha chequeado
};

// Login thunk
export const login = createAsyncThunk<
  IUser,
  LoginPayload,
  { rejectValue: string }
>("auth/login", async (payload, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post<ApiResponse<AuthResponse>>(
      "/auth/login-admin",
      payload
    );
    if (res.data.status !== "success" || !res.data.data?.user) {
      return rejectWithValue(res.data.message || "Login failed");
    }
    return res.data.data.user;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

//Check session thunk
export const checkSession = createAsyncThunk<
  AdminCheckResponse,
  void,
  { rejectValue: string }
>("auth/checkSession", async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get<ApiResponse<AdminCheckResponse>>(
      "/auth/me-admin"
    );
    if (res.data.status === "success" && res.data.data) {
      return res.data.data;
    }
    return {
      user: null,
      authenticated: false,
      isAdmin: false,
    };
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

// Logout thunk
export const logoutAsync = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>("auth/logout", async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post<ApiResponse>("/auth/logout");
    if (res.data.status !== "success") {
      return rejectWithValue(res.data.message || "Logout failed");
    }
    return;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isAdmin = true;
        state.sessionChecked = true; // Login exitoso, sesión chequeada
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Login failed";
        state.isAuthenticated = false;
        state.isAdmin = false;
        state.sessionChecked = true; // Login intentado, sesión chequeada
      })
      // Check session
      .addCase(checkSession.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.sessionChecked = false; // Comienza chequeo
      })
      .addCase(checkSession.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = action.payload.authenticated;
        state.isAdmin = action.payload.isAdmin;
        state.sessionChecked = true; // Chequeo terminado
      })
      .addCase(checkSession.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.isAdmin = false;
        state.error = action.payload || "Error al verificar sesión";
        state.sessionChecked = true; // Chequeo terminado aunque haya error
      })
      // Logout
      .addCase(logoutAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutAsync.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.isAdmin = false;
        state.sessionChecked = true; // Después de logout, sesión chequeada
      })
      .addCase(logoutAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Logout failed";
      });
  },
});

export default authSlice.reducer;
