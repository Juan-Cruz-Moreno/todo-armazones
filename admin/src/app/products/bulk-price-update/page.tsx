"use client";

import { useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import {
  BulkPriceUpdatePayload,
  PriceUpdateType,
  BulkPriceUpdateResponse,
} from "@/interfaces/product";
import { DollarSign, Percent, Target, AlertCircle, CheckCircle2 } from "lucide-react";

// Categorías y subcategorías (mismas que en CreateProductPage)
const categories = [
  { id: "687817781dd5819a2483c7eb", name: "Hombres" },
  { id: "6878179f1dd5819a2483c7ed", name: "Mujeres" },
  { id: "687817d71dd5819a2483c7ef", name: "Niños" },
];

const subcategories = [
  { id: "687819d2cdda2752c527177b", name: "Anteojos de sol" },
  { id: "6878196acdda2752c5271779", name: "Armazón de receta" },
  { id: "68781a06cdda2752c527177d", name: "Clip on" },
];

const BulkPriceUpdatePage = () => {
  const { bulkUpdatePrices, bulkUpdateLoading, bulkUpdateError, clearBulkUpdateError } = useProducts();

  const [formData, setFormData] = useState<BulkPriceUpdatePayload>({
    categoryIds: [],
    subcategoryIds: [],
    updateType: PriceUpdateType.FIXED_AMOUNT,
    value: 0,
    minPrice: undefined,
    maxPrice: undefined,
  });

  const [result, setResult] = useState<BulkPriceUpdateResponse | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleCategoryChange = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }));
  };

  const handleSubcategoryChange = (subcategoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      subcategoryIds: prev.subcategoryIds?.includes(subcategoryId)
        ? prev.subcategoryIds.filter((id) => id !== subcategoryId)
        : [...(prev.subcategoryIds || []), subcategoryId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearBulkUpdateError();
    setShowResults(false);

    if (formData.categoryIds.length === 0) {
      alert("Debe seleccionar al menos una categoría");
      return;
    }

    try {
      const response = await bulkUpdatePrices(formData).unwrap();
      setResult(response);
      setShowResults(true);
    } catch (error) {
      console.error("Error en actualización masiva:", error);
    }
  };

  const getUpdateTypeIcon = (type: PriceUpdateType) => {
    switch (type) {
      case PriceUpdateType.FIXED_AMOUNT:
        return <DollarSign className="w-4 h-4" />;
      case PriceUpdateType.PERCENTAGE:
        return <Percent className="w-4 h-4" />;
      case PriceUpdateType.SET_PRICE:
        return <Target className="w-4 h-4" />;
    }
  };

  const getUpdateTypeDescription = (type: PriceUpdateType, value: number) => {
    switch (type) {
      case PriceUpdateType.FIXED_AMOUNT:
        return value >= 0 ? `+$${value} USD` : `$${value} USD`;
      case PriceUpdateType.PERCENTAGE:
        return value >= 0 ? `+${value}%` : `${value}%`;
      case PriceUpdateType.SET_PRICE:
        return `$${value} USD`;
    }
  };

  return (
    <div className="p-4 md:p-8 bg-[#f5f5f5] min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-[#111111] font-bold text-3xl mb-2">
          Actualización Masiva de Precios
        </h1>
        <div className="flex items-center justify-between">
          <p className="text-[#666666] mb-8">
            Actualiza los precios de múltiples productos por categoría o subcategoría
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulario */}
          <div className="bg-[#ffffff] rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-[#111111] mb-6">
              Configuración de Actualización
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Categorías */}
              <div>
                <label className="block text-sm font-medium text-[#333333] mb-3">
                  Categorías <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        formData.categoryIds.includes(category.id)
                          ? "bg-[#222222] text-white"
                          : "bg-gray-100 text-[#333333] hover:bg-gray-200"
                      }`}
                      onClick={() => handleCategoryChange(category.id)}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subcategorías */}
              <div>
                <label className="block text-sm font-medium text-[#333333] mb-3">
                  Subcategorías (opcional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {subcategories.map((subcategory) => (
                    <button
                      key={subcategory.id}
                      type="button"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        formData.subcategoryIds?.includes(subcategory.id)
                          ? "bg-[#222222] text-white"
                          : "bg-gray-100 text-[#333333] hover:bg-gray-200"
                      }`}
                      onClick={() => handleSubcategoryChange(subcategory.id)}
                    >
                      {subcategory.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tipo de actualización */}
              <div>
                <label className="block text-sm font-medium text-[#333333] mb-3">
                  Tipo de Actualización
                </label>
                <div className="space-y-2">
                  {Object.values(PriceUpdateType).map((type) => (
                    <label key={type} className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="updateType"
                        value={type}
                        checked={formData.updateType === type}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            updateType: e.target.value as PriceUpdateType,
                          }))
                        }
                        className="text-[#222222] focus:ring-[#222222]"
                      />
                      <div className="flex items-center space-x-2">
                        {getUpdateTypeIcon(type)}
                        <span className="text-sm text-[#333333]">
                          {type === PriceUpdateType.FIXED_AMOUNT && "Cantidad Fija (USD)"}
                          {type === PriceUpdateType.PERCENTAGE && "Porcentaje (%)"}
                          {type === PriceUpdateType.SET_PRICE && "Precio Fijo (USD)"}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Valor */}
              <div>
                <label className="block text-sm font-medium text-[#333333] mb-2">
                  Valor
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      value: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full p-3 border border-[#e1e1e1] rounded-md focus:outline-none focus:ring-2 focus:ring-[#222222]"
                  placeholder={
                    formData.updateType === PriceUpdateType.PERCENTAGE
                      ? "Ej: 5 para +5%, -10 para -10%"
                      : "Ej: 2.50"
                  }
                  required
                />
                <p className="text-xs text-[#666666] mt-1">
                  {formData.updateType === PriceUpdateType.FIXED_AMOUNT &&
                    "Valores positivos aumentan, negativos disminuyen"}
                  {formData.updateType === PriceUpdateType.PERCENTAGE &&
                    "Valores positivos aumentan, negativos disminuyen"}
                  {formData.updateType === PriceUpdateType.SET_PRICE &&
                    "Precio fijo que se aplicará a todas las variantes"}
                </p>
              </div>

              {/* Límites de precio */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#333333] mb-2">
                    Precio Mínimo (opcional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.minPrice || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        minPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                      }))
                    }
                    className="w-full p-3 border border-[#e1e1e1] rounded-md focus:outline-none focus:ring-2 focus:ring-[#222222]"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333333] mb-2">
                    Precio Máximo (opcional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.maxPrice || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        maxPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                      }))
                    }
                    className="w-full p-3 border border-[#e1e1e1] rounded-md focus:outline-none focus:ring-2 focus:ring-[#222222]"
                    placeholder="999.99"
                  />
                </div>
              </div>

              {/* Error */}
              {bulkUpdateError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <h4 className="text-red-800 font-medium">Error</h4>
                    <p className="text-red-700 text-sm mt-1">{bulkUpdateError}</p>
                  </div>
                </div>
              )}

              {/* Botón de submit */}
              <button
                type="submit"
                disabled={bulkUpdateLoading || formData.categoryIds.length === 0}
                className="w-full bg-[#222222] text-white py-3 px-4 rounded-md font-medium hover:bg-[#333333] focus:outline-none focus:ring-2 focus:ring-[#222222] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {bulkUpdateLoading ? "Actualizando..." : "Actualizar Precios"}
              </button>
            </form>
          </div>

          {/* Vista previa y resultados */}
          <div className="bg-[#ffffff] rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-[#111111] mb-6">
              {showResults ? "Resultados" : "Vista Previa"}
            </h2>

            {!showResults && (
              <div className="space-y-4">
                <div className="bg-[#f8fafc] rounded-lg p-4">
                  <h3 className="font-medium text-[#333333] mb-3">Configuración Actual</h3>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-[#666666]">Categorías:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {formData.categoryIds.map((catId) => {
                          const category = categories.find((c) => c.id === catId);
                          return (
                            <span
                              key={catId}
                              className="bg-[#222222] text-white px-2 py-1 rounded text-xs"
                            >
                              {category?.name}
                            </span>
                          );
                        })}
                        {formData.categoryIds.length === 0 && (
                          <span className="text-[#999999]">Ninguna seleccionada</span>
                        )}
                      </div>
                    </div>

                    {formData.subcategoryIds && formData.subcategoryIds.length > 0 && (
                      <div>
                        <span className="text-[#666666]">Subcategorías:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {formData.subcategoryIds.map((subId) => {
                            const subcategory = subcategories.find((s) => s.id === subId);
                            return (
                              <span
                                key={subId}
                                className="bg-[#666666] text-white px-2 py-1 rounded text-xs"
                              >
                                {subcategory?.name}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div>
                      <span className="text-[#666666]">Tipo de actualización:</span>
                      <div className="flex items-center space-x-2 mt-1">
                        {getUpdateTypeIcon(formData.updateType)}
                        <span className="text-[#333333]">{getUpdateTypeDescription(formData.updateType, formData.value)}</span>
                      </div>
                    </div>

                    {(formData.minPrice !== undefined || formData.maxPrice !== undefined) && (
                      <div>
                        <span className="text-[#666666]">Límites de precio:</span>
                        <span className="ml-2 text-[#333333]">
                          {formData.minPrice !== undefined && `Min: $${formData.minPrice}`}
                          {formData.minPrice !== undefined && formData.maxPrice !== undefined && " - "}
                          {formData.maxPrice !== undefined && `Max: $${formData.maxPrice}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="text-blue-800 font-medium">Información</h4>
                      <p className="text-blue-700 text-sm mt-1">
                        Esta operación actualizará los precios de todas las variantes de productos
                        que coincidan con los criterios seleccionados. La acción no se puede deshacer.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showResults && result && (
              <div className="space-y-6">
                {/* Resumen */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                    <h3 className="text-green-800 font-semibold">Actualización Completada</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-green-700 font-medium">Variantes encontradas:</span>
                      <span className="ml-2 text-green-800">{result.totalVariantsFound}</span>
                    </div>
                    <div>
                      <span className="text-green-700 font-medium">Variantes actualizadas:</span>
                      <span className="ml-2 text-green-800">{result.totalVariantsUpdated}</span>
                    </div>
                    <div>
                      <span className="text-green-700 font-medium">Variantes omitidas:</span>
                      <span className="ml-2 text-green-800">{result.totalVariantsSkipped}</span>
                    </div>
                    <div>
                      <span className="text-green-700 font-medium">Incremento promedio:</span>
                      <span className="ml-2 text-green-800">
                        ${result.summary.averagePriceIncrease.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Detalles de variantes actualizadas */}
                {result.updatedVariants.length > 0 && (
                  <div>
                    <h4 className="font-medium text-[#333333] mb-3">
                      Variantes Actualizadas ({result.updatedVariants.length})
                    </h4>
                    <div className="bg-[#f8fafc] rounded-lg max-h-64 overflow-y-auto">
                      {result.updatedVariants.slice(0, 10).map((variant) => (
                        <div
                          key={variant.id}
                          className="p-3 border-b border-gray-200 last:border-b-0"
                        >
                          <div className="text-sm">
                            <div className="font-medium text-[#333333]">
                              {variant.productModel} ({variant.sku})
                            </div>
                            <div className="text-[#666666]">
                              Color: {variant.color.name}
                            </div>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-red-600">
                                ${variant.oldPrice.toFixed(2)}
                              </span>
                              <span className="text-[#666666]">→</span>
                              <span className="text-green-600 font-medium">
                                ${variant.newPrice.toFixed(2)}
                              </span>
                              <span className="text-[#666666] text-xs">
                                ({variant.priceChangePercentage > 0 ? "+" : ""}
                                {variant.priceChangePercentage.toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {result.updatedVariants.length > 10 && (
                        <div className="p-3 text-center text-[#666666] text-sm">
                          y {result.updatedVariants.length - 10} más...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Variantes omitidas */}
                {result.skippedVariants.length > 0 && (
                  <div>
                    <h4 className="font-medium text-[#333333] mb-3">
                      Variantes Omitidas ({result.skippedVariants.length})
                    </h4>
                    <div className="bg-yellow-50 rounded-lg max-h-40 overflow-y-auto">
                      {result.skippedVariants.slice(0, 5).map((variant) => (
                        <div
                          key={variant.id}
                          className="p-3 border-b border-yellow-200 last:border-b-0"
                        >
                          <div className="text-sm">
                            <div className="font-medium text-[#333333]">
                              {variant.productModel} ({variant.sku}) - {variant.color.name}
                            </div>
                            <div className="text-yellow-700">
                              Precio resultante: ${variant.newPrice.toFixed(2)} (fuera de límites)
                            </div>
                          </div>
                        </div>
                      ))}
                      {result.skippedVariants.length > 5 && (
                        <div className="p-3 text-center text-yellow-700 text-sm">
                          y {result.skippedVariants.length - 5} más...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Botón para nueva actualización */}
                <button
                  onClick={() => {
                    setShowResults(false);
                    setResult(null);
                  }}
                  className="w-full bg-[#666666] text-white py-2 px-4 rounded-md font-medium hover:bg-[#777777] transition-colors"
                >
                  Nueva Actualización
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkPriceUpdatePage;
