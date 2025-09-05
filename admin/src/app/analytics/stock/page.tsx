"use client";

import React, { useState } from "react";
import {
  Package,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  RefreshCw,
  Grid3X3,
  ShoppingBag,
  ShoppingCart,
  Users,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { AnalyticsTabNavigation } from "@/components/analytics";
import { useStockAnalytics } from "@/hooks/useStockAnalytics";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { ProductStockAnalyticsDto, ProductVariantDto } from "@/interfaces/analytics";

// Componente para una fila de producto con ref forwarding
const ProductRow = React.forwardRef<HTMLTableRowElement, {
  product: ProductStockAnalyticsDto;
  formatCurrency: (value: number) => string;
  formatNumber: (value: number) => string;
  getStockBadgeColor: (stock: number) => string;
}>(({ product, formatCurrency, formatNumber, getStockBadgeColor }, ref) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <tr ref={ref} className="hover:bg-gray-50">
        <td className="px-6 py-4 w-1/4 min-w-0">
          <div className="flex items-start">
            <div className="min-w-0 flex-1">
              <div 
                className="text-sm font-medium text-gray-900 break-words cursor-help"
                title={product.productModel}
              >
                {product.productModel}
              </div>
              <div 
                className="text-sm text-gray-500 truncate cursor-help"
                title={product.sku}
              >
                {product.sku}
              </div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap w-1/6">
          <div className="text-sm text-gray-900">{formatNumber(product.totalStock)}</div>
          <div className="text-sm text-gray-500">{product.variants.length} variantes</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap w-1/6">
          <div className="text-sm font-medium text-gray-900">
            {formatCurrency(product.totalValuationAtCost)}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap w-1/6">
          <div className="text-sm font-medium text-gray-900">
            {formatCurrency(product.totalValuationAtRetail)}
          </div>
        </td>
        <td className="px-6 py-4 w-1/6">
          <div className="flex flex-wrap gap-1">
            {product.variants.slice(0, 3).map((variant: ProductVariantDto) => (
              <div key={variant.variantId} className="flex items-center space-x-1 mb-1">
                <div 
                  className="w-3 h-3 rounded-full border flex-shrink-0"
                  style={{ backgroundColor: variant.color.hex }}
                />
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStockBadgeColor(variant.stock)}`}>
                  {variant.stock}
                </span>
              </div>
            ))}
            {product.variants.length > 3 && (
              <span className="text-xs text-gray-400">+{product.variants.length - 3}</span>
            )}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium w-1/6">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-indigo-600 hover:text-indigo-900 flex items-center space-x-1"
          >
            <Eye className="h-4 w-4" />
            <span>Ver detalles</span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </td>
      </tr>
      
      {/* Expanded row with variant details */}
      {isExpanded && (
        <tr className="bg-gray-50">
          <td colSpan={6} className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {product.variants.map((variant: ProductVariantDto) => (
                <div key={variant.variantId} className="bg-white rounded-lg p-4 border">
                  <div className="flex items-center space-x-3 mb-2">
                    <div 
                      className="w-4 h-4 rounded-full border-2"
                      style={{ backgroundColor: variant.color.hex }}
                    />
                    <span className="font-medium text-gray-900">{variant.color.name}</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Stock:</span>
                      <span className={`font-medium ${variant.stock <= 5 ? 'text-red-600' : variant.stock <= 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {variant.stock} unidades
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Costo:</span>
                      <span className="font-medium">{formatCurrency(variant.averageCostUSD)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Precio:</span>
                      <span className="font-medium">{formatCurrency(variant.priceUSD)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1">
                      <span className="text-gray-500">Valuación:</span>
                      <span className="font-medium">{formatCurrency(variant.valuationAtRetail)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
});

ProductRow.displayName = 'ProductRow';

const StockAnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState("overview");

  // Usar el hook de stock analytics
  const {
    // Datos
    stockValuation,
    productAnalytics,
    lowStockAlerts,
    categoryAnalytics,
    subcategoryAnalytics,
    categorySubcategoryAnalytics,

    // Estados de carga
    isLoadingAny,
    isLoadingValuation,
    isLoadingProductAnalytics,
    isLoadingLowStockAlerts,
    isLoadingCategoryAnalytics,
    isLoadingSubcategoryAnalytics,
    isLoadingCategorySubcategoryAnalytics,

    // Propiedades de paginación
    hasMoreProducts,
    
    // Funciones
    refreshAllStockData,
    loadMoreProductAnalytics,
    clearProductData,

    // Helpers
    formatCurrency,
    formatNumber,
    getStockBadgeColor,
  } = useStockAnalytics();

  // Función para cargar más productos (compatible con useInfiniteScroll)
  const handleLoadMoreProducts = async () => {
    try {
      await loadMoreProductAnalytics();
    } catch (error) {
      console.error('Error loading more products:', error);
    }
  };

  // Limpiar datos cuando se cambie de tab
  const handleTabChange = (newTab: string) => {
    if (activeTab === 'products' && newTab !== 'products') {
      // Al salir del tab de productos, limpiar datos para evitar acumulación
      clearProductData();
    }
    setActiveTab(newTab);
  };

  // Hook para scroll infinito de productos
  const { lastElementRef } = useInfiniteScroll<HTMLTableRowElement>({
    hasMore: hasMoreProducts,
    isLoading: isLoadingProductAnalytics,
    onLoadMore: handleLoadMoreProducts,
    threshold: 200,
    debounceMs: 300,
  });

  const tabs = [
    {
      id: "orders",
      label: "Órdenes",
      icon: <ShoppingCart className="h-4 w-4" />,
      href: "/analytics/orders",
    },
    {
      id: "users",
      label: "Usuarios",
      icon: <Users className="h-4 w-4" />,
      href: "/analytics/users",
    },
    {
      id: "stock",
      label: "Stock",
      icon: <Package className="h-4 w-4" />,
      href: "/analytics/stock",
    },
  ];

  const handleRefresh = async () => {
    await refreshAllStockData();
  };

  const StockBadge = ({ stock, className = "" }: { stock: number; className?: string }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockBadgeColor(stock)} ${className}`}>
      {stock} unidades
    </span>
  );

  const MetricCard = ({ title, value, subtitle, icon }: { 
    title: string; 
    value: string; 
    subtitle: string; 
    icon: React.ReactNode;
  }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className="text-gray-400">{icon}</div>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center space-x-2">
                <Package className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                <span>Analytics de Stock</span>
              </h1>
              <p className="text-gray-600 mt-1 sm:mt-2">
                Monitorea la valuación de tu inventario y gestiona el stock de manera eficiente
              </p>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={isLoadingAny}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingAny ? "animate-spin" : ""}`} />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-6 sm:mb-8">
          <AnalyticsTabNavigation tabs={tabs} />
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { id: "overview", label: "Resumen" },
              { id: "products", label: "Productos" },
              { id: "alerts", label: "Alertas" },
              { id: "categories", label: "Categorías" },
              { id: "subcategories", label: "Subcategorías" },
              { id: "hierarchical", label: "Vista Jerárquica" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content based on active tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Items"
                value={isLoadingValuation 
                  ? "..."
                  : formatNumber(stockValuation?.totalItems || 0)
                }
                subtitle="Unidades en stock"
                icon={<Package className="h-4 w-4 text-gray-400" />}
              />

              <MetricCard
                title="Valuación al Costo"
                value={isLoadingValuation 
                  ? "..."
                  : formatCurrency(stockValuation?.totalValuationAtCost || 0)
                }
                subtitle="Valor total del inventario"
                icon={<DollarSign className="h-4 w-4 text-gray-400" />}
              />

              <MetricCard
                title="Valuación al Retail"
                value={isLoadingValuation 
                  ? "..."
                  : formatCurrency(stockValuation?.totalValuationAtRetail || 0)
                }
                subtitle="Valor potencial de venta"
                icon={<TrendingUp className="h-4 w-4 text-gray-400" />}
              />

              <MetricCard
                title="Margen de Ganancia"
                value={isLoadingValuation 
                  ? "..."
                  : `${stockValuation?.profitMarginPercentage?.toFixed(1) || 0}%`
                }
                subtitle={formatCurrency(stockValuation?.profitMarginTotal || 0) + " de ganancia"}
                icon={<BarChart3 className="h-4 w-4 text-gray-400" />}
              />
            </div>

            {/* Low Stock Alerts */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <h2 className="text-lg font-medium text-gray-900">Alertas de Stock Bajo</h2>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {lowStockAlerts?.length || 0}
                  </span>
                </div>
              </div>
              <div className="p-6">
                {isLoadingLowStockAlerts ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">Cargando alertas...</p>
                  </div>
                ) : lowStockAlerts?.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">¡Excelente! No hay productos con stock bajo</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {lowStockAlerts?.slice(0, 5).map((alert) => (
                      <div key={alert.variantId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div 
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: alert.color.hex }}
                          />
                          <div>
                            <p className="font-medium text-gray-900">{alert.productModel}</p>
                            <p className="text-sm text-gray-500">
                              {alert.sku} - {alert.color.name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <StockBadge stock={alert.stock} className="mb-2" />
                          <p className="text-sm text-gray-500">
                            {formatCurrency(alert.priceUSD)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "products" && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Grid3X3 className="h-5 w-5 text-gray-400" />
                  <h2 className="text-lg font-medium text-gray-900">Analytics por Producto</h2>
                </div>
                <p className="text-sm text-gray-500">
                  {productAnalytics.length} productos cargados
                  {hasMoreProducts && " · Scroll para cargar más"}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                      Stock Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                      Valuación Costo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                      Valuación Retail
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                      Variantes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {productAnalytics.map((product, index) => {
                    // Debug: verificar duplicados en desarrollo
                    if (process.env.NODE_ENV === 'development') {
                      const duplicates = productAnalytics.filter(p => p.productId === product.productId);
                      if (duplicates.length > 1) {
                        console.warn('Duplicate product found:', product.productId, duplicates);
                      }
                    }
                    
                    return (
                      <ProductRow 
                        key={`${product.productId}-${index}`} // Usar índice como fallback para evitar duplicados
                        product={product}
                        formatCurrency={formatCurrency}
                        formatNumber={formatNumber}
                        getStockBadgeColor={getStockBadgeColor}
                        ref={index === productAnalytics.length - 1 ? lastElementRef : null}
                      />
                    );
                  })}
                </tbody>
              </table>

              {/* Loading indicator */}
              {isLoadingProductAnalytics && (
                <div className="flex items-center justify-center py-8 border-t border-gray-200">
                  <RefreshCw className="h-5 w-5 animate-spin mr-2 text-gray-400" />
                  <span className="text-sm text-gray-500">Cargando más productos...</span>
                </div>
              )}

              {/* No more data indicator */}
              {!hasMoreProducts && productAnalytics.length > 0 && (
                <div className="text-center py-8 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    No hay más productos para mostrar
                  </p>
                </div>
              )}

              {/* Empty state */}
              {productAnalytics.length === 0 && !isLoadingProductAnalytics && (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium text-gray-900 mb-2">No hay productos</p>
                  <p className="text-gray-500">
                    No se encontraron productos con stock disponible
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "alerts" && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <h2 className="text-lg font-medium text-gray-900">Alertas de Stock Bajo</h2>
              </div>
            </div>
            <div className="p-6">
              {isLoadingLowStockAlerts ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Cargando alertas...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lowStockAlerts?.map((alert) => (
                    <div key={alert.variantId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div 
                            className="w-6 h-6 rounded-full border"
                            style={{ backgroundColor: alert.color.hex }}
                          />
                          <div>
                            <h3 className="font-semibold text-gray-900">{alert.productModel}</h3>
                            <p className="text-gray-500">{alert.sku} - {alert.color.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <StockBadge stock={alert.stock} className="mb-2" />
                          <div className="space-y-1">
                            <p className="text-sm text-gray-600">Costo: {formatCurrency(alert.averageCostUSD)}</p>
                            <p className="text-sm text-gray-600">Precio: {formatCurrency(alert.priceUSD)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "categories" && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-medium text-gray-900">Analytics por Categoría</h2>
              </div>
            </div>
            <div className="p-6">
              {isLoadingCategoryAnalytics ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Cargando categorías...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {categoryAnalytics?.map((category) => (
                    <div key={category.categoryId} className="border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4 text-gray-900">{category.categoryName}</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Stock Total</p>
                          <p className="font-semibold text-gray-900">{formatNumber(category.totalStock)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Productos</p>
                          <p className="font-semibold text-gray-900">{category.productCount}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Valuación Costo</p>
                          <p className="font-semibold text-gray-900">{formatCurrency(category.totalValuationAtCost)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Valuación Retail</p>
                          <p className="font-semibold text-gray-900">{formatCurrency(category.totalValuationAtRetail)}</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Margen de ganancia</span>
                          <span className="font-semibold text-green-600">
                            {category.totalValuationAtCost > 0 
                              ? `${(((category.totalValuationAtRetail - category.totalValuationAtCost) / category.totalValuationAtCost) * 100).toFixed(1)}%`
                              : '0%'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "subcategories" && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Grid3X3 className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-medium text-gray-900">Analytics por Subcategoría</h2>
              </div>
            </div>
            <div className="p-6">
              {isLoadingSubcategoryAnalytics ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Cargando subcategorías...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {subcategoryAnalytics?.map((subcategory) => (
                    <div key={subcategory.subcategoryId} className="border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4 text-gray-900">{subcategory.subcategoryName}</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Stock Total</p>
                          <p className="font-semibold text-gray-900">{formatNumber(subcategory.totalStock)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Productos</p>
                          <p className="font-semibold text-gray-900">{subcategory.productCount}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Variantes</p>
                          <p className="font-semibold text-gray-900">{subcategory.variantCount}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Valuación Costo</p>
                          <p className="font-semibold text-gray-900">{formatCurrency(subcategory.totalValuationAtCost)}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-sm text-gray-500">Valuación Retail</p>
                          <p className="font-semibold text-gray-900">{formatCurrency(subcategory.totalValuationAtRetail)}</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Margen de ganancia</span>
                          <span className="font-semibold text-green-600">
                            {subcategory.totalValuationAtCost > 0 
                              ? `${(((subcategory.totalValuationAtRetail - subcategory.totalValuationAtCost) / subcategory.totalValuationAtCost) * 100).toFixed(1)}%`
                              : '0%'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "hierarchical" && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-medium text-gray-900">Vista Jerárquica: Categorías con Subcategorías</h2>
              </div>
            </div>
            <div className="p-6">
              {isLoadingCategorySubcategoryAnalytics ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Cargando vista jerárquica...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {categorySubcategoryAnalytics?.map((categoryData) => (
                    <div key={categoryData.categoryId} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Category Header */}
                      <div className="bg-blue-50 px-6 py-4 border-b border-gray-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{categoryData.categoryName}</h3>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                              <span className="flex items-center space-x-1">
                                <Package className="h-4 w-4" />
                                <span>{categoryData.categoryTotals.productCount} productos</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Grid3X3 className="h-4 w-4" />
                                <span>{categoryData.categoryTotals.variantCount} variantes</span>
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">
                              {formatCurrency(categoryData.categoryTotals.totalValuationAtRetail)}
                            </div>
                            <div className="text-sm text-gray-600">
                              {formatNumber(categoryData.categoryTotals.totalStock)} unidades en stock
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              Costo: {formatCurrency(categoryData.categoryTotals.totalValuationAtCost)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Subcategories Grid */}
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {categoryData.subcategories.map((subcategory) => (
                            <div key={subcategory.subcategoryId} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-gray-900">{subcategory.subcategoryName}</h4>
                                <div className="text-xs text-gray-500">
                                  {subcategory.productCount}P • {subcategory.variantCount}V
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">Stock:</span>
                                  <span className="font-medium text-gray-900">{formatNumber(subcategory.totalStock)}</span>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">Valuación:</span>
                                  <span className="font-medium text-gray-900">{formatCurrency(subcategory.totalValuationAtRetail)}</span>
                                </div>
                                
                                <div className="pt-2 mt-2 border-t border-gray-200">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500">Margen:</span>
                                    <span className="text-xs font-medium text-green-600">
                                      {subcategory.totalValuationAtCost > 0 
                                        ? `${(((subcategory.totalValuationAtRetail - subcategory.totalValuationAtCost) / subcategory.totalValuationAtCost) * 100).toFixed(1)}%`
                                        : '0%'
                                      }
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Category Summary */}
                        <div className="mt-6 pt-4 border-t border-gray-200">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div>
                              <p className="text-2xl font-bold text-blue-600">{formatNumber(categoryData.categoryTotals.totalStock)}</p>
                              <p className="text-sm text-gray-500">Total Stock</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-green-600">{formatCurrency(categoryData.categoryTotals.totalValuationAtRetail)}</p>
                              <p className="text-sm text-gray-500">Valuación Retail</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-purple-600">{categoryData.categoryTotals.productCount}</p>
                              <p className="text-sm text-gray-500">Productos</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-orange-600">
                                {categoryData.categoryTotals.totalValuationAtCost > 0 
                                  ? `${(((categoryData.categoryTotals.totalValuationAtRetail - categoryData.categoryTotals.totalValuationAtCost) / categoryData.categoryTotals.totalValuationAtCost) * 100).toFixed(1)}%`
                                  : '0%'
                                }
                              </p>
                              <p className="text-sm text-gray-500">Margen Promedio</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockAnalyticsPage;
