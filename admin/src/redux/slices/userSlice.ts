import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import { ApiResponse, getErrorMessage } from "@/types/api";
import { IGetUsersPaginatedResponse, IUser } from "@/interfaces/user";
import { IAddress } from "@/interfaces/address";

// Interfaz temporal para manejar la respuesta del backend que puede tener _id o id
interface IUserWithPossibleId extends Omit<IUser, 'id'> {
  id?: string;
  _id?: string;
}


interface UserState {
  users: IUser[];
  nextCursor: string | null;
  loading: boolean;
  error: string | null;
  userByEmail: IUser | null;
  loadingUserByEmail: boolean;
  errorUserByEmail: string | null;
  // Nuevos campos para búsqueda
  searchResults: IUser[];
  searchNextCursor: string | null;
  searchLoading: boolean;
  searchError: string | null;
  // Campos para actualización de usuario por admin
  updatingUser: boolean;
  updateUserError: string | null;
  // Campos para dirección más reciente
  recentAddress: IAddress | null;
  loadingRecentAddress: boolean;
  errorRecentAddress: string | null;
  // Campos para actualización de dirección
  updatingAddress: boolean;
  updateAddressError: string | null;
}

const initialState: UserState = {
  users: [],
  nextCursor: null,
  loading: false,
  error: null,
  userByEmail: null,
  loadingUserByEmail: false,
  errorUserByEmail: null,
  // Inicializar nuevos campos para búsqueda
  searchResults: [],
  searchNextCursor: null,
  searchLoading: false,
  searchError: null,
  // Inicializar campos para actualización
  updatingUser: false,
  updateUserError: null,
  // Inicializar campos para dirección reciente
  recentAddress: null,
  loadingRecentAddress: false,
  errorRecentAddress: null,
  // Inicializar campos para actualización de dirección
  updatingAddress: false,
  updateAddressError: null,
};

export const fetchUsers = createAsyncThunk<
  IGetUsersPaginatedResponse,
  { limit?: number; cursor?: string },
  { rejectValue: string }
