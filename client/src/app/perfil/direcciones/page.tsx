"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DeliveryType } from "@/enums/order.enum";

const AddressPage = () => {
  const {
    address,
    addressLoading,
    addressError,
    fetchMostRecentAddress,
    updateDefaultAddress,
    resetAddressError,
  } = useAuth();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    email: "",
    phoneNumber: "",
    dni: "",
    cuit: "",
    streetAddress: "",
    city: "",
    state: "",
    postalCode: "",
    shippingCompany: "",
    declaredShippingAmount: "",
    deliveryWindow: "",
    deliveryType: DeliveryType.HomeDelivery,
    pickupPointAddress: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Cargar dirección al montar el componente
  useEffect(() => {
    fetchMostRecentAddress();
  }, [fetchMostRecentAddress]);

  // Inicializar campos con datos de la dirección existente
  useEffect(() => {
    if (address) {
      setForm({
        firstName: address.firstName || "",
        lastName: address.lastName || "",
        companyName: address.companyName || "",
        email: address.email || "",
        phoneNumber: address.phoneNumber || "",
        dni: address.dni || "",
        cuit: address.cuit || "",
        streetAddress: address.streetAddress || "",
        city: address.city || "",
        state: address.state || "",
        postalCode: address.postalCode || "",
        shippingCompany: address.shippingCompany || "",
        declaredShippingAmount: address.declaredShippingAmount || "",
        deliveryWindow: address.deliveryWindow || "",
        deliveryType: address.deliveryType || DeliveryType.HomeDelivery,
        pickupPointAddress: address.pickupPointAddress || "",
      });
    }
  }, [address]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess("");
    setError("");
    resetAddressError();

    try {
      // Filtrar campos vacíos opcionales
      const payload: Record<string, string> = {};
      Object.entries(form).forEach(([key, value]) => {
        if (value && value.trim() !== "") {
          payload[key] = value;
        }
      });

      const result = await updateDefaultAddress(payload);

      if (result.meta.requestStatus === "fulfilled") {
        setSuccess(
          address
            ? "Dirección actualizada correctamente"
            : "Dirección creada correctamente"
        );
      } else {
        setError(
          typeof result.payload === "string"
            ? result.payload
            : "Error al guardar la dirección"
        );
      }
    } catch {
      setError("Error al guardar la dirección");
    } finally {
      setSubmitting(false);
    }
  };

  if (addressLoading && !address) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-6">
        <div className="text-center text-[#222222]">Cargando dirección...</div>
      </div>
    );
  }

  const isHomeDelivery = form.deliveryType === DeliveryType.HomeDelivery;
  const isPickupPoint = form.deliveryType === DeliveryType.PickupPoint;

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-[#FFFFFF] rounded shadow">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#111111]">
          {address ? "Mi Dirección" : "Nueva Dirección"}
        </h2>
        <p className="text-sm text-[#666666] mt-1">
          {address
            ? "Actualiza tu dirección de envío favorita"
            : "Completa los datos para crear tu dirección de envío"}
        </p>
      </div>

      {addressError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {addressError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tipo de Entrega */}
        <div className="p-4 bg-[#f9f9f9] border border-[#e1e1e1]">
          <label className="block mb-2 font-medium text-[#222222]">
            Tipo de Entrega
          </label>
          <select
            name="deliveryType"
            value={form.deliveryType}
            onChange={handleChange}
            className="w-full border border-[#e1e1e1] rounded-none px-3 py-2 bg-[#FFFFFF] text-[#222222] focus:outline-none focus:ring-2 focus:ring-[#222222]"
          >
            <option value={DeliveryType.HomeDelivery}>
              Entrega a Domicilio
            </option>
            <option value={DeliveryType.PickupPoint}>
              Punto de Retiro
            </option>
          </select>
        </div>

        {/* Información Personal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium text-[#222222]">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              className="w-full border border-[#e1e1e1] rounded-none px-3 py-2 bg-[#FFFFFF] text-[#222222] focus:outline-none focus:ring-2 focus:ring-[#222222]"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-[#222222]">
              Apellido <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              className="w-full border border-[#e1e1e1] rounded-none px-3 py-2 bg-[#FFFFFF] text-[#222222] focus:outline-none focus:ring-2 focus:ring-[#222222]"
              required
            />
          </div>
        </div>

        <div>
          <label className="block mb-1 font-medium text-[#222222]">
            Nombre de la Empresa (opcional)
          </label>
          <input
            type="text"
            name="companyName"
            value={form.companyName}
            onChange={handleChange}
            className="w-full border border-[#e1e1e1] rounded-none px-3 py-2 bg-[#FFFFFF] text-[#222222] focus:outline-none focus:ring-2 focus:ring-[#222222]"
          />
        </div>

        {/* Contacto */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium text-[#222222]">
              Email <span className="text-red-500">*</span>
            </label>
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
            <label className="block mb-1 font-medium text-[#222222]">
              Teléfono <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={handleChange}
              className="w-full border border-[#e1e1e1] rounded-none px-3 py-2 bg-[#FFFFFF] text-[#222222] focus:outline-none focus:ring-2 focus:ring-[#222222]"
              required
            />
          </div>
        </div>

        {/* Documentos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium text-[#222222]">
              DNI <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="dni"
              value={form.dni}
              onChange={handleChange}
              className="w-full border border-[#e1e1e1] rounded-none px-3 py-2 bg-[#FFFFFF] text-[#222222] focus:outline-none focus:ring-2 focus:ring-[#222222]"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-[#222222]">
              CUIT (opcional)
            </label>
            <input
              type="text"
              name="cuit"
              value={form.cuit}
              onChange={handleChange}
              className="w-full border border-[#e1e1e1] rounded-none px-3 py-2 bg-[#FFFFFF] text-[#222222] focus:outline-none focus:ring-2 focus:ring-[#222222]"
            />
          </div>
        </div>

        {/* Dirección - Solo si es entrega a domicilio */}
        {isHomeDelivery && (
          <div>
            <label className="block mb-1 font-medium text-[#222222]">
              Dirección <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="streetAddress"
              value={form.streetAddress}
              onChange={handleChange}
              placeholder="Calle, número, piso, departamento"
              className="w-full border border-[#e1e1e1] rounded-none px-3 py-2 bg-[#FFFFFF] text-[#222222] focus:outline-none focus:ring-2 focus:ring-[#222222]"
              required={isHomeDelivery}
            />
          </div>
        )}

        {/* Punto de Retiro - Solo si es pickup point */}
        {isPickupPoint && (
          <div>
            <label className="block mb-1 font-medium text-[#222222]">
              Dirección del Punto de Retiro{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="pickupPointAddress"
              value={form.pickupPointAddress}
              onChange={handleChange}
              placeholder="Dirección completa del punto de retiro"
              className="w-full border border-[#e1e1e1] rounded-none px-3 py-2 bg-[#FFFFFF] text-[#222222] focus:outline-none focus:ring-2 focus:ring-[#222222]"
              required={isPickupPoint}
            />
          </div>
        )}

        {/* Ubicación */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block mb-1 font-medium text-[#222222]">
              Ciudad <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="city"
              value={form.city}
              onChange={handleChange}
              className="w-full border border-[#e1e1e1] rounded-none px-3 py-2 bg-[#FFFFFF] text-[#222222] focus:outline-none focus:ring-2 focus:ring-[#222222]"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-[#222222]">
              Provincia <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="state"
              value={form.state}
              onChange={handleChange}
              className="w-full border border-[#e1e1e1] rounded-none px-3 py-2 bg-[#FFFFFF] text-[#222222] focus:outline-none focus:ring-2 focus:ring-[#222222]"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-[#222222]">
              Código Postal <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="postalCode"
              value={form.postalCode}
              onChange={handleChange}
              className="w-full border border-[#e1e1e1] rounded-none px-3 py-2 bg-[#FFFFFF] text-[#222222] focus:outline-none focus:ring-2 focus:ring-[#222222]"
              required
            />
          </div>
        </div>

        {/* Información de Envío (opcional) */}
        <div className="p-4 bg-[#f9f9f9] border border-[#e1e1e1]">
          <h3 className="font-medium text-[#222222] mb-3">
            Información de Envío (Opcional)
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block mb-1 text-sm text-[#222222]">
                Empresa de Envío
              </label>
              <input
                type="text"
                name="shippingCompany"
                value={form.shippingCompany}
                onChange={handleChange}
                placeholder="ej. Correo Argentino, Andreani, OCA"
                className="w-full border border-[#e1e1e1] rounded-none px-3 py-2 bg-[#FFFFFF] text-[#222222] focus:outline-none focus:ring-2 focus:ring-[#222222]"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm text-[#222222]">
                Monto Declarado para Envío
              </label>
              <input
                type="text"
                name="declaredShippingAmount"
                value={form.declaredShippingAmount}
                onChange={handleChange}
                placeholder="ej. $50,000"
                className="w-full border border-[#e1e1e1] rounded-none px-3 py-2 bg-[#FFFFFF] text-[#222222] focus:outline-none focus:ring-2 focus:ring-[#222222]"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm text-[#222222]">
                Ventana de Entrega
              </label>
              <input
                type="text"
                name="deliveryWindow"
                value={form.deliveryWindow}
                onChange={handleChange}
                placeholder="ej. 9:00 - 18:00"
                className="w-full border border-[#e1e1e1] rounded-none px-3 py-2 bg-[#FFFFFF] text-[#222222] focus:outline-none focus:ring-2 focus:ring-[#222222]"
              />
            </div>
          </div>
        </div>

        {/* Botón de Envío */}
        <button
          type="submit"
          className={`w-full bg-[#222222] text-white py-3 rounded-none transition-colors duration-300 font-medium ${
            submitting
              ? "opacity-70 cursor-not-allowed"
              : "hover:bg-[#111111]"
          }`}
          disabled={submitting}
        >
          {submitting
            ? "Guardando..."
            : address
            ? "Actualizar Dirección"
            : "Crear Dirección"}
        </button>

        {/* Mensajes de éxito/error */}
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded">
            {success}
          </div>
        )}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}
      </form>

      {/* Información adicional */}
      {address && (
        <div className="mt-6 p-4 bg-[#f9f9f9] border border-[#e1e1e1] text-sm text-[#666666]">
          <p>
            <strong>Nota:</strong> Esta es tu dirección favorita. Se utilizará
            para autocompletar el formulario de envío.
          </p>
          <p className="mt-1 text-xs">
            Última actualización:{" "}
            {new Date(address.updatedAt).toLocaleDateString("es-AR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      )}
    </div>
  );
};

export default AddressPage;
