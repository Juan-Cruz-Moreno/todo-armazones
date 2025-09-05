"use client";
import React, { useRef, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import axiosInstance from "@/utils/axiosInstance";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import LoadingSpinner from "@/components/atoms/LoadingSpinner";

const ResetPasswordContent = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const { fetchCurrentUser } = useAuth();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const modalRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (success && modalRef.current) {
      modalRef.current.showModal();
    }
  }, [success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      await axiosInstance.post("/auth/reset-password", { token, password });
      setSuccess(true);
      await fetchCurrentUser();
    } catch (err: unknown) {
      const errorMessage =
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data
          ? String(err.response.data.message)
          : err instanceof Error
          ? err.message
          : "Error inesperado";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const closeModalAndGo = () => {
    modalRef.current?.close();
  };

  if (!token) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#FFFFFF] px-4">
        <div className="card bg-[#FFFFFF] w-full max-w-md shadow-none border border-[#e1e1e1] rounded-none">
          <div className="card-body">
            <h2 className="card-title text-2xl font-bold mb-4 text-[#111111]">
              Enlace inválido
            </h2>
            <div className="bg-red-100 text-red-700 p-3 rounded mb-2 text-sm border border-red-200">
              El enlace de recuperación no es válido o está incompleto.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-center items-center min-h-screen bg-[#FFFFFF] px-4">
        <div className="card bg-[#FFFFFF] w-full max-w-md shadow-none border border-[#e1e1e1] rounded-none">
          <div className="card-body">
            <h2 className="card-title text-2xl font-bold mb-4 text-[#111111]">
              Restablecer contraseña
            </h2>
            <form onSubmit={handleSubmit}>
              <fieldset className="mb-4">
                <label
                  htmlFor="password"
                  className="block mb-1 text-sm font-medium text-[#7A7A7A]"
                >
                  Nueva contraseña
                </label>
                <label
                  className={`input w-full border border-[#e1e1e1] rounded-none bg-[#FFFFFF] flex items-center px-3 py-2 gap-2 ${
                    loading || success
                      ? "opacity-50 cursor-not-allowed pointer-events-none"
                      : ""
                  }`}
                >
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="grow bg-transparent text-[#222222] outline-none"
                    placeholder="Nueva contraseña"
                    value={password}
                    onChange={
                      loading || success
                        ? undefined
                        : (e) => setPassword(e.target.value)
                    }
                    required
                    minLength={8}
                    maxLength={100}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className={`text-gray-500 hover:text-gray-700 ${
                      loading || success
                        ? "opacity-50 cursor-not-allowed pointer-events-none"
                        : ""
                    }`}
                    onClick={
                      loading || success
                        ? undefined
                        : () => setShowPassword((v) => !v)
                    }
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </label>
                <p className="text-xs mt-1 text-[#7A7A7A]">
                  Debe tener al menos 8 caracteres
                </p>
              </fieldset>
              {error && (
                <div className="bg-red-100 text-red-700 p-2 rounded mb-2 text-xs border border-red-200">
                  {error}
                </div>
              )}
              <button
                type="submit"
                className={`btn rounded-none shadow-none border-none transition-colors duration-300 ease-in-out h-12 text-base px-6 w-full font-bold ${
                  loading || success
                    ? "bg-[#666666] cursor-not-allowed pointer-events-none"
                    : "bg-[#111111] hover:bg-[#222222]"
                } text-white`}
                onClick={loading || success ? undefined : undefined}
              >
                {loading ? <LoadingSpinner /> : "Restablecer contraseña"}
              </button>
            </form>
          </div>
        </div>
      </div>
      <dialog id="reset_success_modal" className="modal" ref={modalRef}>
        <div className="modal-box bg-white text-[#111111] rounded-none">
          <h3 className="font-bold text-lg">
            ¡Contraseña restablecida con éxito!
          </h3>
          <p className="py-4">
            Tu contraseña fue cambiada correctamente. Ya puedes navegar el sitio
            y realizar tus pedidos.
          </p>
          <div className="modal-action">
            <Link
              href="/"
              className="btn rounded-none shadow-none border-none transition-colors duration-300 ease-in-out h-12 text-base px-6 w-full bg-[#111111] text-white font-bold hover:bg-[#222222]"
              onClick={closeModalAndGo}
            >
              Ir al inicio
            </Link>
          </div>
        </div>
      </dialog>
    </>
  );
};

const ResetPasswordPage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen bg-[#FFFFFF] px-4">
          <div className="card bg-[#FFFFFF] w-full max-w-md shadow-none border border-[#e1e1e1] rounded-none">
            <div className="card-body">
              <div className="loading loading-spinner loading-lg text-[#111111]"></div>
            </div>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
};

export default ResetPasswordPage;
