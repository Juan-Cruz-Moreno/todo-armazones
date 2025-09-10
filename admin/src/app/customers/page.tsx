"use client";
import React, { useEffect, useRef, useCallback, useState } from "react";
import { useUsers } from "@/hooks/useUsers";
import { debounce } from "@/utils/debounce";
import LoadingSpinner from "@/components/atoms/LoadingSpinner";
import { createUserByAdmin } from "@/redux/slices/userSlice";

const SKELETON_COUNT = 10;

const CustomersPage = () => {
  const { users, nextCursor, loading, error, loadUsers, createUser } =
    useUsers();
  const observer = useRef<IntersectionObserver | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dni, setDni] = useState("");
  const [cuit, setCuit] = useState("");
  const [phone, setPhone] = useState("");

  // Debounced loadUsers for infinite scroll
  const debouncedFetch = useRef(
    debounce((params: { cursor?: string }) => {
      loadUsers(10, params.cursor);
    }, 200)
  ).current;

  const lastUserRef = useCallback(
    (node: HTMLTableRowElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new window.IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && nextCursor) {
          debouncedFetch({ cursor: nextCursor });
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, nextCursor, debouncedFetch]
  );

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setDisplayName("");
    setFirstName("");
    setLastName("");
    setDni("");
    setCuit("");
    setPhone("");
    setFormError(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!email || !password) {
      setFormError("Email y contraseña son requeridos");
      return;
    }
    setSubmitting(true);
    const action = await createUser({
      email,
      password,
      displayName: displayName || undefined,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      dni: dni || undefined,
      cuit: cuit || undefined,
      phone: phone || undefined,
    });
    setSubmitting(false);
    if (createUserByAdmin.fulfilled.match(action)) {
      handleCloseCreate();
    } else {
      setFormError((action.payload as string) || "No se pudo crear el usuario");
    }
  };

  // Skeleton row for loading
  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <th>
        <div className="h-4 w-4 bg-gray-200 rounded" />
      </th>
      <td>
        <div className="h-4 w-24 bg-gray-200 rounded" />
      </td>
      <td>
        <div className="h-4 w-32 bg-gray-200 rounded" />
      </td>
      <td>
        <div className="h-4 w-20 bg-gray-200 rounded" />
      </td>
    </tr>
  );

  return (
    <div className="px-4 py-6">
      <h1 className="text-[#111111] font-bold text-2xl mb-4">
        Lista de clientes
      </h1>
      <div className="mb-4 flex justify-end">
        <button
          onClick={handleOpenCreate}
          className="btn bg-[#222222] text-white px-4 py-2 rounded-none shadow-none"
        >
          Crear cliente
        </button>
      </div>
      {/* Tabla DaisyUI para desktop */}
      <div className="hidden md:block">
        <table className="table">
          <thead className="text-[#222222]">
            <tr>
              <th>#</th>
              <th>Email</th>
              <th>Último acceso</th>
              <th>Fecha de creación</th>
            </tr>
          </thead>
          <tbody className="text-[#222222]">
            {loading &&
              users.length === 0 &&
              Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
                <SkeletonRow key={idx} />
              ))}
            {error && (
              <tr>
                <td colSpan={5} className="text-center text-error">
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && users.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-sm opacity-60">
                  No hay clientes
                </td>
              </tr>
            )}
            {users.map((user, idx) => {
              if (idx === users.length - 1) {
                return (
                  <tr ref={lastUserRef} key={user.id}>
                    <th>{idx + 1}</th>
                    <td>{user.email}</td>
                    <td>
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleString("es-AR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </td>
                    <td>
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleString("es-AR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "2-digit",
                          })
                        : ""}
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={user.id}>
                  <th>{idx + 1}</th>
                  <td>{user.email}</td>
                  <td>
                    {user.lastLogin
                      ? new Date(user.lastLogin).toLocaleString("es-AR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </td>
                  <td>
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleString("es-AR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "2-digit",
                        })
                      : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Tabla mobile: una "columna" por usuario */}
      <div className="block md:hidden">
        <div className="space-y-4">
          {loading &&
            users.length === 0 &&
            Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
              <div
                key={idx}
                className="p-4 border rounded animate-pulse space-y-2"
              >
                <div className="h-4 w-4 bg-gray-200 rounded" />
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-4 w-32 bg-gray-200 rounded" />
              </div>
            ))}
          {error && (
            <div className="p-4 border rounded text-center text-error">
              {error}
            </div>
          )}
          {!loading && !error && users.length === 0 && (
            <div className="p-4 border rounded text-center text-sm opacity-60">
              No hay clientes
            </div>
          )}
          {users.map((user, idx) => (
            <div
              key={user.id}
              ref={idx === users.length - 1 ? lastUserRef : undefined}
              className="p-4 border rounded space-y-1 text-[#222222]"
            >
              <div className="font-bold text-xs">#{idx + 1}</div>
              <div>
                <span className="font-semibold">Email:</span> {user.email}
              </div>
              <div>
                <span className="font-semibold">Último acceso:</span>{" "}
                {user.lastLogin
                  ? new Date(user.lastLogin).toLocaleString("es-AR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Mensajes de carga y fin de lista */}
      {loading && users.length > 0 && (
        <div className="flex justify-center py-4 text-[#666666]">
          <LoadingSpinner />
        </div>
      )}
      {!nextCursor && !loading && users.length > 0 && (
        <div className="p-4 text-center text-sm text-[#222222] opacity-60">
          No hay más clientes.
        </div>
      )}

      {/* Modal crear cliente (estilo consistente con EditItemPricesModal) */}
      <dialog className={`modal ${isCreateOpen ? "modal-open" : ""}`}>
        <div className="modal-box w-full max-w-md rounded-none border border-[#e1e1e1] bg-[#FFFFFF] text-[#222222] p-0 max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-[#FFFFFF] border-b border-[#e1e1e1] flex justify-between items-center h-12 z-30">
            <h3 className="font-bold text-lg text-[#111111] m-0 px-4">
              Crear cliente
            </h3>
            <button
              className="btn btn-sm bg-transparent text-[#333333] hover:text-[#111111] shadow-none h-full w-12 border-l border-[#e1e1e1] border-t-0 border-r-0 border-b-0 m-0"
              onClick={handleCloseCreate}
              disabled={submitting}
            >
              ✕
            </button>
          </div>

          <div className="p-4">
            <form onSubmit={handleSubmitCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#111111] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111111] mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111111] mb-1">
                  Nombre a mostrar (opcional)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#111111] mb-1">
                    Nombre (opcional)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111111] mb-1">
                    Apellido (opcional)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#111111] mb-1">
                    DNI (opcional)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111111] mb-1">
                    CUIT (opcional)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                    value={cuit}
                    onChange={(e) => setCuit(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111111] mb-1">
                  Teléfono (opcional)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              {formError && (
                <div className="text-error text-sm">{formError}</div>
              )}
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseCreate}
                  className="flex-1 px-4 py-2 text-[#333333] bg-[#f1f1f1] rounded-none hover:bg-[#e1e1e1] transition-colors border border-[#e1e1e1]"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-white bg-[#222222] rounded-none hover:bg-[#111111] transition-colors disabled:opacity-50 shadow-none"
                  disabled={submitting}
                >
                  {submitting ? "Creando..." : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
        <form
          method="dialog"
          className="modal-backdrop"
          onClick={handleCloseCreate}
        >
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
};

export default CustomersPage;
