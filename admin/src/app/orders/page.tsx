// src/app/orders/page.tsx
"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import Link from "next/link";
import { OrderStatusBadge } from "@/components/atoms/OrderStatusBadge";
import Pagination from "@/components/molecules/Pagination";
import {
  DeliveryType,
  OrderStatus,
  PaymentMethod,
  ShippingMethod,
} from "@/enums/order.enum";
import useOrders from "@/hooks/useOrders";
import { useUsers } from "@/hooks/useUsers";
import { formatCurrency } from "@/utils/formatCurrency";
import LoadingSpinner from "@/components/atoms/LoadingSpinner";
import { Eye, X, Trash, Search, UserCircle } from "lucide-react";
import { Order, OrderItem } from "@/interfaces/order";
import { downloadOrderPDF } from "@/utils/downloadOrderPDF";
import Image from "next/image";

const OrdersPage = () => {
  const ORDERS_PER_PAGE = 20; // Número de órdenes por página

  const {
    ordersByPage,
    pagination,
    loading,
    bulkUpdateLoading,
    error,
    statusFilter,
    setFilter,
    clearOrders,
    bulkUpdateOrderStatusData,
    counts,
    countsLoading,
    searchCounts,
    searchCountsLoading,
    getOrdersCount,
    getOrdersCountBySearch,
    fetchOrdersByPage,
    hideOrder,
    hideOrderLoading,
    searchResults,
    searchPagination,
    searchLoading,
    searchError,
    searchOrdersData,
    clearSearch,
  } = useOrders();

  const {
    searchResults: userSearchResults,
    searchLoading: userSearchLoading,
    searchUsersByQuery,
    clearSearch: clearUserSearch,
  } = useUsers();

  const [previewOrder, setPreviewOrder] = useState<Order | null>(null); // Orden para modal
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [batchAction, setBatchAction] = useState<OrderStatus | "">("");
  const [currentPage, setCurrentPage] = useState(1);

  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [orderToHide, setOrderToHide] = useState<Order | null>(null); // Orden para modal de confirmación de ocultar
  const [hideSuccess, setHideSuccess] = useState<boolean>(false); // Estado para mostrar mensaje de éxito en el modal

  // Estados para búsqueda de usuarios y órdenes
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    displayName: string;
    email: string;
    firstName?: string;
    lastName?: string;
    dni?: string;
  } | null>(null);
  const [searchOrderPage, setSearchOrderPage] = useState(1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Solo actualizar fetchOrdersByPage si no hay usuario seleccionado
    if (!selectedUser) {
      clearOrders();
      fetchOrdersByPage({
        page: 1,
        status: statusFilter,
        limit: ORDERS_PER_PAGE,
      });
      setCurrentPage(1);
    } else {
      // Si hay usuario seleccionado, actualizar la búsqueda con el nuevo filtro
      setSearchOrderPage(1);
      searchOrdersData({
        userId: selectedUser.id,
        orderStatus: statusFilter,
        page: 1,
        limit: ORDERS_PER_PAGE,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    // Cargar conteo global al montar el componente
    getOrdersCount();
  }, [getOrdersCount]);

  useEffect(() => {
    // Actualizar conteos según el contexto (usuario seleccionado o vista general)
    if (selectedUser) {
      getOrdersCountBySearch({ userId: selectedUser.id });
    } else {
      getOrdersCount();
    }
  }, [selectedUser, getOrdersCount, getOrdersCountBySearch]);

  // Efecto para búsqueda de usuarios con debounce
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const timer = setTimeout(() => {
        searchUsersByQuery(
          searchQuery,
          "email,displayName,firstName,lastName,dni",
          10
        );
        setShowUserDropdown(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      clearUserSearch();
      setShowUserDropdown(false);
    }
  }, [searchQuery, searchUsersByQuery, clearUserSearch]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUserSelect = (user: {
    id: string;
    displayName: string;
    email: string;
  }) => {
    setSelectedUser(user);
    setSearchQuery("");
    setShowUserDropdown(false);
    clearUserSearch();
    setSearchOrderPage(1);

    // Buscar órdenes del usuario seleccionado con el filtro de estado actual
    searchOrdersData({
      userId: user.id,
      orderStatus: statusFilter,
      page: 1,
      limit: ORDERS_PER_PAGE,
    });
  };

  const handleClearSearch = () => {
    setSelectedUser(null);
    setSearchQuery("");
    clearSearch();
    clearUserSearch();
    setShowUserDropdown(false);
    setSearchOrderPage(1);
  };

  const handleSearchOrderPageChange = useCallback(
    (pageNumber: number) => {
      if (!selectedUser) return;

      window.scrollTo({ top: 0, behavior: "instant" });
      setSearchOrderPage(pageNumber);

      searchOrdersData({
        userId: selectedUser.id,
        orderStatus: statusFilter,
        page: pageNumber,
        limit: ORDERS_PER_PAGE,
      });
    },
    [selectedUser, statusFilter, searchOrdersData]
  );

  const handleCheckboxChange = (orderId: string, isChecked: boolean) => {
    setSelectedOrders((prev) =>
      isChecked ? [...prev, orderId] : prev.filter((id) => id !== orderId)
    );
  };

  const handleBatchAction = () => {
    if (batchAction && selectedOrders.length > 0) {
      bulkUpdateOrderStatusData(
        {
          orderIds: selectedOrders,
          newStatus: batchAction as OrderStatus,
        },
        (response) => {
          // Manejar éxito
          const { successfulUpdates } = response;

          if (successfulUpdates.length > 0) {
            // Recargar la página actual
            fetchOrdersByPage({
              page: currentPage,
              status: statusFilter,
              limit: ORDERS_PER_PAGE,
            });
            getOrdersCount();
          }

          // Limpiar selección
          setSelectedOrders([]);
          setBatchAction("");
        },
        (error) => {
          // Manejar error
          console.error("Error en bulk update:", error);
          setSelectedOrders([]);
          setBatchAction("");
        }
      );
    }
  };

  const handlePageChange = useCallback(
    (pageNumber: number) => {
      // Scroll hacia arriba inmediatamente cuando cambie de página
      window.scrollTo({ top: 0, behavior: "instant" });

      setCurrentPage(pageNumber);
      fetchOrdersByPage({
        page: pageNumber,
        status: statusFilter,
        limit: ORDERS_PER_PAGE,
      });
    },
    [fetchOrdersByPage, statusFilter]
  );

  const handleDownloadPDF = async (
    orderId: string,
    firstName: string,
    lastName: string,
    orderNumber: number
  ) => {
    setIsDownloading(orderId);
    try {
      await downloadOrderPDF(orderId, firstName, lastName, orderNumber);
    } catch {
    } finally {
      setIsDownloading(null);
    }
  };

  const handleHideOrder = () => {
    if (orderToHide) {
      hideOrder(
        orderToHide.id,
        (response) => {
          if (response.success) {
            // Mostrar mensaje de éxito en el modal
            setHideSuccess(true);
            // Recargar la página actual
            fetchOrdersByPage({
              page: currentPage,
              status: statusFilter,
              limit: ORDERS_PER_PAGE,
            });
            getOrdersCount();
          }
          // No cerrar el modal aquí, se cerrará cuando el usuario haga click en "Cerrar"
        },
        (error) => {
          console.error("Error al eliminar orden:", error);
          // Mantener el modal abierto para mostrar el error si es necesario
        }
      );
    }
  };

  const handleCloseHideModal = () => {
    setOrderToHide(null);
    setHideSuccess(false);
  };

  // Verificar si hay órdenes canceladas para mostrar la columna de acciones
  const hasCancelledOrders = ordersByPage.some(
    (order) => order.orderStatus === OrderStatus.Cancelled
  );

  // Determinar qué órdenes y paginación mostrar
  const displayOrders = selectedUser ? searchResults : ordersByPage;
  const displayPagination = selectedUser ? searchPagination : pagination;
  const displayLoading = selectedUser ? searchLoading : loading;
  const displayError = selectedUser ? searchError : error;
  const displayPage = selectedUser ? searchOrderPage : currentPage;
  const displayCounts = selectedUser ? searchCounts : counts;
  const displayCountsLoading = selectedUser ? searchCountsLoading : countsLoading;
  const handleDisplayPageChange = selectedUser
    ? handleSearchOrderPageChange
    : handlePageChange;

  return (
    <div className="px-4 py-6">
      {/* Header con título y botón */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-[#111111] font-bold text-2xl">
          Órdenes de clientes
        </h1>
        <Link
          href="/orders/create"
          className="btn bg-[#222222] text-white px-4 py-2 rounded-none shadow-none self-start sm:self-auto"
        >
          Crear Orden
        </Link>
      </div>

      {/* Barra de búsqueda de usuarios */}
      <div className="mb-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#111111]">
            Buscar órdenes por usuario
          </label>
          <div className="relative">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar por email, nombre, apellido o DNI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 pr-10 border border-[#e1e1e1] rounded-md focus:outline-none focus:border-[#2271B1] text-[#222222]"
                disabled={!!selectedUser}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
              {userSearchLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-[#2271B1] border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Dropdown de resultados de usuarios */}
            {showUserDropdown && userSearchResults.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute z-50 w-full mt-1 bg-white border border-[#e1e1e1] rounded-md shadow-lg max-h-64 overflow-y-auto"
              >
                {userSearchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className="w-full px-4 py-3 text-left hover:bg-[#f0f0f0] transition-colors border-b border-[#e1e1e1] last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <UserCircle className="w-5 h-5 text-[#666666] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[#111111] truncate">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.displayName}
                        </div>
                        <div className="text-sm text-[#666666] truncate">
                          {user.email}
                        </div>
                        {user.dni && (
                          <div className="text-xs text-[#999999]">
                            DNI: {user.dni}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Mensaje cuando no hay resultados */}
            {showUserDropdown &&
              searchQuery.trim().length >= 2 &&
              userSearchResults.length === 0 &&
              !userSearchLoading && (
                <div
                  ref={dropdownRef}
                  className="absolute z-50 w-full mt-1 bg-white border border-[#e1e1e1] rounded-md shadow-lg p-4 text-center text-sm text-[#666666]"
                >
                  No se encontraron usuarios con &quot;{searchQuery}&quot;
                </div>
              )}
          </div>

          {/* Usuario seleccionado */}
          {selectedUser && (
            <div className="flex items-center gap-2 p-3 bg-[#f0f0f0] border border-[#e1e1e1] rounded-md">
              <UserCircle className="w-5 h-5 text-[#2271B1] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[#111111]">
                  Mostrando órdenes de:{" "}
                  {selectedUser.firstName && selectedUser.lastName
                    ? `${selectedUser.firstName} ${selectedUser.lastName}`
                    : selectedUser.displayName}
                </div>
                <div className="text-xs text-[#666666]">
                  {selectedUser.email}
                </div>
                {selectedUser.dni && (
                  <div className="text-xs text-[#999999]">
                    DNI: {selectedUser.dni}
                  </div>
                )}
              </div>
              <button
                onClick={handleClearSearch}
                className="p-1 hover:bg-[#e1e1e1] rounded-md transition-colors"
                title="Limpiar búsqueda"
              >
                <X className="w-4 h-4 text-[#666666]" />
              </button>
            </div>
          )}
        </div>
      </div>

      {displayError && (
        <div className="p-4 text-center text-error">{displayError}</div>
      )}

      {/* Filtro de estados - Ahora también funciona con búsqueda de usuario */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <span className="text-[#666666] text-sm">
            Filtrar por estado{selectedUser && " (búsqueda activa)"}:
          </span>
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            {displayCountsLoading ? (
              <div className="text-sm text-[#666666]">Cargando conteos...</div>
            ) : (
              <>
                <button
                  className={`text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
                    !statusFilter
                      ? "bg-[#2271B1] text-white"
                      : "text-[#2271B1] hover:bg-[#f0f0f0] hover:text-[#111111]"
                  }`}
                  onClick={() => setFilter(undefined)}
                >
                  Todos (
                  {displayCounts
                    ? Object.values(displayCounts).reduce((sum, count) => sum + count, 0)
                    : 0}
                  )
                </button>
                <button
                  className={`text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
                    statusFilter === OrderStatus.Processing
                      ? "bg-[#2271B1] text-white"
                      : "text-[#2271B1] hover:bg-[#f0f0f0] hover:text-[#111111]"
                  }`}
                  onClick={() => setFilter(OrderStatus.Processing)}
                >
                  Processing ({displayCounts?.[OrderStatus.Processing] || 0})
                </button>
                <button
                  className={`text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
                    statusFilter === OrderStatus.OnHold
                      ? "bg-[#2271B1] text-white"
                      : "text-[#2271B1] hover:bg-[#f0f0f0] hover:text-[#111111]"
                  }`}
                  onClick={() => setFilter(OrderStatus.OnHold)}
                >
                  On Hold ({displayCounts?.[OrderStatus.OnHold] || 0})
                </button>
                <button
                  className={`text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
                    statusFilter === OrderStatus.PendingPayment
                      ? "bg-[#2271B1] text-white"
                      : "text-[#2271B1] hover:bg-[#f0f0f0] hover:text-[#111111]"
                  }`}
                  onClick={() => setFilter(OrderStatus.PendingPayment)}
                >
                  Pending Payment ({displayCounts?.[OrderStatus.PendingPayment] || 0})
                </button>
                <button
                  className={`text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
                    statusFilter === OrderStatus.Completed
                      ? "bg-[#2271B1] text-white"
                      : "text-[#2271B1] hover:bg-[#f0f0f0] hover:text-[#111111]"
                  }`}
                  onClick={() => setFilter(OrderStatus.Completed)}
                >
                  Completed ({displayCounts?.[OrderStatus.Completed] || 0})
                </button>
                <button
                  className={`text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
                    statusFilter === OrderStatus.Cancelled
                      ? "bg-[#2271B1] text-white"
                      : "text-[#2271B1] hover:bg-[#f0f0f0] hover:text-[#111111]"
                  }`}
                  onClick={() => setFilter(OrderStatus.Cancelled)}
                >
                  Cancelled ({displayCounts?.[OrderStatus.Cancelled] || 0})
                </button>
                <button
                  className={`text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
                    statusFilter === OrderStatus.Refunded
                      ? "bg-[#2271B1] text-white"
                      : "text-[#2271B1] hover:bg-[#f0f0f0] hover:text-[#111111]"
                  }`}
                  onClick={() => setFilter(OrderStatus.Refunded)}
                >
                  Refunded ({displayCounts?.[OrderStatus.Refunded] || 0})
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Acciones en lote - Solo mostrar si no hay búsqueda activa */}
      {!selectedUser && (
        <div className="hidden sm:flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <select
              className="select rounded-none border border-[#e1e1e1] bg-[#FFFFFF] text-[#222222] px-3 py-2"
              value={batchAction}
              onChange={(e) =>
                setBatchAction(e.target.value as OrderStatus | "")
              }
            >
              <option value="">Acciones en lote</option>
              <option value={OrderStatus.Processing}>
                Marcar como Processing
              </option>
              <option value={OrderStatus.OnHold}>Marcar como On Hold</option>
              <option value={OrderStatus.PendingPayment}>
                Marcar como Pending Payment
              </option>
              <option value={OrderStatus.Completed}>
                Marcar como Completed
              </option>
              <option value={OrderStatus.Cancelled}>
                Marcar como Cancelled
              </option>
              <option value={OrderStatus.Refunded}>Marcar como Refunded</option>
            </select>
            {selectedOrders.length > 0 && (
              <span className="text-sm text-[#666666]">
                ({selectedOrders.length} seleccionadas)
              </span>
            )}
          </div>
          <button
            className="btn bg-[#222222] text-white px-4 py-2 rounded-none shadow-none"
            onClick={handleBatchAction}
            disabled={
              !batchAction || selectedOrders.length === 0 || bulkUpdateLoading
            }
          >
            {bulkUpdateLoading ? "Aplicando..." : "Aplicar"}
          </button>
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="table border border-[#e1e1e1]">
          <thead>
            <tr className="border-b border-[#e1e1e1]">
              <th className="hidden sm:table-cell">
                <input
                  type="checkbox"
                  className="checkbox checkbox-neutral"
                  onChange={(e) =>
                    setSelectedOrders(
                      e.target.checked ? displayOrders.map((o) => o.id) : []
                    )
                  }
                  checked={
                    selectedOrders.length > 0 &&
                    selectedOrders.length === displayOrders.length
                  }
                />
              </th>
              <th className="text-[#222222]">Orden</th>
              <th className="hidden sm:table-cell text-[#222222]">Fecha</th>
              <th className="text-[#222222]">Estado</th>
              <th className="hidden sm:table-cell text-[#222222]">Total USD</th>
              <th className="hidden sm:table-cell text-[#222222]">Total ARS</th>
              {hasCancelledOrders && (
                <th className="hidden sm:table-cell text-[#222222]">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {displayOrders.map((order) => {
              return (
                <tr
                  key={order.id}
                  className="text-[#333333] border-b border-[#e1e1e1]"
                >
                  <td className="hidden sm:table-cell">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-neutral"
                      onChange={(e) =>
                        handleCheckboxChange(order.id, e.target.checked)
                      }
                      checked={selectedOrders.includes(order.id)}
                    />
                  </td>
                  <td>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Link
                          href={`orders/edit/${order.id}`}
                          className="font-bold text-[#2271B1]"
                        >
                          #{order.orderNumber} - {order.user.firstName}{" "}
                          {order.user.lastName}
                        </Link>
                      </div>
                      <button
                        className="btn btn-xs bg-transparent border-none shadow-none text-[#2271B1]"
                        onClick={() => setPreviewOrder(order)}
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                    {order.allowViewInvoice && (
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          className="text-xs text-[#999999] hover:underline flex items-center gap-1 cursor-pointer"
                          onClick={() =>
                            handleDownloadPDF(
                              order.id,
                              order.shippingAddress.firstName,
                              order.shippingAddress.lastName,
                              order.orderNumber
                            )
                          }
                          disabled={isDownloading === order.id}
                        >
                          {isDownloading === order.id ? (
                            <span>Descargando...</span>
                          ) : (
                            <>
                              <Image
                                src="/pdf.svg"
                                alt="PDF Icon"
                                width={16}
                                height={16}
                              />
                              Ver factura
                            </>
                          )}
                        </button>
                      </div>
                    )}
                    {/* Mobile: show date inside main cell when there's room */}
                    <div className="sm:hidden mt-1 text-sm text-[#555555]">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="hidden sm:table-cell text-[#555555]">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <OrderStatusBadge status={order.orderStatus} />
                  </td>
                  <td className="hidden sm:table-cell text-[#555555]">
                    {order.refund && order.refund.originalSubTotal ? (
                      <>
                        <span className="line-through">
                          {formatCurrency(
                            order.refund.originalSubTotal,
                            "en-US",
                            "USD"
                          )}
                        </span>{" "}
                        {formatCurrency(order.totalAmount, "en-US", "USD")}
                      </>
                    ) : (
                      formatCurrency(order.totalAmount, "en-US", "USD")
                    )}
                  </td>
                  <td className="hidden sm:table-cell text-[#555555]">
                    {formatCurrency(order.totalAmountARS, "es-AR", "ARS")}
                  </td>
                  {hasCancelledOrders && (
                    <td className="hidden sm:table-cell">
                      {order.orderStatus === OrderStatus.Cancelled && (
                        <button
                          className="btn btn-xs bg-red-500 hover:bg-red-600 text-white border-none shadow-none"
                          onClick={() => setOrderToHide(order)}
                          title="Eliminar orden"
                        >
                          <Trash size={14} />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {displayLoading && displayOrders.length === 0 && (
        <div className="p-4 text-center text-[#666666]">
          <LoadingSpinner />
        </div>
      )}

      {displayOrders.length === 0 && !displayLoading && (
        <div className="p-4 text-center text-sm text-[#222222] opacity-60">
          {selectedUser
            ? `No hay órdenes para ${
                selectedUser.firstName && selectedUser.lastName
                  ? `${selectedUser.firstName} ${selectedUser.lastName}`
                  : selectedUser.displayName
              }`
            : "No hay órdenes"}
        </div>
      )}

      {/* Componente de paginación */}
      {displayPagination && displayPagination.totalPages > 1 && (
        <Pagination
          currentPage={displayPage}
          totalPages={displayPagination.totalPages}
          onPageChange={handleDisplayPageChange}
          loading={displayLoading}
          className="mt-6"
        />
      )}

      {/* Información de resultados */}
      {displayPagination && (
        <div className="mt-4 text-sm text-[#666666] text-center">
          Mostrando {displayOrders.length} de {displayPagination.totalCount}{" "}
          órdenes
          {selectedUser &&
            ` de ${
              selectedUser.firstName && selectedUser.lastName
                ? `${selectedUser.firstName} ${selectedUser.lastName}`
                : selectedUser.displayName
            }`}
        </div>
      )}

      {/* Modal Preview */}
      {previewOrder && (
        <dialog id="preview_modal" className="modal modal-open">
          <div className="modal-box w-full sm:max-w-3xl rounded-none border border-[#e1e1e1] bg-[#FFFFFF] text-[#222222] p-0 h-screen sm:h-auto sm:max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#FFFFFF] border-b border-[#e1e1e1] flex justify-between items-center h-12 z-30">
              <h3 className="font-bold text-lg text-[#111111] m-0 px-4">
                Orden #{previewOrder.orderNumber}
              </h3>
              <div className="flex items-center gap-4 h-full">
                <OrderStatusBadge status={previewOrder.orderStatus} />
                <button
                  className="btn btn-sm bg-transparent text-[#333333] hover:text-[#111111] shadow-none h-full w-12 border-l border-[#e1e1e1] border-t-0 border-r-0 border-b-0 m-0"
                  onClick={() => setPreviewOrder(null)}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-12 gap-4">
              {/* Client Details */}
              <div className="col-span-1 sm:col-span-5">
                <h4 className="font-bold text-md mb-2 text-[#111111]">
                  Datos del cliente:
                </h4>
                <p className="mb-2 text-[#333333]">
                  <strong>Nombre:</strong> {previewOrder.user.firstName}{" "}
                  {previewOrder.user.lastName}
                </p>
                <p className="mb-2 text-[#333333]">
                  <strong>Email:</strong>{" "}
                  <a
                    href={`mailto:${previewOrder.user.email}`}
                    className="text-[#2271B1] hover:underline"
                  >
                    {previewOrder.user.email}
                  </a>
                </p>
                {previewOrder.user.dni && (
                  <p className="mb-2 text-[#333333]">
                    <strong>DNI:</strong> {previewOrder.user.dni || "N/A"}
                  </p>
                )}
                {previewOrder.user.cuit && (
                  <p className="mb-2 text-[#333333]">
                    <strong>CUIT:</strong> {previewOrder.user.cuit}
                  </p>
                )}
                <p className="mb-2 text-[#333333]">
                  <strong>Teléfono:</strong>{" "}
                  {previewOrder.shippingAddress.phoneNumber || "N/A"}
                </p>
              </div>

              {/* Shipping Details */}
              <div className="col-span-1 sm:col-span-7">
                <h4 className="font-bold text-md mb-2 text-[#111111]">
                  Detalles de envío:
                </h4>
                <p className="mb-2 text-[#333333]">
                  <strong>Nombre:</strong>{" "}
                  {previewOrder.shippingAddress.firstName}{" "}
                  {previewOrder.shippingAddress.lastName}
                </p>

                {/* Tipo de entrega */}
                {previewOrder.shippingAddress.deliveryType && (
                  <p className="mb-2 text-[#333333]">
                    <strong>Tipo de entrega:</strong>{" "}
                    {previewOrder.shippingAddress.deliveryType ===
                    DeliveryType.HomeDelivery
                      ? "Entrega a domicilio"
                      : "Punto de retiro"}
                  </p>
                )}

                {/* Dirección de entrega o punto de retiro */}
                {previewOrder.shippingAddress.deliveryType ===
                  DeliveryType.PickupPoint &&
                previewOrder.shippingAddress.pickupPointAddress ? (
                  <p className="mb-2 text-[#333333]">
                    <strong>Punto de retiro:</strong>{" "}
                    {previewOrder.shippingAddress.pickupPointAddress}
                  </p>
                ) : (
                  <p className="mb-2 text-[#333333]">
                    <strong>Dirección:</strong>{" "}
                    {previewOrder.shippingAddress.streetAddress},{" "}
                    {previewOrder.shippingAddress.city},{" "}
                    {previewOrder.shippingAddress.state}{" "}
                    {previewOrder.shippingAddress.postalCode}
                  </p>
                )}

                <p className="mb-2 text-[#333333]">
                  <strong>Método de envío:</strong>{" "}
                  {previewOrder.shippingMethod ===
                    ShippingMethod.ParcelCompany &&
                    "Transporte / Empresa de encomienda"}
                  {previewOrder.shippingMethod === ShippingMethod.Motorcycle &&
                    "Moto"}
                </p>

                {previewOrder.shippingAddress &&
                  previewOrder.shippingAddress.shippingCompany && (
                    <p className="mb-2 text-[#333333]">
                      <strong>Empresa de encomienda:</strong>{" "}
                      {previewOrder.shippingAddress.shippingCompany}
                    </p>
                  )}
                {previewOrder.shippingAddress &&
                  previewOrder.shippingAddress.declaredShippingAmount && (
                    <p className="mb-2 text-[#333333]">
                      <strong>Monto declarado:</strong>{" "}
                      {previewOrder.shippingAddress.declaredShippingAmount}
                    </p>
                  )}
                {previewOrder.shippingAddress &&
                  previewOrder.shippingAddress.deliveryWindow && (
                    <p className="mb-2 text-[#333333]">
                      <strong>Ventana de entrega:</strong>{" "}
                      {previewOrder.shippingAddress.deliveryWindow}
                    </p>
                  )}
                <p className="mb-2 text-[#333333]">
                  <strong>Método de pago:</strong>{" "}
                  {previewOrder.paymentMethod ===
                    PaymentMethod.CashOnDelivery && "Efectivo contra reembolso"}
                  {previewOrder.paymentMethod === PaymentMethod.BankTransfer &&
                    "Transferencia / Depósito bancario (4% extra)"}
                </p>
              </div>
            </div>
            <div className="p-4">
              {previewOrder.items.length > 0 && (
                <div className="mb-4">
                  <div className="overflow-x-auto">
                    <table className="table border border-[#e1e1e1]">
                      <thead>
                        <tr className="border-b border-[#e1e1e1]">
                          <th className="text-[#222222]">Producto</th>
                          <th className="text-[#222222]">Cost of goods</th>
                          <th className="text-[#222222]">Precio</th>
                          <th className="text-[#222222]">Cantidad</th>
                          <th className="text-[#222222]">Subtotal</th>
                          <th className="text-[#222222]">
                            Contribución Marginal
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewOrder.items.map(
                          (item: OrderItem, index: number) => (
                            <tr
                              key={index}
                              className="text-[#333333] border-b border-[#e1e1e1]"
                            >
                              <td>
                                <a
                                  href={`https://tienda.todoarmazonesarg.com/producto/${item.productVariant.product.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block"
                                >
                                  <div className="flex items-start gap-3">
                                    {/* Imagen del producto (responsive) */}
                                    <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 overflow-hidden rounded-md bg-gray-50 border border-gray-200">
                                      <Image
                                        src={`${
                                          process.env.NEXT_PUBLIC_API_URL
                                        }/${
                                          item.productVariant.images?.[0] ||
                                          "placeholder-image.jpg"
                                        }`}
                                        alt={`${
                                          item.productVariant.product
                                            .productModel
                                        } - ${
                                          item.productVariant.color?.name ||
                                          "variant"
                                        }`}
                                        width={64}
                                        height={64}
                                        className="object-cover w-full h-full"
                                      />
                                    </div>

                                    {/* Información del producto (truncate en pantallas pequeñas) */}
                                    <div className="flex flex-col min-w-0 flex-1">
                                      <span
                                        className="font-medium text-[#222222] truncate block"
                                        title={`${item.productVariant.product.productModel} ${item.productVariant.product.sku}`}
                                      >
                                        {
                                          item.productVariant.product
                                            .productModel
                                        }
                                      </span>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span
                                          className="text-sm text-gray-500 truncate"
                                          title={`Color: ${item.productVariant.color?.name}`}
                                        >
                                          Color:{" "}
                                          {item.productVariant.color?.name}
                                        </span>
                                        <span
                                          className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                                          style={{
                                            backgroundColor:
                                              item.productVariant.color?.hex ||
                                              "transparent",
                                          }}
                                          aria-hidden
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </a>
                              </td>
                              <td>
                                {formatCurrency(
                                  item.costUSDAtPurchase * item.quantity,
                                  "en-US",
                                  "USD"
                                )}
                              </td>
                              <td>
                                {formatCurrency(
                                  item.priceUSDAtPurchase,
                                  "en-US",
                                  "USD"
                                )}
                              </td>
                              <td>{item.quantity}</td>
                              <td>
                                {formatCurrency(item.subTotal, "en-US", "USD")}
                              </td>
                              <td>
                                {formatCurrency(
                                  item.contributionMarginUSD,
                                  "en-US",
                                  "USD"
                                )}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <p className="mb-2 text-[#333333]">
                <strong>Cantidad de Items:</strong> {previewOrder.itemsCount}
              </p>
              {previewOrder.refund && previewOrder.refund.originalSubTotal && (
                <p className="mb-2 text-[#333333]">
                  <strong>Subtotal:</strong>{" "}
                  <span style={{ textDecoration: "line-through" }}>
                    {formatCurrency(
                      previewOrder.refund.originalSubTotal,
                      "en-US",
                      "USD"
                    )}
                  </span>
                </p>
              )}
              {previewOrder.refund && (
                <>
                  <p className="mb-2 text-[#A00000]">
                    <strong>Reembolso USD:</strong>{" "}
                    {previewOrder.refund.type === "fixed"
                      ? `Fijo de ${formatCurrency(
                          previewOrder.refund.amount,
                          "en-US",
                          "USD"
                        )}`
                      : `${
                          previewOrder.refund.amount
                        }% (equivalente a ${formatCurrency(
                          previewOrder.refund.appliedAmount,
                          "en-US",
                          "USD"
                        )})`}
                  </p>
                  {previewOrder.refund.reason && (
                    <p className="mb-2 text-[#A00000]">
                      <strong>Razón:</strong> {previewOrder.refund.reason}
                    </p>
                  )}
                </>
              )}

              <p className="mb-2 text-[#333333]">
                <strong>Subtotal:</strong>{" "}
                {formatCurrency(previewOrder.subTotal, "en-US", "USD")}
              </p>
              {previewOrder.bankTransferExpense &&
                previewOrder.paymentMethod === PaymentMethod.BankTransfer && (
                  <p className="mb-2 text-[#333333]">
                    <strong>Gasto por Transferencia bancaria:</strong>{" "}
                    {formatCurrency(
                      previewOrder.bankTransferExpense,
                      "en-US",
                      "USD"
                    )}
                  </p>
                )}
              <p className="mb-2 text-[#333333]">
                <strong>Total:</strong>{" "}
                {formatCurrency(previewOrder.totalAmount, "en-US", "USD")}
              </p>
              <p className="mb-2 text-[#333333]">
                <strong>Total ARS:</strong>{" "}
                {formatCurrency(previewOrder.totalAmountARS, "es-AR", "ARS")}{" "}
                <span className="text-sm text-gray-500">
                  (tipo de cambio:{" "}
                  {formatCurrency(previewOrder.exchangeRate, "es-AR", "ARS")})
                </span>
              </p>
              <p className="mb-2 text-[#333333]">
                <strong>Cost of Goods:</strong>{" "}
                {formatCurrency(previewOrder.totalCogsUSD, "en-US", "USD")}
              </p>
              <p className="mb-2 text-[#333333]">
                <strong>Contribución Marginal:</strong>{" "}
                {formatCurrency(
                  previewOrder.totalContributionMarginUSD,
                  "en-US",
                  "USD"
                )}{" "}
                ({previewOrder.contributionMarginPercentage.toFixed(2)}%)
              </p>
            </div>
          </div>
        </dialog>
      )}

      {/* Modal de confirmación para ocultar orden */}
      {orderToHide && (
        <dialog id="hide_order_modal" className="modal modal-open">
          <div className="modal-box rounded-none border border-[#e1e1e1] bg-[#FFFFFF] text-[#222222]">
            <h3 className="font-bold text-lg text-[#111111] mb-4">
              {hideSuccess ? "Eliminación completada" : "Confirmar eliminación"}
            </h3>
            {hideSuccess ? (
              <div className="py-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <p className="text-[#333333] font-medium">
                    La orden #{orderToHide.orderNumber} ha sido eliminada
                    exitosamente.
                  </p>
                </div>
                <p className="text-sm text-[#666666]">
                  La orden ya no aparecerá en los listados pero los datos se
                  mantienen para auditoría.
                </p>
              </div>
            ) : (
              <>
                <p className="py-4 text-[#333333]">
                  ¿Estás seguro de que quieres eliminar la orden{" "}
                  <strong>#{orderToHide.orderNumber}</strong> de{" "}
                  <strong>
                    {orderToHide.user.firstName} {orderToHide.user.lastName}
                  </strong>
                  ?
                </p>
                <p className="text-sm text-[#666666] mb-6">
                  Esta acción eliminará la orden de los listados pero mantendrá
                  los datos para auditoría. Solo se puede hacer con órdenes
                  canceladas.
                </p>
              </>
            )}
            <div className="modal-action">
              <button
                className={`btn border-none shadow-none ${
                  hideSuccess
                    ? "bg-[#2271B1] text-white hover:bg-[#1a5a8a]"
                    : "bg-transparent text-[#666666] hover:text-[#333333]"
                }`}
                onClick={handleCloseHideModal}
                disabled={hideOrderLoading}
              >
                {hideSuccess ? "Cerrar" : "Cancelar"}
              </button>
              {!hideSuccess && (
                <button
                  className="btn bg-red-500 hover:bg-red-600 text-white border-none shadow-none"
                  onClick={handleHideOrder}
                  disabled={hideOrderLoading}
                >
                  {hideOrderLoading ? "Eliminando..." : "Eliminar orden"}
                </button>
              )}
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
};

export default OrdersPage;
