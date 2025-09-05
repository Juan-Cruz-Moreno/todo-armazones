"use client";

import React from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Package,
  TrendingUp,
  Users,
  BarChart3,
} from "lucide-react";
import { AnalyticsTabNavigation } from "@/components/analytics";

const AnalyticsPage = () => {
  const tabs = [
    {
      id: "orders",
      label: "Órdenes",
      icon: <ShoppingCart className="h-4 w-4" />,
      href: "/analytics/orders",
      description: "Analiza ventas, ingresos y performance de órdenes",
    },
    {
      id: "users",
      label: "Usuarios",
      icon: <Users className="h-4 w-4" />,
      href: "/analytics/users",
      description: "Revisa métricas y comportamiento de usuarios",
    },
    {
      id: "stock",
      label: "Stock",
      icon: <Package className="h-4 w-4" />,
      href: "/analytics/stock",
      description: "Analytics de inventario y valuación de stock",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <BarChart3 className="h-12 w-12 text-blue-600" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Analytics</h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Analiza el rendimiento de tu negocio con datos en tiempo real.
              Obtén insights valiosos sobre ventas, usuarios y productos.
            </p>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-6 sm:mb-8">
          <AnalyticsTabNavigation tabs={tabs} />
        </div>

        {/* Main Content - Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Orders Analytics Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow group cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <ShoppingCart className="h-8 w-8 text-blue-600" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Analytics de Órdenes
            </h3>
            <p className="text-gray-600 mb-4">
              Monitorea ventas, ingresos, número de órdenes y métricas de
              performance en tiempo real.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Ventas brutas y netas</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Comparación temporal</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Gráficos interactivos</span>
              </div>
            </div>
          </div>

          {/* Users Analytics Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow group cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Analytics de Usuarios
            </h3>
            <p className="text-gray-600 mb-4">
              Analiza el comportamiento y performance individual de cada usuario
              registrado.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Lista de usuarios con métricas</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Analytics detalladas por usuario</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Revenue y órdenes por usuario</span>
              </div>
            </div>
          </div>

          {/* Stock Analytics Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow group cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <Package className="h-8 w-8 text-green-600" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Analytics de Stock
            </h3>
            <p className="text-gray-600 mb-4">
              Monitorea la valuación de tu inventario y gestiona el stock de
              manera eficiente.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Valuación al costo y retail</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Alertas de stock bajo</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Analytics por categoría</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-12 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Acceso Rápido
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/analytics/orders"
              className="flex items-center justify-between p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">
                  Ver Analytics de Órdenes
                </span>
              </div>
              <TrendingUp className="h-4 w-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/analytics/users"
              className="flex items-center justify-between p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-purple-900">
                  Ver Analytics de Usuarios
                </span>
              </div>
              <TrendingUp className="h-4 w-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/analytics/stock"
              className="flex items-center justify-between p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <Package className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-900">
                  Ver Analytics de Stock
                </span>
              </div>
              <TrendingUp className="h-4 w-4 text-green-600 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Los datos se actualizan en tiempo real y reflejan la actividad más
            reciente de tu plataforma.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
