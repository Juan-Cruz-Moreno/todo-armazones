"use client";
import React, { useState } from "react";
import axiosInstance from "@/utils/axiosInstance";
import LoadingSpinner from "@/components/atoms/LoadingSpinner";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      await axiosInstance.post("/auth/forgot-password", { email });
      setSuccess(true);
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

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#FFFFFF] px-4">
      <div className="card bg-[#FFFFFF] w-full max-w-md shadow-none border border-[#e1e1e1] rounded-none">
        <div className="card-body">
          <h2 className="card-title text-2xl font-bold mb-4 text-[#111111]">
            Recuperar contraseña
          </h2>
          {success ? (
            <div className="bg-green-100 text-green-700 p-3 rounded mb-2 text-base border border-green-200 font-semibold">
              Si el correo existe, se ha enviado un enlace para restablecer la
              contraseña.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <fieldset className="mb-4">
                <label
                  htmlFor="email"
                  className="block mb-1 text-sm font-medium text-[#7A7A7A]"
                >
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  className={`input w-full border rounded-none bg-[#FFFFFF] text-[#222222] ${
                    loading
                      ? "opacity-50 cursor-not-allowed pointer-events-none"
                      : ""
                  }`}
                  style={{ borderColor: "#e1e1e1" }}
                  placeholder="tucorreo@ejemplo.com"
                  value={email}
                  onChange={
                    loading ? undefined : (e) => setEmail(e.target.value)
                  }
                  required
                  maxLength={100}
                />
                <p className="text-xs mt-1 text-[#7A7A7A]">
                  Te enviaremos un enlace para restablecer tu contraseña
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
                  loading
                    ? "bg-[#666666] cursor-not-allowed pointer-events-none"
                    : "bg-[#111111] hover:bg-[#222222]"
                } text-white`}
                onClick={loading ? undefined : undefined}
              >
                {loading ? <LoadingSpinner /> : "Enviar enlace"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
