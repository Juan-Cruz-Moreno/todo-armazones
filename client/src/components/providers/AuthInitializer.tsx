"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

interface AuthInitializerProps {
  children: React.ReactNode;
}

const AuthInitializer: React.FC<AuthInitializerProps> = ({ children }) => {
  const { fetchCurrentUser } = useAuth();

  useEffect(() => {
    // Verificar autenticación una sola vez al inicializar la app
    fetchCurrentUser();
  }, [fetchCurrentUser]); // ✅ Ahora sí, sin advertencias y sin bucles

  return <>{children}</>;
};

export default AuthInitializer;
