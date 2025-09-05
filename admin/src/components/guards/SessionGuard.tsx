"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

interface Props {
  children: React.ReactNode;
}

const SessionGuard: React.FC<Props> = ({ children }) => {
  const { loading, error, isAuthenticated, isAdmin, checkSession, sessionChecked } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    checkSession();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    // Solo redirigir si la sesión ya fue chequeada y no está autenticado o no es admin
    if (isClient && sessionChecked && !loading && !error && (!isAuthenticated || !isAdmin)) {
      router.replace("/login");
    }
  }, [isClient, sessionChecked, loading, error, isAuthenticated, isAdmin, router]);

  if (!isClient || !sessionChecked) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-lg font-semibold">
        Verificando permisos de administrador...
      </div>
    );
  }

  // Si hay un error de red o servidor, mostrar el error
  if (error && !isAuthenticated) {
    return (
      <div className="w-full h-screen flex items-center justify-center flex-col gap-4">
        <div className="text-red-600 font-semibold">Error de conexión</div>
        <button 
          onClick={() => checkSession()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // Si no está autenticado o no es admin, no mostrar contenido (se redirigirá)
  if (sessionChecked && (!isAuthenticated || !isAdmin)) {
    return null;
  }

  return <>{children}</>;
};

export default SessionGuard;
