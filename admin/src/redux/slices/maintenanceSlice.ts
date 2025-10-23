import { Maintenance, UpdateMaintenance } from "@/interfaces/maintenance";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import { ApiResponse, getErrorMessage } from "@/types/api";

interface MaintenanceState {
  maintenance: Maintenance | null;
  loading: boolean;
  error: string | null;
}

const initialState: MaintenanceState = {
  maintenance: null,
  loading: false,
  error: null,
};

export const fetchMaintenance = createAsyncThunk<Maintenance, void, { rejectValue: string }>(
  "maintenance/fetchMaintenance",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get<ApiResponse<Maintenance>>("/maintenance");
      return response.data.data as Maintenance;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const updateMaintenance = createAsyncThunk<Maintenance, UpdateMaintenance, { rejectValue: string }>(
  "maintenance/updateMaintenance",
  async (config, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put<ApiResponse<Maintenance>>("/maintenance", config);
      return response.data.data as Maintenance;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const maintenanceSlice = createSlice({
  name: "maintenance",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMaintenance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMaintenance.fulfilled, (state, action) => {
        state.loading = false;
        state.maintenance = action.payload;
      })
      .addCase(fetchMaintenance.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? action.error.message ?? "Failed to fetch maintenance.";
      })
      .addCase(updateMaintenance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMaintenance.fulfilled, (state, action) => {
        state.loading = false;
        state.maintenance = action.payload;
      })
      .addCase(updateMaintenance.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? action.error.message ?? "Failed to update maintenance.";
      });
  },
});

export default maintenanceSlice.reducer;