import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { PriceAdjustment, Category, Subcategory } from '@/interfaces/catalog';

interface PriceAdjustmentsProps {
  priceAdjustments: PriceAdjustment[];
  categories: Category[];
  subcategories: Subcategory[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof PriceAdjustment, value: string | number) => void;
}

const PriceAdjustments: React.FC<PriceAdjustmentsProps> = ({
  priceAdjustments,
  categories,
  subcategories,
  onAdd,
  onRemove,
  onUpdate,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-[#222222] flex items-center gap-2">
          <span className="text-2xl">💰</span>
          ¡Aumenta tus ganancias con precios inteligentes!
        </h4>
      </div>

      <div className="text-sm text-[#666666] mb-4">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-100">
          <p className="mb-3 font-medium text-[#222222] flex items-center gap-2">
            <span className="text-lg">🎯</span>
            ¡Haz que cada venta cuente más!
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-1">✓</span>
              <span><strong>Preciso:</strong> Aplica incrementos a categorías específicas o combina categoría + subcategoría</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-1">✓</span>
              <span><strong>Flexible:</strong> Los ajustes más específicos tienen prioridad automática</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-1">✓</span>
              <span><strong>Lucrativo:</strong> 35% de incremento = $10 → $13.5 ¡Más ganancias por venta!</span>
            </li>
          </ul>
        </div>
      </div>

      {priceAdjustments.length === 0 ? (
        <div className="text-center py-12 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border-2 border-dashed border-yellow-200">
          <div className="max-w-md mx-auto">
            <div className="text-6xl mb-4">💸</div>
            <h3 className="text-xl font-bold text-[#222222] mb-3">
              ¡Oportunidad de Oro para Más Ganancias!
            </h3>
            <p className="text-[#666666] mb-4 leading-relaxed">
              Cada ajuste de precio que configures es una oportunidad para aumentar tus márgenes de ganancia.
              ¡No dejes dinero sobre la mesa!
            </p>
            <div className="bg-white p-4 rounded-lg border border-yellow-200 mb-4">
              <p className="text-sm text-[#666666] mb-2">
                <strong>Ejemplo real:</strong>
              </p>
              <div className="text-left">
                <p className="text-sm text-[#222222]">Producto: $10 (costo)</p>
                <p className="text-sm font-bold text-green-600">Con 35% markup: $13.5 (venta)</p>
                <p className="text-sm font-bold text-blue-600">¡Ganancia extra: $3.5 por unidad!</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onAdd}
              className="btn bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 border-none shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              ¡Crear mi primer ajuste! 🚀
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {priceAdjustments.map((adjustment, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <span className="font-semibold text-[#222222] text-lg">
                    Ajuste de Precio #{index + 1}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="btn btn-sm btn-circle btn-ghost text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors"
                  title="Eliminar ajuste"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Selector de Categoría */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#222222] mb-2">
                    <span className="text-lg">👥</span>
                    Categoría de Clientes
                  </label>
                  <select
                    value={adjustment.categoryId || ''}
                    onChange={(e) => onUpdate(index, 'categoryId', e.target.value)}
                    className="select select-bordered w-full text-sm bg-white border border-gray-300 text-[#222222] focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  >
                    <option value="">Seleccionar categoría</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selector de Subcategoría */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#222222] mb-2">
                    <span className="text-lg">📦</span>
                    Tipo de Producto
                  </label>
                  <select
                    value={adjustment.subcategoryId || ''}
                    onChange={(e) => onUpdate(index, 'subcategoryId', e.target.value)}
                    className="select select-bordered w-full text-sm bg-white border border-gray-300 text-[#222222] focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  >
                    <option value="">Aplicar a todos los productos</option>
                    {subcategories.map((subcategory) => (
                      <option key={subcategory.id} value={subcategory.id}>
                        {subcategory.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Input de Porcentaje */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#222222] mb-2">
                    <span className="text-lg">📈</span>
                    Incremento (%)
                  </label>
                  <input
                    type="number"
                    value={adjustment.percentageIncrease}
                    onChange={(e) =>
                      onUpdate(
                        index,
                        'percentageIncrease',
                        e.target.value
                      )
                    }
                    step="0.1"
                    className="input input-bordered w-full text-sm bg-white border border-gray-300 text-[#222222] focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                    placeholder="Ej: 35"
                  />
                </div>
              </div>

              {/* Validación visual */}
              {!adjustment.categoryId && !adjustment.subcategoryId && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200 mt-4">
                  <div className="flex items-center gap-2 text-yellow-800 mb-2">
                    <span className="text-lg">⚠️</span>
                    <span className="font-medium">
                      ¡Especifica a qué productos aplicar este ajuste!
                    </span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    Selecciona una categoría, subcategoría, o ambas para maximizar tus ganancias.
                    <span className="font-bold"> ¡Más específico = Más ganancias!</span>
                  </p>
                </div>
              )}

              {/* Información de prioridad cuando ambos están seleccionados */}
              {adjustment.categoryId && adjustment.subcategoryId && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 mt-4">
                  <div className="flex items-center gap-2 text-blue-800 mb-2">
                    <span className="text-lg">🎯</span>
                    <span className="font-semibold">
                      ¡Ajuste Ultra Preciso Activado!
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 mb-2">
                    Este incremento se aplicará <strong>SOLO</strong> a productos que pertenezcan exactamente a esta categoría Y subcategoría.
                  </p>
                  <div className="bg-blue-100 p-2 rounded text-xs text-blue-800">
                    💡 <strong>Máxima precisión = Máximas ganancias</strong>
                  </div>
                </div>
              )}
            </motion.div>
          ))}

          {/* Botón para agregar ajuste al final */}
          <div className="flex justify-center mt-6">
            <button
              type="button"
              onClick={onAdd}
              className="btn bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 border-none shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              Agregar Otro Ajuste
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceAdjustments;
