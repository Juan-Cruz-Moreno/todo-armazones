import React from 'react';
import Link from 'next/link';
import { 
  User, 
  Eye, 
  Calendar,
  Clock,
  Loader2,
  Users as UsersIcon,
  DollarSign,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react';
import { IndividualUserAnalyticsDto, PaginationInfoDto } from '@/interfaces/analytics';

interface UsersAnalyticsTableProps {
  users: IndividualUserAnalyticsDto[];
  pagination?: PaginationInfoDto;
  isLoading?: boolean;
  onLoadMore?: () => void;
  onLoadPrevious?: () => void;
  formatCurrency: (value: number) => string;
  formatNumber: (value: number) => string;
  formatDate: (date: string) => string;
}

const UsersAnalyticsTable: React.FC<UsersAnalyticsTableProps> = ({
  users,
  pagination,
  isLoading,
  onLoadMore,
  onLoadPrevious,
  formatCurrency,
  formatNumber,
  formatDate,
}) => {
  if (isLoading && users.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-500">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8">
        <div className="text-center">
          <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay usuarios disponibles</h3>
          <p className="text-gray-500">
            No se encontraron usuarios con analytics en el sistema.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden relative">
      {/* Loading Overlay */}
      {isLoading && users.length > 0 && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-lg border">
            <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
            <span className="text-sm text-gray-600">Actualizando...</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Analytics de Usuarios</h2>
            <p className="text-sm text-gray-600">
              Lista de usuarios con sus métricas de performance
            </p>
          </div>
          <div className="text-sm text-gray-500">
            Total: {users.length} usuarios
          </div>
        </div>
      </div>

      {/* Desktop Table - Hidden on mobile */}
      <div className="hidden lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Órdenes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AOV
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registro
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((userAnalytics) => {
                const { user, analytics } = userAnalytics;
                
                return (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    {/* Usuario */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-purple-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.displayName}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-48">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Revenue Total */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(analytics.totalRevenue)}
                      </div>
                    </td>

                    {/* Total Órdenes */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatNumber(analytics.totalOrders)}
                      </div>
                    </td>

                    {/* Valor Promedio */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(analytics.averageOrderValue)}
                      </div>
                    </td>

                    {/* Registro */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/analytics/users/${user.id}`}
                        className="inline-flex items-center space-x-1 text-purple-600 hover:text-purple-900 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="hidden xl:inline">Ver detalles</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile/Tablet Cards - Visible on mobile and tablet */}
      <div className="lg:hidden">
        <div className="divide-y divide-gray-200">
          {users.map((userAnalytics) => {
            const { user, analytics } = userAnalytics;
            
            return (
              <div key={user.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between space-x-4">
                  {/* Usuario Info */}
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                        <User className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {user.displayName}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {user.email}
                      </div>
                      {(user.firstName || user.lastName) && (
                        <div className="text-xs text-gray-400 truncate">
                          {user.firstName} {user.lastName}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Acción */}
                  <Link
                    href={`/analytics/users/${user.id}`}
                    className="flex-shrink-0 inline-flex items-center space-x-1 text-purple-600 hover:text-purple-900 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    <span className="text-sm">Ver</span>
                  </Link>
                </div>

                {/* Métricas */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                    <div>
                      <div className="text-lg font-semibold text-green-800">
                        {formatCurrency(analytics.totalRevenue)}
                      </div>
                      <div className="text-xs text-green-600">Revenue Total</div>
                    </div>
                    <DollarSign className="h-5 w-5 text-green-500" />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div>
                      <div className="text-lg font-semibold text-blue-800">
                        {formatNumber(analytics.totalOrders)}
                      </div>
                      <div className="text-xs text-blue-600">Órdenes</div>
                    </div>
                    <ShoppingCart className="h-5 w-5 text-blue-500" />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100 sm:col-span-1">
                    <div>
                      <div className="text-lg font-semibold text-purple-800">
                        {formatCurrency(analytics.averageOrderValue)}
                      </div>
                      <div className="text-xs text-purple-600">AOV</div>
                    </div>
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                  </div>
                </div>

                {/* Fechas */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>Registro: {formatDate(user.createdAt)}</span>
                    </div>
                    {user.lastLogin && (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>Último login: {formatDate(user.lastLogin)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination */}
      {pagination && (pagination.hasNextPage || pagination.hasPreviousPage) && (
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="text-sm text-gray-700 text-center sm:text-left">
              {pagination.totalCount && (
                <span>Total: {pagination.totalCount} usuarios</span>
              )}
            </div>
            
            <div className="flex justify-center sm:justify-end space-x-2">
              {pagination.hasPreviousPage && onLoadPrevious && (
                <button
                  onClick={onLoadPrevious}
                  disabled={isLoading}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ← Anterior
                </button>
              )}
              
              {pagination.hasNextPage && onLoadMore && (
                <button
                  onClick={onLoadMore}
                  disabled={isLoading}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      Cargando...
                    </>
                  ) : (
                    'Siguiente →'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersAnalyticsTable;
