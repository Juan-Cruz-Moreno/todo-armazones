import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import {
  login,
  logout,
  register,
  fetchCurrentUser,
  resetAuthError,
  updateUser,
} from "@/redux/slices/authSlice";
import { useCallback } from "react";

export const useAuth = () => {
  const { user, loading, error } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  // Memoizar fetchCurrentUser para que sea estable
  const fetchCurrentUserCallback = useCallback(() => {
    return dispatch(fetchCurrentUser());
  }, [dispatch]);

  return {
    user,
    loading,
    error,
    login: (data: { email: string; password: string }) => dispatch(login(data)),
    register: (data: { email: string; password: string; confirmPassword: string }) =>
      dispatch(register(data)),
    logout: () => dispatch(logout()),
    fetchCurrentUser: fetchCurrentUserCallback,
    resetAuthError: () => dispatch(resetAuthError()),
    updateUser: (data: { email: string; displayName: string; firstName?: string; lastName?: string; dni?: string; cuit?: string; phone?: string }) =>
      dispatch(updateUser(data)),
  };
};
