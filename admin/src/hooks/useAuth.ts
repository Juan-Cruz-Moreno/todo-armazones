import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { login, checkSession, logoutAsync } from "@/redux/slices/authSlice";
import { LoginPayload } from "@/interfaces/auth";

export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, loading, error, isAuthenticated, isAdmin, sessionChecked } = useAppSelector((state) => state.auth);

  const handleLogin = useCallback(
    (payload: LoginPayload) => dispatch(login(payload)),
    [dispatch]
  );

  const handleCheckSession = useCallback(
    () => dispatch(checkSession()),
    [dispatch]
  );

  // Permite pasar un callback que se ejecuta tras logout exitoso
  const handleLogout = useCallback(
    async (onLogout?: () => void) => {
      const resultAction = await dispatch(logoutAsync());
      if (logoutAsync.fulfilled.match(resultAction) && onLogout) {
        onLogout();
      }
    },
    [dispatch]
  );

  return {
    user,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    sessionChecked, // Nuevo flag expuesto
    login: handleLogin,
    checkSession: handleCheckSession,
    logout: handleLogout,
  };
}