>("users/fetchUsers", async ({ limit = 10, cursor }, { rejectWithValue }) => {
  try {
    const params: { limit: number; cursor?: string } = { limit };
    if (cursor) params.cursor = cursor;
    const res = await axiosInstance.get<
      ApiResponse<IGetUsersPaginatedResponse>
    >("/users", { params });
    if (res.data.status !== "success" || !res.data.data) {
      return rejectWithValue(res.data.message || "Error al obtener usuarios");
    }
    return res.data.data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

export const fetchUserByEmail = createAsyncThunk<
  IUser,
  string,
  { rejectValue: string }
>("users/fetchUserByEmail", async (email, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get<ApiResponse<IUser>>("/users/by-email", {
      params: { email },
    });
    if (res.data.status !== "success" || !res.data.data) {
      return rejectWithValue(res.data.message || "No se encontró el usuario");
    }
    return res.data.data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

// Nuevo thunk para búsqueda flexible de usuarios
export const searchUsers = createAsyncThunk<
  IGetUsersPaginatedResponse,
  { query: string; fields?: string; limit?: number; cursor?: string },
  { rejectValue: string }
>("users/searchUsers", async ({ query, fields, limit = 10, cursor }, { rejectWithValue }) => {
  try {
    const params: { query: string; fields?: string; limit: number; cursor?: string } = { query, limit };
    if (fields) params.fields = fields;
    if (cursor) params.cursor = cursor;
    const res = await axiosInstance.get<
      ApiResponse<IGetUsersPaginatedResponse>
    >("/users/search", { params });
    if (res.data.status !== "success" || !res.data.data) {
      return rejectWithValue(res.data.message || "Error al buscar usuarios");
    }
    return res.data.data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

// Payload para crear usuario por admin
export interface CreateUserByAdminPayload {
  email: string;
  password: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  dni?: string;
  cuit?: string;
  phone?: string;
  address?: {
    firstName?: string;
    lastName?: string;
    companyName?: string;
    email?: string;
    phoneNumber?: string;
    dni?: string;
    cuit?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    shippingCompany?: string;
    declaredShippingAmount?: string;
    deliveryWindow?: string;
    deliveryType?: string;
    pickupPointAddress?: string;
  };
}

// Payload para actualizar usuario por admin
export interface UpdateUserByAdminPayload {
  userId: string;
  email?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  dni?: string;
  cuit?: string;
  phone?: string;
  password?: string;
  role?: string;
  status?: string;
}

// Crear usuario por admin
export const createUserByAdmin = createAsyncThunk<
  { user: IUser; address?: IAddress },
  CreateUserByAdminPayload,
  { rejectValue: string }
>("users/createUserByAdmin", async (payload, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post<
      ApiResponse<{ user: IUser; address?: IAddress } | IUser>
    >("/auth/create-user-admin", payload);
    if (res.data.status !== "success" || !res.data.data) {
      return rejectWithValue(
        res.data.message || "Error al crear usuario"
      );
    }
    
    // Manejar respuesta que puede venir en dos formatos:
    // 1. { user: IUser } (formato anterior)
    // 2. { user: IUser, address?: IAddress } (nuevo formato)
    // 3. IUser directamente (formato legacy)
    const data = res.data.data;
    if ('user' in data && typeof data === 'object') {
      // Formato con { user, address }
      return data as { user: IUser; address?: IAddress };
    } else {
      // Formato legacy: IUser directamente
      return { user: data as IUser };
    }
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

// Actualizar usuario por admin
export const updateUserAsAdmin = createAsyncThunk<
  IUser,
  UpdateUserByAdminPayload,
  { rejectValue: string }
>("users/updateUserAsAdmin", async ({ userId, ...updateData }, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.patch<
      ApiResponse<IUser>
    >(`/users/${userId}`, updateData);
    if (res.data.status !== "success" || !res.data.data) {
      return rejectWithValue(
        res.data.message || "No se pudo actualizar el usuario"
      );
    }
    return res.data.data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

// Obtener dirección más reciente de un usuario
export const fetchMostRecentAddress = createAsyncThunk<
  IAddress,
  string,
  { rejectValue: string }
>("users/fetchMostRecentAddress", async (userId, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get<ApiResponse<IAddress>>(
      `/users/${userId}/address/recent`
    );
    if (res.data.status !== "success" || !res.data.data) {
      return rejectWithValue(
        res.data.message || "No se encontró ninguna dirección"
      );
    }
    return res.data.data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

// Payload para actualizar dirección por defecto
export interface UpdateDefaultAddressPayload {
  userId: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phoneNumber?: string;
  dni?: string;
  cuit?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  shippingCompany?: string;
  declaredShippingAmount?: string;
  deliveryWindow?: string;
  deliveryType?: string;
  pickupPointAddress?: string;
  isDefault?: boolean;
}

// Actualizar dirección por defecto de un usuario
export const updateDefaultAddress = createAsyncThunk<
  IAddress,
  UpdateDefaultAddressPayload,
  { rejectValue: string }
>("users/updateDefaultAddress", async ({ userId, ...updateData }, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.patch<ApiResponse<IAddress>>(
      `/users/${userId}/address/default`,
      updateData
    );
    if (res.data.status !== "success" || !res.data.data) {
      return rejectWithValue(
        res.data.message || "No se pudo actualizar la dirección"
      );
    }
    return res.data.data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    resetUsers: (state) => {
      state.users = [];
      state.nextCursor = null;
      state.error = null;
      state.loading = false;
      state.userByEmail = null;
      state.loadingUserByEmail = false;
      state.errorUserByEmail = null;
    },
    resetSearch: (state) => {
      state.searchResults = [];
      state.searchNextCursor = null;
      state.searchError = null;
      state.searchLoading = false;
    },
    resetUpdateUser: (state) => {
      state.updatingUser = false;
      state.updateUserError = null;
    },
    resetRecentAddress: (state) => {
      state.recentAddress = null;
      state.loadingRecentAddress = false;
      state.errorRecentAddress = null;
    },
    resetUpdateAddress: (state) => {
      state.updatingAddress = false;
      state.updateAddressError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Si es la primera página (sin cursor), reemplaza. Si no, acumula.
        if (action.meta.arg && action.meta.arg.cursor) {
          state.users = [...state.users, ...action.payload.users];
        } else {
          state.users = action.payload.users;
        }
        state.nextCursor = action.payload.nextCursor;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Error al obtener usuarios";
      })
      // fetchUserByEmail
      .addCase(fetchUserByEmail.pending, (state) => {
        state.loadingUserByEmail = true;
        state.errorUserByEmail = null;
        state.userByEmail = null;
      })
      .addCase(fetchUserByEmail.fulfilled, (state, action) => {
        state.loadingUserByEmail = false;
        state.errorUserByEmail = null;
        // Mapear _id a id si es necesario
        const user = action.payload as IUserWithPossibleId;
        if (user && user._id && !user.id) {
          const mappedUser: IUser = {
            ...user,
            id: user._id,
          };
          state.userByEmail = mappedUser;
        } else {
          state.userByEmail = user as IUser;
        }
      })
      .addCase(fetchUserByEmail.rejected, (state, action) => {
        state.loadingUserByEmail = false;
        state.errorUserByEmail = action.payload || "No se encontró el usuario";
        state.userByEmail = null;
      })
      // createUserByAdmin
      .addCase(createUserByAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUserByAdmin.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
        // No modificamos la lista local; la UI recargará desde el backend
      })
      .addCase(createUserByAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "No se pudo crear el usuario";
      })
      // searchUsers
      .addCase(searchUsers.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchError = null;
        // Si es la primera página (sin cursor), reemplaza. Si no, acumula.
        if (action.meta.arg && action.meta.arg.cursor) {
          state.searchResults = [...state.searchResults, ...action.payload.users];
        } else {
          state.searchResults = action.payload.users;
        }
        state.searchNextCursor = action.payload.nextCursor;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.payload || "Error al buscar usuarios";
      })
      // updateUserAsAdmin
      .addCase(updateUserAsAdmin.pending, (state) => {
        state.updatingUser = true;
        state.updateUserError = null;
      })
      .addCase(updateUserAsAdmin.fulfilled, (state, action) => {
        state.updatingUser = false;
        state.updateUserError = null;
        // Actualizar el usuario en la lista principal si existe
        const updatedUser = action.payload;
        const userIndex = state.users.findIndex(user => user.id === updatedUser.id);
        if (userIndex !== -1) {
          state.users[userIndex] = updatedUser;
        }
        // Actualizar en resultados de búsqueda si existe
        const searchIndex = state.searchResults.findIndex(user => user.id === updatedUser.id);
        if (searchIndex !== -1) {
          state.searchResults[searchIndex] = updatedUser;
        }
        // Actualizar userByEmail si es el mismo usuario
        if (state.userByEmail && state.userByEmail.id === updatedUser.id) {
          state.userByEmail = updatedUser;
        }
      })
      .addCase(updateUserAsAdmin.rejected, (state, action) => {
        state.updatingUser = false;
        state.updateUserError = action.payload || "No se pudo actualizar el usuario";
      })
      // fetchMostRecentAddress
      .addCase(fetchMostRecentAddress.pending, (state) => {
        state.loadingRecentAddress = true;
        state.errorRecentAddress = null;
        state.recentAddress = null;
      })
      .addCase(fetchMostRecentAddress.fulfilled, (state, action) => {
        state.loadingRecentAddress = false;
        state.errorRecentAddress = null;
        state.recentAddress = action.payload;
      })
      .addCase(fetchMostRecentAddress.rejected, (state, action) => {
        state.loadingRecentAddress = false;
        state.errorRecentAddress = action.payload || "No se pudo obtener la dirección";
        state.recentAddress = null;
      })
      // updateDefaultAddress
      .addCase(updateDefaultAddress.pending, (state) => {
        state.updatingAddress = true;
        state.updateAddressError = null;
      })
      .addCase(updateDefaultAddress.fulfilled, (state, action) => {
        state.updatingAddress = false;
        state.updateAddressError = null;
        // Actualizar la dirección reciente con los nuevos datos
        state.recentAddress = action.payload;
      })
      .addCase(updateDefaultAddress.rejected, (state, action) => {
        state.updatingAddress = false;
        state.updateAddressError = action.payload || "No se pudo actualizar la dirección";
      });
  },
});

export const { resetUsers, resetSearch, resetUpdateUser, resetRecentAddress, resetUpdateAddress } = userSlice.actions;
export default userSlice.reducer;
