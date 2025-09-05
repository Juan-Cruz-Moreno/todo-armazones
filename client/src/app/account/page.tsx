"use client";

import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { login, register } from "@/redux/slices/authSlice";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import LoadingSpinner from "@/components/atoms/LoadingSpinner";

const AccountPage = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading, error } = useAppSelector((state) => state.auth);

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({ email: "", password: "", confirmPassword: "" });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(login(loginData));
    if (login.fulfilled.match(result)) {
      router.push("/"); // Redirige si login es exitoso
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError("Las contraseñas no coinciden");
      return;
    }
    const result = await dispatch(register(registerData));
    if (register.fulfilled.match(result)) {
      router.push("/"); // Redirige si registro es exitoso
    }
  };

  return (
    <div className=" bg-gray-100 p-4 flex flex-col items-center md:justify-center">
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 items-start">
        {/* Login Card */}
        <div className="bg-white shadow-md rounded-none p-6">
          <h2 className="text-2xl font-semibold mb-4 text-[#111111]">
            Ingresar
          </h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-[#777777]">
                Correo electrónico *
              </label>
              <input
                type="email"
                className={`input w-full border border-[#e1e1e1] rounded-none bg-[#FFFFFF] text-[#222222] px-3 py-2 ${
                  loading
                    ? "opacity-50 cursor-not-allowed pointer-events-none"
                    : ""
                }`}
                value={loginData.email}
                onChange={
                  loading
                    ? undefined
                    : (e) =>
                        setLoginData({ ...loginData, email: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-[#777777]">
                Contraseña *
              </label>
              <label
                className={`input w-full border border-[#e1e1e1] rounded-none bg-[#FFFFFF] flex items-center px-3 py-2 gap-2 ${
                  loading
                    ? "opacity-50 cursor-not-allowed pointer-events-none"
                    : ""
                }`}
              >
                <input
                  type={showLoginPassword ? "text" : "password"}
                  className="grow bg-transparent text-[#222222] outline-none"
                  value={loginData.password}
                  onChange={
                    loading
                      ? undefined
                      : (e) =>
                          setLoginData({
                            ...loginData,
                            password: e.target.value,
                          })
                  }
                  required
                  placeholder="Contraseña"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="text-gray-500 hover:text-gray-700"
                  onClick={
                    loading ? undefined : () => setShowLoginPassword((v) => !v)
                  }
                  aria-label={
                    showLoginPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                >
                  {showLoginPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </label>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              className={`w-full py-2 rounded-none ${
                loading
                  ? "bg-[#666666] cursor-not-allowed pointer-events-none"
                  : "bg-[#444444] hover:bg-[#111111]"
              } text-white`}
            >
              {loading ? <LoadingSpinner /> : "Ingresar"}
            </button>
          </form>
        </div>

        {/* Register Card */}
        <div className="bg-white shadow-md rounded-none p-6">
          <h2 className="text-2xl font-semibold mb-4 text-[#111111]">
            Registrarse
          </h2>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-[#777777]">
                Correo electrónico *
              </label>
              <input
                type="email"
                className={`input w-full border border-[#e1e1e1] rounded-none bg-[#FFFFFF] text-[#222222] px-3 py-2 ${
                  loading
                    ? "opacity-50 cursor-not-allowed pointer-events-none"
                    : ""
                }`}
                value={registerData.email}
                onChange={
                  loading
                    ? undefined
                    : (e) =>
                        setRegisterData({
                          ...registerData,
                          email: e.target.value,
                        })
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-[#777777]">
                Contraseña *
              </label>
              <label
                className={`input w-full border border-[#e1e1e1] rounded-none bg-[#FFFFFF] flex items-center px-3 py-2 gap-2 ${
                  loading
                    ? "opacity-50 cursor-not-allowed pointer-events-none"
                    : ""
                }`}
              >
                <input
                  type={showRegisterPassword ? "text" : "password"}
                  className="grow bg-transparent text-[#222222] outline-none"
                  value={registerData.password}
                  onChange={
                    loading
                      ? undefined
                      : (e) =>
                          setRegisterData({
                            ...registerData,
                            password: e.target.value,
                          })
                  }
                  required
                  placeholder="Contraseña"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="text-gray-500 hover:text-gray-700"
                  onClick={
                    loading
                      ? undefined
                      : () => setShowRegisterPassword((v) => !v)
                  }
                  aria-label={
                    showRegisterPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                >
                  {showRegisterPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-[#777777]">
                Confirmar contraseña *
              </label>
              <label
                className={`input w-full border border-[#e1e1e1] rounded-none bg-[#FFFFFF] flex items-center px-3 py-2 gap-2 ${
                  loading
                    ? "opacity-50 cursor-not-allowed pointer-events-none"
                    : ""
                }`}
              >
                <input
                  type={showRegisterPassword ? "text" : "password"}
                  className="grow bg-transparent text-[#222222] outline-none"
                  value={registerData.confirmPassword}
                  onChange={
                    loading
                      ? undefined
                      : (e) =>
                          setRegisterData({
                            ...registerData,
                            confirmPassword: e.target.value,
                          })
                  }
                  required
                  placeholder="Confirmar contraseña"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="text-gray-500 hover:text-gray-700"
                  onClick={
                    loading
                      ? undefined
                      : () => setShowRegisterPassword((v) => !v)
                  }
                  aria-label={
                    showRegisterPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                >
                  {showRegisterPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </label>
            </div>
            {registerError && <p className="text-red-600 text-sm">{registerError}</p>}
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              className={`w-full py-2 rounded-none ${
                loading
                  ? "bg-[#666666] cursor-not-allowed pointer-events-none"
                  : "bg-[#444444] hover:bg-[#111111]"
              } text-white`}
            >
              {loading ? <LoadingSpinner /> : "Registrarse"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
