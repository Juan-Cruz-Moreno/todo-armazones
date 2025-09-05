import { BulkPriceUpdateResponse } from "@/interfaces/product";
import { CheckCircle2, AlertTriangle } from "lucide-react";

interface BulkUpdateResultModalProps {
  result: BulkPriceUpdateResponse;
  onClose: () => void;
}

const BulkUpdateResultModal = ({ result, onClose }: BulkUpdateResultModalProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-green-50 border-b border-green-200 p-6">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
            <div>
              <h2 className="text-xl font-semibold text-green-800">
                Actualización Completada
              </h2>
              <p className="text-green-600 text-sm">
                Se han actualizado {result.totalVariantsUpdated} de {result.totalVariantsFound} variantes encontradas
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{result.totalVariantsFound}</div>
              <div className="text-sm text-blue-800">Encontradas</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{result.totalVariantsUpdated}</div>
              <div className="text-sm text-green-800">Actualizadas</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{result.totalVariantsSkipped}</div>
              <div className="text-sm text-yellow-800">Omitidas</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                ${result.summary.averagePriceIncrease.toFixed(2)}
              </div>
              <div className="text-sm text-purple-800">Incremento Promedio</div>
            </div>
          </div>

          {/* Updated Variants */}
          {result.updatedVariants.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Variantes Actualizadas ({result.updatedVariants.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto bg-gray-50 rounded-lg p-3">
                {result.updatedVariants.slice(0, 10).map((variant) => (
                  <div key={variant.id} className="flex justify-between items-center bg-white p-2 rounded text-sm">
                    <div>
                      <div className="font-medium">{variant.productModel}</div>
                      <div className="text-gray-500">{variant.sku} - {variant.color.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-red-600">${variant.oldPrice.toFixed(2)}</div>
                      <div className="text-green-600 font-medium">${variant.newPrice.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
                {result.updatedVariants.length > 10 && (
                  <div className="text-center text-gray-500 text-sm py-2">
                    y {result.updatedVariants.length - 10} más...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Skipped Variants */}
          {result.skippedVariants.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
                Variantes Omitidas ({result.skippedVariants.length})
              </h3>
              <div className="space-y-2 max-h-32 overflow-y-auto bg-yellow-50 rounded-lg p-3">
                {result.skippedVariants.slice(0, 5).map((variant) => (
                  <div key={variant.id} className="flex justify-between items-center bg-white p-2 rounded text-sm">
                    <div>
                      <div className="font-medium">{variant.productModel}</div>
                      <div className="text-gray-500">{variant.sku} - {variant.color.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-yellow-600">
                        ${variant.newPrice.toFixed(2)} (fuera de límites)
                      </div>
                    </div>
                  </div>
                ))}
                {result.skippedVariants.length > 5 && (
                  <div className="text-center text-yellow-600 text-sm py-2">
                    y {result.skippedVariants.length - 5} más...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-[#222222] text-white py-2 px-4 rounded-md font-medium hover:bg-[#333333] transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkUpdateResultModal;
