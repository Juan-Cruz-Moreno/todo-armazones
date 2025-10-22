import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import {
  login,
  logout,
  register,
  fetchCurrentUser,
  resetAuthError,
  updateUser,
  fetchMostRecentAddress,
  updateDefaultAddress,
  resetAddressError,
} from "@/redux/slices/authSlice";
import { useCallback } from "react";
import { UpdateAddressPayload } from "@/interfaces/address";

export const useAuth = () => {
  const { user, loading, error, address, addressLoading, addressError } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  // Memoizar fetchCurrentUser para que sea estable
  const fetchCurrentUserCallback = useCallback(() => {
    return dispatch(fetchCurrentUser());
  }, [dispatch]);

  // Memoizar fetchMostRecentAddress
  const fetchMostRecentAddressCallback = useCallback(() => {
    return dispatch(fetchMostRecentAddress());
  }, [dispatch]);

  return {
    user,
    loading,
    error,
    address,
    addressLoading,
    addressError,
    login: (data: { email: string; password: string }) => dispatch(login(data)),
    register: (data: { email: string; password: string; confirmPassword: string }) =>
      dispatch(register(data)),
    logout: () => dispatch(logout()),
    fetchCurrentUser: fetchCurrentUserCallback,
    resetAuthError: () => dispatch(resetAuthError()),
    updateUser: (data: { email: string; displayName: string; firstName?: string; lastName?: string; dni?: string; cuit?: string; phone?: string }) =>
      dispatch(updateUser(data)),
    fetchMostRecentAddress: fetchMostRecentAddressCallback,
    updateDefaultAddress: (data: UpdateAddressPayload) => dispatch(updateDefaultAddress(data)),
    resetAddressError: () => dispatch(resetAddressError()),
  };
};
