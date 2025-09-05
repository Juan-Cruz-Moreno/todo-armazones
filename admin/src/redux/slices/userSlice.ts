import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import { ApiResponse, getErrorMessage } from "@/types/api";
import { IGetUsersPaginatedResponse, IUser } from "@/interfaces/user";

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
}

const initialState: UserState = {
  users: [],
  nextCursor: null,
  loading: false,
  error: null,
  userByEmail: null,
  loadingUserByEmail: false,
  errorUserByEmail: null,
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
}

// Crear usuario por admin
export const createUserByAdmin = createAsyncThunk<
  IUser,
  CreateUserByAdminPayload,
  { rejectValue: string }
>("users/createUserByAdmin", async (payload, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post<
      ApiResponse<{ user: IUser }>
    >("/auth/create-user-admin", payload);
    if (res.data.status !== "success" || !res.data.data?.user) {
      return rejectWithValue(
        res.data.message || "No se pudo crear el usuario"
      );
    }
    return res.data.data.user;
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
      });
  },
});

export const { resetUsers } = userSlice.actions;
export default userSlice.reducer;
