"use client";

import { useEffect, useMemo, useState } from "react";
import { useDollar } from "@/hooks/useDollar";
import { formatCurrency } from "@/utils/formatCurrency";

const ConfigurationPage = () => {
  const { dollar, loading, error, updateConfig, forceUpdateDollarValue } =
    useDollar();

  const [addedValue, setAddedValue] = useState<number | "">(0);
  const [isPercentage, setIsPercentage] = useState<boolean>(false);

  useEffect(() => {
    if (dollar) {
      setAddedValue(dollar.addedValue ?? 0);
      setIsPercentage(Boolean(dollar.isPercentage));
    }
  }, [dollar]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({ addedValue: Number(addedValue) || 0, isPercentage });
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
      </div>
    </div>
  );
};

export default ConfigurationPage;
