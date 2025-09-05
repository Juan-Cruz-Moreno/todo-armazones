import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AddItemToCartPayload } from "@/interfaces/cart";

export type PendingActionData =
  | { type: "addItemToCart"; payload: AddItemToCartPayload };
  // Agrega aquí otros tipos de acciones protegidas si las tienes

interface PendingActionState {
  action: PendingActionData | null;
}

const initialState: PendingActionState = {
  action: null,
};

const pendingActionSlice = createSlice({
  name: "pendingAction",
  initialState,
  reducers: {
    setPendingAction: (state, action: PayloadAction<PendingActionData>) => {
      state.action = action.payload;
    },
    clearPendingAction: (state) => {
      state.action = null;
    },
  },
});

export const { setPendingAction, clearPendingAction } = pendingActionSlice.actions;
export default pendingActionSlice.reducer;
