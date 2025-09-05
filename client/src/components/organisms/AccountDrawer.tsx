import React, { useEffect, useState } from "react";
import Link from "next/link";
import AccountCircleIcon from "../atoms/Icon/AccountCircleIcon";
import { useAuth } from "@/hooks/useAuth";
import { useEventListener } from "@/hooks/useEventBus";
import { usePathname } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import LoadingSpinner from "../atoms/LoadingSpinner";

const AccountDrawer: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"login" | "register">("login");
  const { user, logout, login, register, loading, error } = useAuth();

  const pathname = usePathname();

  // Form states
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({ email: "", password: "", confirmPassword: "" });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  // Escuchar evento global para abrir el Drawer
  useEventListener("auth:openAccountDrawer", () => {
    setOpen(true);
  });

  // Escuchar evento global para cerrar el Drawer
  useEventListener("auth:closeAccountDrawer", () => {
    setOpen(false);
  });

  // Cierra el Drawer al cambiar de ruta
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(loginData);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError("Las contraseñas no coinciden");
      return;
    }
    await register(registerData);
  };

  const resetForms = () => {
    setLoginData({ email: "", password: "" });
    setRegisterData({ email: "", password: "", confirmPassword: "" });
  };

  const handleTabChange = (newTab: "login" | "register") => {
    setTab(newTab);
    resetForms();
  };

  return (
    <>
      {/* Botón para abrir el Drawer */}
      <button
        className="flex items-center gap-2 bg-white text-black cursor-pointer"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú de cuenta"
      >
        <AccountCircleIcon />
        <span className="hidden sm:inline">Cuenta</span>
      </button>

      {/* Drawer */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-300 ${
          open ? "visible" : "invisible pointer-events-none"
        }`}
      >
        {/* Fondo negro semi-transparente */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setOpen(false)}
        />
        {/* Contenido del Drawer */}
        <div
          className={`absolute top-0 right-0 h-full w-full max-w-xs bg-white shadow-lg transition-transform duration-300 ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Botón cerrar arriba de todo */}
          <div className="flex justify-end p-4">
            <button
              className="text-black hover:text-gray-700 text-2xl cursor-pointer"
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú de cuenta"
            >
              ✕
            </button>
          </div>

          {/* Encabezado MI CUENTA */}
          <div className="flex flex-col items-center gap-1 px-6 pt-2 pb-2 border-b">
            <div>
              <AccountCircleIcon />
            </div>
            <span className="text-lg text-[#000000]">MI CUENTA</span>
          </div>

          {/* Si hay usuario, saludo y links */}
          {user ? (
            <>
              <div className="px-6 pb-2 text-lg font-semibold text-black text-center">
                ¡Hola {user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.lastName
                  ? user.displayName
                  : user.displayName}!
              </div>
              <nav className="flex flex-col gap-4 px-6 py-8">
                <Link
                  href="/perfil"
                  className="text-black underline-animate inline-block self-start"
                >
                  Mi Perfil
                </Link>
                <Link
                  href="/account/orders"
                  className="text-black underline-animate inline-block self-start"
                >
                  Mis Pedidos
                </Link>
                <Link
                  href="/direcciones"
                  className="text-black underline-animate inline-block self-start cursor-not-allowed"
                  tabIndex={-1}
                  aria-disabled="true"
                  onClick={e => { e.preventDefault(); }}
                  style={{ pointerEvents: "auto" }}
                >
                  Direcciones
                </Link>
                <button
                  className="text-black underline-animate self-center text-center cursor-pointer"
                  onClick={async () => {
                    await logout();
                  }}
                >
                  Cerrar Sesión
                </button>
              </nav>
            </>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex border-b mb-4">
                <button
                  className={`flex-1 py-2 text-center ${
                    tab === "login"
                      ? "border-b-2 border-black font-semibold text-[#000000]"
                      : "text-[#7A7A7A]"
                  }`}
                  onClick={() => handleTabChange("login")}
                >
                  Iniciar Sesión
                </button>
                <button
                  className={`flex-1 py-2 text-center ${
                    tab === "register"
                      ? "border-b-2 border-black font-semibold text-[#000000]"
                      : "text-[#7A7A7A]"
                  }`}
                  onClick={() => handleTabChange("register")}
                >
                  Registrarse
                </button>
              </div>

              {tab === "login" && (
                <form
                  className="px-6 py-4 flex flex-col gap-4"
                  onSubmit={handleLogin}
                >
                  <label className="flex flex-col gap-1">
                    <span className="text-sm text-[#777777]">
                      Correo electrónico *
                    </span>
                    <input
                      type="email"
                      placeholder="Correo electrónico"
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
                              setLoginData({
                                ...loginData,
                                email: e.target.value,
                              })
                      }
                      required
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-sm text-[#777777]">Contraseña *</span>
                    <label
                      className={`input w-full border border-[#e1e1e1] rounded-none bg-[#FFFFFF] flex items-center px-3 py-2 gap-2 ${
                        loading
                          ? "opacity-50 cursor-not-allowed pointer-events-none"
                          : ""
                      }`}
                    >
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="Contraseña"
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
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        className="text-gray-500 hover:text-gray-700"
                        onClick={
                          loading
                            ? undefined
                            : () => setShowLoginPassword((v) => !v)
                        }
                        aria-label={
                          showLoginPassword
                            ? "Ocultar contraseña"
                            : "Mostrar contraseña"
                        }
                      >
                        {showLoginPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    </label>
                  </label>
                  {/* Link para recuperar contraseña */}
                  <div className="flex justify-end">
                    <Link
                      href="/forgot-password"
                      className="text-[#000000] underline-animate text-sm"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  {error && <div className="text-red-500 text-sm">{error}</div>}
                  <button
                    type="submit"
                    className={`btn w-full py-2 rounded-none ${
                      loading
                        ? "bg-[#666666] cursor-not-allowed pointer-events-none"
                        : "bg-[#444444] hover:bg-[#111111]"
                    } text-white`}
                  >
                    {loading ? <LoadingSpinner /> : "Ingresar"}
                  </button>
                </form>
              )}
              {tab === "register" && (
                <form
                  className="px-6 py-4 flex flex-col gap-4"
                  onSubmit={handleRegister}
                >
                  <label className="flex flex-col gap-1">
                    <span className="text-sm text-[#777777]">
                      Correo electrónico *
                    </span>
                    <input
                      type="email"
                      placeholder="Correo electrónico"
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
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-sm text-[#777777]">Contraseña *</span>
                    <label
                      className={`input w-full border border-[#e1e1e1] rounded-none bg-[#FFFFFF] flex items-center px-3 py-2 gap-2 ${
                        loading
                          ? "opacity-50 cursor-not-allowed pointer-events-none"
                          : ""
                      }`}
                    >
                      <input
                        type={showRegisterPassword ? "text" : "password"}
                        placeholder="Contraseña"
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
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-sm text-[#777777]">Confirmar contraseña *</span>
                    <label
                      className={`input w-full border border-[#e1e1e1] rounded-none bg-[#FFFFFF] flex items-center px-3 py-2 gap-2 ${
                        loading
                          ? "opacity-50 cursor-not-allowed pointer-events-none"
                          : ""
                      }`}
                    >
                      <input
                        type={showRegisterPassword ? "text" : "password"}
                        placeholder="Confirmar contraseña"
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
                  </label>
                  {registerError && (
                    <div className="text-red-500 text-sm">{registerError}</div>
                  )}
                  {error && <div className="text-red-500 text-sm">{error}</div>}
                  <button
                    type="submit"
                    className={`btn w-full py-2 rounded-none ${
                      loading
                        ? "bg-[#666666] cursor-not-allowed pointer-events-none"
                        : "bg-[#444444] hover:bg-[#111111]"
                    } text-white`}
                  >
                    {loading ? <LoadingSpinner /> : "Registrarse"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default AccountDrawer;
