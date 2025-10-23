"use client";

import { useEffect, useMemo, useState } from "react";
import { useDollar } from "@/hooks/useDollar";
import { useMaintenance } from "@/hooks/useMaintenance";
import { formatCurrency } from "@/utils/formatCurrency";
import Image from "next/image";

const ConfigurationPage = () => {
  const { dollar, loading, error, updateConfig, forceUpdateDollarValue } =
    useDollar();
  const { maintenance, loading: maintenanceLoading, error: maintenanceError, updateMaintenanceState } =
    useMaintenance();

  const [addedValue, setAddedValue] = useState<number | "">(0);
  const [isPercentage, setIsPercentage] = useState<boolean>(false);
  const [maintenanceActive, setMaintenanceActive] = useState<boolean>(false);
  const [maintenanceImage, setMaintenanceImage] = useState<number>(1);
  const [maintenanceTitle, setMaintenanceTitle] = useState<string>("");
  const [maintenanceSubtitle, setMaintenanceSubtitle] = useState<string>("");

  useEffect(() => {
    if (dollar) {
      setAddedValue(dollar.addedValue ?? 0);
      setIsPercentage(Boolean(dollar.isPercentage));
    }
  }, [dollar]);

  useEffect(() => {
    if (maintenance) {
      setMaintenanceActive(maintenance.active);
      setMaintenanceImage(maintenance.image || 1);
      setMaintenanceTitle(maintenance.title || "");
      setMaintenanceSubtitle(maintenance.subtitle || "");
    }
  }, [maintenance]);

  const formattedApiUpdatedAt = useMemo(() => {
    if (!dollar?.apiUpdatedAt) return "-";
    const date = new Date(dollar.apiUpdatedAt);
    return isNaN(date.getTime()) ? "-" : date.toLocaleString();
  }, [dollar?.apiUpdatedAt]);

  const formattedBackendUpdatedAt = useMemo(() => {
    if (!dollar?.updatedAt) return "-";
    const date = new Date(dollar.updatedAt);
    return isNaN(date.getTime()) ? "-" : date.toLocaleString();
  }, [dollar?.updatedAt]);

  const formattedMaintenanceUpdatedAt = useMemo(() => {
    if (!maintenance?.updatedAt) return "-";
    const date = new Date(maintenance.updatedAt);
    return isNaN(date.getTime()) ? "-" : date.toLocaleString();
  }, [maintenance?.updatedAt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({ addedValue: Number(addedValue) || 0, isPercentage });
  };

  const handleMaintenanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMaintenanceState({
      active: maintenanceActive,
      image: maintenanceImage as number,
      title: maintenanceTitle.trim() || undefined,
      subtitle: maintenanceSubtitle.trim() || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] pt-4 pb-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-none shadow-none p-6 border border-[#e1e1e1]">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-[#111111] m-0">
              Configuración de Dólar
            </h1>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}

          {maintenanceError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {maintenanceError}
            </div>
          )}

          <section className="grid gap-2 mb-6 text-[#222222]">
            <div>
              <strong className="text-[#111111]">Valor base</strong>{" "}
              <a
                href={
                  dollar?.source === "bluelytics"
                    ? "https://bluelytics.com.ar"
                    : "https://app.dolarapi.com"
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                (Fuente{" "}
                {dollar?.source === "bluelytics" ? "Bluelytics" : "DolarApi"})
              </a>
              <strong className="text-[#111111]">:</strong>{" "}
              {formatCurrency(dollar?.baseValue ?? 0, "es-AR", "ARS")}
            </div>
            <div>
              <strong className="text-[#111111]">Valor actual:</strong>{" "}
              {formatCurrency(dollar?.value ?? 0, "es-AR", "ARS")}
            </div>
            <div>
              <strong className="text-[#111111]">
                Última actualización API:
              </strong>{" "}
              {formattedApiUpdatedAt}
            </div>
            <div>
              <strong className="text-[#111111]">
                Última modificación backend:
              </strong>{" "}
              {formattedBackendUpdatedAt}
            </div>
          </section>

          <form onSubmit={handleSubmit} className="grid gap-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-[#111111] mb-1">
                Valor agregado {isPercentage ? "(%)" : "(fijo)"}
              </label>
              <input
                type="number"
                step={isPercentage ? 0.01 : 1}
                value={addedValue}
                onChange={(e) =>
                  setAddedValue(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                disabled={loading}
                min={undefined}
                className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                required
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPercentage}
                onChange={(e) => setIsPercentage(e.target.checked)}
                disabled={loading}
                className="checkbox checkbox-sm border-[#e1e1e1] checked:bg-[#222222] checked:border-[#222222]"
              />
              <span className="text-sm text-[#222222]">Usar porcentaje</span>
            </label>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-white bg-[#222222] rounded-none hover:bg-[#111111] transition-colors disabled:opacity-50 shadow-none"
              >
                {loading ? "Guardando..." : "Guardar configuración"}
              </button>
              <button
                type="button"
                onClick={forceUpdateDollarValue}
                disabled={loading}
                className="px-4 py-2 text-[#333333] bg-[#f1f1f1] rounded-none hover:bg-[#e1e1e1] transition-colors border border-[#e1e1e1]"
              >
                {loading ? "Actualizando..." : "Actualizar ahora"}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-none shadow-none p-6 border border-[#e1e1e1] mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-[#111111] m-0">
              Estado del Sistema
            </h2>
          </div>

          <section className="grid gap-2 mb-6 text-[#222222]">
            <div>
              <strong className="text-[#111111]">Modo mantenimiento:</strong>{" "}
              {maintenance?.active ? "Activado" : "Desactivado"}
            </div>
            <div>
              <strong className="text-[#111111]">Imagen de mantenimiento:</strong>
              <div className="mt-2">
                <span className="inline-block w-24 h-16 border border-[#e1e1e1] rounded overflow-hidden">
                  <Image
                    src={`/maintenance/${maintenance?.image || 1}.jpg`}
                    alt={`Imagen seleccionada ${maintenance?.image || 1}`}
                    width={96}
                    height={64}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/maintenance/default.jpg";
                    }}
                  />
                </span>
              </div>
            </div>
            <div>
              <strong className="text-[#111111]">Título:</strong>{" "}
              {maintenance?.title || "-"}
            </div>
            <div>
              <strong className="text-[#111111]">Subtítulo:</strong>{" "}
              {maintenance?.subtitle || "-"}
            </div>
            <div>
              <strong className="text-[#111111]">
                Última modificación:
              </strong>{" "}
              {formattedMaintenanceUpdatedAt}
            </div>
          </section>

          <form onSubmit={handleMaintenanceSubmit} className="grid gap-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-[#111111] mb-3">
                Imagen de mantenimiento
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((imageNumber) => (
                  <div
                    key={imageNumber}
                    onClick={() => setMaintenanceImage(imageNumber)}
                    className={`relative cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                      maintenanceImage === imageNumber
                        ? "border-[#2271B1] ring-2 ring-[#2271B1] ring-opacity-50"
                        : "border-[#e1e1e1] hover:border-[#ccc]"
                    } ${maintenanceLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <Image
                      src={`/maintenance/${imageNumber}.jpg`}
                      alt={`Imagen de mantenimiento ${imageNumber}`}
                      width={120}
                      height={80}
                      className="w-full h-20 object-cover"
                      onError={(e) => {
                        // Fallback si la imagen no existe
                        const target = e.target as HTMLImageElement;
                        target.src = "/maintenance/default.jpg";
                      }}
                    />
                    {maintenanceImage === imageNumber && (
                      <div className="absolute inset-0 bg-[#2271B1]/20 flex items-center justify-center">
                        <div className="bg-[#2271B1] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                          ✓
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111111] mb-1">
                Título (opcional)
              </label>
              <input
                type="text"
                value={maintenanceTitle}
                onChange={(e) => setMaintenanceTitle(e.target.value)}
                disabled={maintenanceLoading}
                maxLength={100}
                className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                placeholder="Ej: Sistema en mantenimiento"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111111] mb-1">
                Subtítulo (opcional)
              </label>
              <textarea
                value={maintenanceSubtitle}
                onChange={(e) => setMaintenanceSubtitle(e.target.value)}
                disabled={maintenanceLoading}
                maxLength={200}
                rows={3}
                className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF] resize-none"
                placeholder="Ej: Estamos trabajando para mejorar tu experiencia. Volveremos pronto."
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={maintenanceActive}
                onChange={(e) => setMaintenanceActive(e.target.checked)}
                disabled={maintenanceLoading}
                className="checkbox checkbox-sm border-[#e1e1e1] checked:bg-[#222222] checked:border-[#222222]"
              />
              <span className="text-sm text-[#222222]">Sistema en mantenimiento</span>
            </label>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={maintenanceLoading}
                className="px-4 py-2 text-white bg-[#222222] rounded-none hover:bg-[#111111] transition-colors disabled:opacity-50 shadow-none"
              >
                {maintenanceLoading ? "Guardando..." : "Guardar estado"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationPage;
