import { Dollar } from "@/interfaces/dollar";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import { ApiResponse, getErrorMessage } from "@/types/api";

interface DollarState {
  dollar: Dollar | null;
  loading: boolean;
  error: string | null;
}

const initialState: DollarState = {
  dollar: null,
  loading: false,
  error: null,
};

export const fetchDollar = createAsyncThunk<Dollar, void, { rejectValue: string }>(
  "dollar/fetchDollar",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get<ApiResponse<Dollar>>("/dollar");
      return response.data.data as Dollar;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const dollarSlice = createSlice({
  name: "dollar",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDollar.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDollar.fulfilled, (state, action) => {
        state.loading = false;
        state.dollar = action.payload;
      })
      .addCase(fetchDollar.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? action.error.message ?? "Failed to fetch dollar.";
      });
  },
});

export default dollarSlice.reducer;