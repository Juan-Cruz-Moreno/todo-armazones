"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LoginPayload } from "@/interfaces/auth";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/atoms/LoadingSpinner";

const LoginPage = () => {
  const { login, loading, error, isAuthenticated, isAdmin, sessionChecked, checkSession } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState<LoginPayload["email"]>("");
  const [password, setPassword] = useState<LoginPayload["password"]>("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Disparar checkSession si no está chequeada la sesión
    if (isClient && !sessionChecked) {
      checkSession();
    }
  }, [isClient, sessionChecked, checkSession]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    login({ email, password });
  };

  useEffect(() => {
    // Solo redirigir si la sesión ya fue chequeada y está autenticado y es admin
    if (isClient && sessionChecked && isAuthenticated && isAdmin) {
      router.replace("/");
    }
  }, [isClient, sessionChecked, isAuthenticated, isAdmin, router]);

  if (!isClient || !sessionChecked) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex justify-center items-center">
      <form className="w-full max-w-md space-y-6" onSubmit={handleSubmit}>
        <h2 className="text-3xl font-semibold mb-6 text-[#111111] text-center">
          Iniciar sesión
        </h2>
        {error && (
          <div className="text-red-600 text-center text-sm mb-2">{error}</div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1 text-[#777777]">
            Correo electrónico *
          </label>
          <input
            type="email"
            className="w-full border border-gray-300 rounded px-3 py-2 text-[#222222]"
            required
            placeholder="Ingrese su correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-[#777777]">
            Contraseña *
          </label>
          <input
            type="password"
            className="w-full border border-gray-300 rounded px-3 py-2 text-[#222222]"
            required
            placeholder="Ingrese su contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          className="w-full bg-[#444444] text-white py-2 rounded-none hover:bg-[#111111]"
          disabled={loading}
        >
          {loading ? <LoadingSpinner /> : "Iniciar sesión"}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
