"use client";

import React, { useState } from "react";
import { OrderItem } from "@/interfaces/order";

interface EditItemPricesModalProps {
  item: OrderItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    productVariantId: string,
    data: {
      action: "update_prices" | "update_all";
      costUSDAtPurchase?: number;
      priceUSDAtPurchase?: number;
      subTotal?: number;
      contributionMarginUSD?: number;
      quantity?: number;
    }
  ) => Promise<void>;
  loading?: boolean;
}

const EditItemPricesModal: React.FC<EditItemPricesModalProps> = ({
  item,
  isOpen,
  onClose,
  onSave,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    costUSDAtPurchase: item.costUSDAtPurchase,
    priceUSDAtPurchase: item.priceUSDAtPurchase,
    subTotal: item.subTotal,
    contributionMarginUSD: item.contributionMarginUSD,
    quantity: item.quantity,
  });

  const [editMode, setEditMode] = useState<"prices" | "all">("prices");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value) || 0;
    
    setFormData(prev => {
      const updated = { ...prev, [name]: numValue };
      
      // Auto-calculate values when in "prices" mode
      if (editMode === "prices" && (name === "costUSDAtPurchase" || name === "priceUSDAtPurchase" || name === "quantity")) {
        updated.subTotal = updated.priceUSDAtPurchase * updated.quantity;
        updated.contributionMarginUSD = (updated.priceUSDAtPurchase - updated.costUSDAtPurchase) * updated.quantity;
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editMode === "prices") {
      // Solo enviar precios, dejar que el backend calcule subTotal y contributionMarginUSD
      await onSave(item.productVariant.id, {
        action: "update_prices",
        costUSDAtPurchase: formData.costUSDAtPurchase,
        priceUSDAtPurchase: formData.priceUSDAtPurchase,
      });
    } else {
      // Enviar todos los campos como override manual
      await onSave(item.productVariant.id, {
        action: "update_all",
        quantity: formData.quantity,
        costUSDAtPurchase: formData.costUSDAtPurchase,
        priceUSDAtPurchase: formData.priceUSDAtPurchase,
        subTotal: formData.subTotal,
        contributionMarginUSD: formData.contributionMarginUSD,
      });
    }
    
    onClose();
  };

  const resetForm = () => {
    setFormData({
      costUSDAtPurchase: item.costUSDAtPurchase,
      priceUSDAtPurchase: item.priceUSDAtPurchase,
      subTotal: item.subTotal,
      contributionMarginUSD: item.contributionMarginUSD,
      quantity: item.quantity,
    });
  };

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box w-full max-w-md rounded-none border border-[#e1e1e1] bg-[#FFFFFF] text-[#222222] p-0 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#FFFFFF] border-b border-[#e1e1e1] flex justify-between items-center h-12 z-30">
          <h3 className="font-bold text-lg text-[#111111] m-0 px-4">
            Editar Precios - {item.productVariant.product.productModel} {item.productVariant.product.sku}
          </h3>
          <button
            className="btn btn-sm bg-transparent text-[#333333] hover:text-[#111111] shadow-none h-full w-12 border-l border-[#e1e1e1] border-t-0 border-r-0 border-b-0 m-0"
            onClick={onClose}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <p className="text-sm text-[#333333]">
              <strong className="text-[#111111]">SKU:</strong> {item.productVariant.product.sku}
            </p>
            <p className="text-sm text-[#333333]">
              <strong className="text-[#111111]">Color:</strong> {item.productVariant.color.name}
            </p>
          </div>

        {/* Mode Toggle */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#111111] mb-2">
            Modo de Edición
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="editMode"
                value="prices"
                checked={editMode === "prices"}
                onChange={(e) => setEditMode(e.target.value as "prices" | "all")}
                className="mr-2 text-[#2271B1]"
              />
              <span className="text-sm text-[#333333]">Solo Precios (Auto-cálculo)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="editMode"
                value="all"
                checked={editMode === "all"}
                onChange={(e) => setEditMode(e.target.value as "prices" | "all")}
                className="mr-2 text-[#2271B1]"
              />
              <span className="text-sm text-[#333333]">Manual Completo</span>
            </label>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quantity - solo en modo all */}
          {editMode === "all" && (
            <div>
              <label className="block text-sm font-medium text-[#111111] mb-1">
                Cantidad
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                min="1"
                step="1"
                className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                required
              />
            </div>
          )}

          {/* Cost USD */}
          <div>
            <label className="block text-sm font-medium text-[#111111] mb-1">
              Costo USD
            </label>
            <input
              type="number"
              name="costUSDAtPurchase"
              value={formData.costUSDAtPurchase}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
              required
            />
          </div>

          {/* Price USD */}
          <div>
            <label className="block text-sm font-medium text-[#111111] mb-1">
              Precio USD
            </label>
            <input
              type="number"
              name="priceUSDAtPurchase"
              value={formData.priceUSDAtPurchase}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
              required
            />
          </div>

          {/* Manual fields - solo en modo all */}
          {editMode === "all" && (
            <>
              <div>
                <label className="block text-sm font-medium text-[#111111] mb-1">
                  Subtotal (Manual)
                </label>
                <input
                  type="number"
                  name="subTotal"
                  value={formData.subTotal}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111111] mb-1">
                  Contribución Marginal (Manual)
                </label>
                <input
                  type="number"
                  name="contributionMarginUSD"
                  value={formData.contributionMarginUSD}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                />
              </div>
            </>
          )}

          {/* Preview values */}
          <div className="bg-[#f8f9fa] p-3 rounded-none border border-[#e1e1e1]">
            <h4 className="text-sm font-medium text-[#111111] mb-2">Vista Previa:</h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-[#333333]">
              <div>Cantidad: {formData.quantity}</div>
              <div>Subtotal: ${formData.subTotal.toFixed(2)}</div>
              <div>Contribución Marginal: ${formData.contributionMarginUSD.toFixed(2)}</div>
              <div>Margen: {formData.priceUSDAtPurchase > 0 ? 
                ((formData.contributionMarginUSD / (formData.priceUSDAtPurchase * formData.quantity)) * 100).toFixed(1) : 0}%
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 px-4 py-2 text-[#333333] bg-[#f1f1f1] rounded-none hover:bg-[#e1e1e1] transition-colors border border-[#e1e1e1]"
              disabled={loading}
            >
              Resetear
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-[#333333] bg-[#f1f1f1] rounded-none hover:bg-[#e1e1e1] transition-colors border border-[#e1e1e1]"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-white bg-[#222222] rounded-none hover:bg-[#111111] transition-colors disabled:opacity-50 shadow-none"
              disabled={loading}
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
        </div>
      </div>
    </dialog>
  );
};

export default EditItemPricesModal;
