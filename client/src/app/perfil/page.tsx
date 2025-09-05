
"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const ProfilePage = () => {
  const { user, loading, fetchCurrentUser, updateUser } = useAuth();
  const [form, setForm] = useState({
    email: "",
    displayName: "",
    firstName: "",
    lastName: "",
    dni: "",
    cuit: "",
    phone: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Inicializar campos con datos del usuario
  useEffect(() => {
    if (!user) fetchCurrentUser();
  }, [user, fetchCurrentUser]);

  useEffect(() => {
    if (user) {
      setForm({
        email: user.email || "",
        displayName: user.displayName || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        dni: user.dni || "",
        cuit: user.cuit || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess("");
    setError("");
    try {
      const result = await updateUser(form);
      // Si la acción fue exitosa, updateUser.fulfilled actualiza el user global
      if (result.meta.requestStatus === "fulfilled") {
        setSuccess("Datos actualizados correctamente");
      } else {
        setError(typeof result.payload === "string" ? result.payload : "Error al actualizar los datos");
      }
    } catch {
      setError("Error al actualizar los datos");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !user) {
    return <div>Cargando...</div>;
  }

  if (!user) {
    return <div>Debes iniciar sesión para ver tu perfil.</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-[#FFFFFF] rounded shadow">
      <h2 className="text-2xl font-bold mb-6 text-[#111111]">Mi Perfil</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium text-[#222222]">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full border border-[#e1e1e1] rounded-none px-3 py-2 bg-[#FFFFFF] text-[#222222] focus:outline-none focus:ring-2 focus:ring-[#222222]"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium text-[#222222]">Nombre para mostrar</label>
          <input
            type="text"
            name="displayName"
            value={form.displayName}
            onChange={handleChange}
            className="w-full border border-[#e1e1e1] rounded-none px-3 py-2 bg-[#FFFFFF] text-[#222222] focus:outline-none focus:ring-2 focus:ring-[#222222]"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium text-[#222222]">Nombre</label>
          <input
            type="text"
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            className="w-full border border-[#e1e1e1] rounded-none px-3 py-2 bg-[#FFFFFF] text-[#222222] focus:outline-none focus:ring-2 focus:ring-[#222222]"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium text-[#222222]">Apellido</label>
          <input
            type="text"
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            className="w-full border border-[#e1e1e1] rounded-none px-3 py-2 bg-[#FFFFFF] text-[#222222] focus:outline-none focus:ring-2 focus:ring-[#222222]"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium text-[#222222]">DNI</label>
          <input
            type="text"
            name="dni"
            value={form.dni}
            onChange={handleChange}
            className="w-full border border-[#e1e1e1] rounded-none px-3 py-2 bg-[#FFFFFF] text-[#222222] focus:outline-none focus:ring-2 focus:ring-[#222222]"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium text-[#222222]">CUIT</label>
          <input
            type="text"
            name="cuit"
            value={form.cuit}
            onChange={handleChange}
            className="w-full border border-[#e1e1e1] rounded-none px-3 py-2 bg-[#FFFFFF] text-[#222222] focus:outline-none focus:ring-2 focus:ring-[#222222]"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium text-[#222222]">Teléfono</label>
          <input
            type="text"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full border border-[#e1e1e1] rounded-none px-3 py-2 bg-[#FFFFFF] text-[#222222] focus:outline-none focus:ring-2 focus:ring-[#222222]"
          />
        </div>
        <button
          type="submit"
          className={`w-full bg-[#222222] text-white py-2 rounded-none transition-colors duration-300 ${submitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#111111]'}`}
          disabled={submitting}
        >
          {submitting ? "Actualizando..." : "Actualizar"}
        </button>
        {success && <div className="text-green-600 mt-2">{success}</div>}
        {error && <div className="text-red-500 mt-2">{error}</div>}
      </form>
    </div>
  );
};

export default ProfilePage;
