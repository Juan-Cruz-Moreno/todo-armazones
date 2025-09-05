import React, { useState } from "react";
import { StockMovementReason } from "../../interfaces/inventory";
import type {
  CreateStockEntryPayload,
  CreateStockExitPayload,
} from "../../interfaces/inventory";

interface StockOperationFormsProps {
  productVariantId: string;
  currentStock: number;
  onCreateEntry: (payload: CreateStockEntryPayload) => Promise<boolean>;
  onCreateExit: (payload: CreateStockExitPayload) => Promise<boolean>;
  loading?: boolean;
}

export const StockOperationForms: React.FC<StockOperationFormsProps> = ({
  productVariantId,
  currentStock,
  onCreateEntry,
  onCreateExit,
  loading = false,
}) => {
  const [activeForm, setActiveForm] = useState<"entry" | "exit" | null>(null);

  // Estados para formulario de entrada
  const [entryData, setEntryData] = useState({
    quantity: "",
    unitCost: "",
    reason: StockMovementReason.PURCHASE,
    reference: "",
    notes: "",
  });

  // Estados para formulario de salida
  const [exitData, setExitData] = useState({
    quantity: "",
    reason: StockMovementReason.SALE,
    reference: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForms = () => {
    setEntryData({
      quantity: "",
      unitCost: "",
      reason: StockMovementReason.PURCHASE,
      reference: "",
      notes: "",
    });
    setExitData({
      quantity: "",
      reason: StockMovementReason.SALE,
      reference: "",
      notes: "",
    });
    setErrors({});
    setActiveForm(null);
  };

  const validateEntryForm = () => {
    const newErrors: Record<string, string> = {};
    const quantity = parseFloat(entryData.quantity);
    const unitCost = parseFloat(entryData.unitCost);
    const reason = entryData.reason;

    if (!entryData.quantity || quantity <= 0) {
      newErrors.quantity = "La cantidad debe ser mayor a 0";
    }

    // Solo requerir unitCost para PURCHASE e INITIAL_STOCK
    if (
      reason === StockMovementReason.PURCHASE ||
      reason === StockMovementReason.INITIAL_STOCK
    ) {
      if (!entryData.unitCost || unitCost <= 0) {
        newErrors.unitCost = "El costo unitario debe ser mayor a 0";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateExitForm = () => {
    const newErrors: Record<string, string> = {};

    if (!exitData.quantity || parseFloat(exitData.quantity) <= 0) {
      newErrors.quantity = "La cantidad debe ser mayor a 0";
    }

    if (parseFloat(exitData.quantity) > currentStock) {
      newErrors.quantity = `No hay suficiente stock (disponible: ${currentStock})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEntryForm()) return;

    const reason = entryData.reason;
    const payload: CreateStockEntryPayload = {
      productVariantId,
      quantity: parseFloat(entryData.quantity),
      reason,
      reference: entryData.reference || undefined,
      notes: entryData.notes || undefined,
    };
    // Solo incluir unitCost si es PURCHASE o INITIAL_STOCK y el valor es válido
    if (
      (reason === StockMovementReason.PURCHASE ||
        reason === StockMovementReason.INITIAL_STOCK) &&
      entryData.unitCost &&
      parseFloat(entryData.unitCost) > 0
    ) {
      payload.unitCost = parseFloat(entryData.unitCost);
    }

    const success = await onCreateEntry(payload);
    if (success) {
      resetForms();
    }
  };

  const handleExitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateExitForm()) return;

    const payload: CreateStockExitPayload = {
      productVariantId,
      quantity: parseFloat(exitData.quantity),
      reason: exitData.reason,
      reference: exitData.reference || undefined,
      notes: exitData.notes || undefined,
    };

    const success = await onCreateExit(payload);
    if (success) {
      resetForms();
    }
  };

  const getReasonOptions = (isEntry: boolean) => {
    if (isEntry) {
      return [
        { value: StockMovementReason.PURCHASE, label: "Compra" },
        { value: StockMovementReason.RETURN, label: "Devolución" },
        {
          value: StockMovementReason.INVENTORY_ADJUSTMENT,
          label: "Ajuste de Inventario",
        },
        { value: StockMovementReason.INITIAL_STOCK, label: "Stock Inicial" },
      ];
    } else {
      return [
        { value: StockMovementReason.SALE, label: "Venta" },
        { value: StockMovementReason.DAMAGE, label: "Daño" },
        { value: StockMovementReason.THEFT, label: "Robo" },
        {
          value: StockMovementReason.INVENTORY_ADJUSTMENT,
          label: "Ajuste de Inventario",
        },
      ];
    }
  };

  if (!activeForm) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Operaciones de Stock
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setActiveForm("entry")}
            className="flex items-center justify-center px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-700 hover:bg-green-100 transition-colors"
            disabled={loading}
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Entrada de Stock
          </button>

          <button
            onClick={() => setActiveForm("exit")}
            className="flex items-center justify-center px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 hover:bg-red-100 transition-colors"
            disabled={loading || currentStock === 0}
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 12H4"
              />
            </svg>
            Salida de Stock
          </button>
        </div>

        {currentStock === 0 && (
          <p className="text-sm text-yellow-600 mt-2 text-center">
            Sin stock disponible para salidas
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {activeForm === "entry" ? "Entrada de Stock" : "Salida de Stock"}
        </h3>
        <button
          onClick={resetForms}
          className="text-gray-500 hover:text-gray-700"
          disabled={loading}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {activeForm === "entry" ? (
        <form onSubmit={handleEntrySubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={entryData.quantity}
                onChange={(e) =>
                  setEntryData({ ...entryData, quantity: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                  errors.quantity ? "border-red-500" : "border-gray-300"
                }`}
                disabled={loading}
              />
              {errors.quantity && (
                <div className="text-xs text-red-600 mt-1">
                  {errors.quantity}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo
              </label>
              <select
                value={entryData.reason}
                onChange={(e) =>
                  setEntryData({
                    ...entryData,
                    reason: e.target.value as StockMovementReason,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                disabled={loading}
              >
                {getReasonOptions(true).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {(entryData.reason === StockMovementReason.PURCHASE ||
            entryData.reason === StockMovementReason.INITIAL_STOCK) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Costo Unitario (USD)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={entryData.unitCost}
                onChange={(e) =>
                  setEntryData({ ...entryData, unitCost: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                  errors.unitCost ? "border-red-500" : "border-gray-300"
                }`}
                disabled={loading}
              />
              {errors.unitCost && (
                <div className="text-xs text-red-600 mt-1">
                  {errors.unitCost}
                </div>
              )}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Referencia
            </label>
            <input
              type="text"
              value={entryData.reference}
              onChange={(e) =>
                setEntryData({ ...entryData, reference: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="Número de factura, orden de compra, etc."
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas
            </label>
            <textarea
              value={entryData.notes}
              onChange={(e) =>
                setEntryData({ ...entryData, notes: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="Información adicional..."
              disabled={loading}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="submit"
              className="btn bg-blue-600 text-white rounded-md py-2 px-4"
              disabled={loading}
            >
              Registrar Entrada
            </button>
            <button
              type="button"
              className="btn bg-gray-200 text-gray-700 rounded-md py-2 px-4"
              onClick={resetForms}
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleExitSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Cantidad *
            </label>
            <input
              type="number"
              min="1"
              max={currentStock}
              step="1"
              value={exitData.quantity}
              onChange={(e) =>
                setExitData({ ...exitData, quantity: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                errors.quantity ? "border-red-500" : "border-gray-300"
              }`}
              disabled={loading}
            />
            {errors.quantity && (
              <p className="text-red-600 text-xs mt-1">{errors.quantity}</p>
            )}
            <p className="text-gray-600 text-xs mt-1">
              Stock disponible: {currentStock}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Motivo *
            </label>
            <select
              value={exitData.reason}
              onChange={(e) =>
                setExitData({
                  ...exitData,
                  reason: e.target.value as StockMovementReason,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              disabled={loading}
            >
              {getReasonOptions(false).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Referencia
            </label>
            <input
              type="text"
              value={exitData.reference}
              onChange={(e) =>
                setExitData({ ...exitData, reference: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="Número de orden, incidente, etc."
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Notas
            </label>
            <textarea
              value={exitData.notes}
              onChange={(e) =>
                setExitData({ ...exitData, notes: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="Información adicional..."
              disabled={loading}
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={resetForms}
              className="px-4 py-2 text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Procesando..." : "Crear Salida"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
