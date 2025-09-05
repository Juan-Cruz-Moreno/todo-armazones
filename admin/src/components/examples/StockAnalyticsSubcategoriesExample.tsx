// Ejemplo de implementación de las nuevas funcionalidades de analytics de stock
// Este archivo muestra cómo usar las nuevas funciones en un componente

import React, { useState } from 'react';
import { useStockAnalytics } from '@/hooks/useStockAnalytics';

const StockAnalyticsSubcategoriesExample = () => {
  const [activeView, setActiveView] = useState<'categories' | 'subcategories' | 'hierarchical'>('categories');

  const {
    // Datos existentes
    categoryAnalytics,
    
    // Nuevos datos
    subcategoryAnalytics,
    categorySubcategoryAnalytics,

    // Estados de carga
    isLoadingCategoryAnalytics,
    isLoadingSubcategoryAnalytics,
    isLoadingCategorySubcategoryAnalytics,

    // Nuevas funciones
    refreshSubcategoryAnalytics,
    refreshCategorySubcategoryAnalytics,

    // Helpers
    formatCurrency,
    formatNumber,
  } = useStockAnalytics();

  const handleRefresh = async () => {
    switch (activeView) {
      case 'subcategories':
        await refreshSubcategoryAnalytics();
        break;
      case 'hierarchical':
        await refreshCategorySubcategoryAnalytics();
        break;
      default:
        // La función existente para categorías ya se maneja en el componente principal
        break;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header with view switcher */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Analytics de Stock por Categorías</h2>
          
          {/* View Switcher */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveView('categories')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                activeView === 'categories'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Categorías
            </button>
            <button
              onClick={() => setActiveView('subcategories')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                activeView === 'subcategories'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Subcategorías
            </button>
            <button
              onClick={() => setActiveView('hierarchical')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                activeView === 'hierarchical'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Vista Jerárquica
            </button>
          </div>

          <button
            onClick={handleRefresh}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-md hover:bg-gray-100"
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Categories View (existing) */}
        {activeView === 'categories' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isLoadingCategoryAnalytics ? (
              <div className="col-span-2 text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Cargando analytics por categoría...</p>
              </div>
            ) : (
              categoryAnalytics?.map((category) => (
                <div key={category.categoryId} className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{category.categoryName}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Stock Total:</span>
                      <span className="font-medium">{formatNumber(category.totalStock)} unidades</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valuación Retail:</span>
                      <span className="font-medium">{formatCurrency(category.totalValuationAtRetail)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Productos:</span>
                      <span className="font-medium">{category.productCount}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Subcategories View (NEW) */}
        {activeView === 'subcategories' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isLoadingSubcategoryAnalytics ? (
              <div className="col-span-2 text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Cargando analytics por subcategoría...</p>
              </div>
            ) : (
              subcategoryAnalytics?.map((subcategory) => (
                <div key={subcategory.subcategoryId} className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{subcategory.subcategoryName}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Stock Total:</span>
                      <span className="font-medium">{formatNumber(subcategory.totalStock)} unidades</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valuación Retail:</span>
                      <span className="font-medium">{formatCurrency(subcategory.totalValuationAtRetail)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Productos:</span>
                      <span className="font-medium">{subcategory.productCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Variantes:</span>
                      <span className="font-medium">{subcategory.variantCount}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Hierarchical View (NEW) */}
        {activeView === 'hierarchical' && (
          <div className="space-y-6">
            {isLoadingCategorySubcategoryAnalytics ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Cargando vista jerárquica...</p>
              </div>
            ) : (
              categorySubcategoryAnalytics?.map((categoryData) => (
                <div key={categoryData.categoryId} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Category Header */}
                  <div className="bg-blue-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{categoryData.categoryName}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {categoryData.categoryTotals.productCount} productos • {categoryData.categoryTotals.variantCount} variantes
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {formatCurrency(categoryData.categoryTotals.totalValuationAtRetail)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatNumber(categoryData.categoryTotals.totalStock)} unidades
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Subcategories */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryData.subcategories.map((subcategory) => (
                        <div key={subcategory.subcategoryId} className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3">{subcategory.subcategoryName}</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Stock:</span>
                              <span className="font-medium">{formatNumber(subcategory.totalStock)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Valuación:</span>
                              <span className="font-medium">{formatCurrency(subcategory.totalValuationAtRetail)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Productos:</span>
                              <span className="font-medium">{subcategory.productCount}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StockAnalyticsSubcategoriesExample;
