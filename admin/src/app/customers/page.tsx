"use client";
import React, { useEffect, useRef, useCallback, useState } from "react";
import Link from "next/link";
import { useUsers } from "@/hooks/useUsers";
import { debounce } from "@/utils/debounce";
import LoadingSpinner from "@/components/atoms/LoadingSpinner";
import { createUserByAdmin, updateUserAsAdmin, UpdateUserByAdminPayload, CreateUserByAdminPayload } from "@/redux/slices/userSlice";
import { UserRole, UserStatus } from "@/enums/user.enum";
import { IUser } from "@/interfaces/user";

const SKELETON_COUNT = 10;

const CustomersPage = () => {
  const { users, nextCursor, loading, error, loadUsers, createUser, searchResults, searchNextCursor, searchLoading, searchError, searchUsersByQuery, clearSearch, updateUser, updatingUser, updateUserError, clearUpdateUserError, getMostRecentAddress, recentAddress, loadingRecentAddress, errorRecentAddress, clearRecentAddress, updateAddress, updatingAddress, updateAddressError, clearUpdateAddressError } =
    useUsers();
  const observer = useRef<IntersectionObserver | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dni, setDni] = useState("");
  const [cuit, setCuit] = useState("");
  const [phone, setPhone] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Estados para la dirección en el modal de creación
  const [showCreateAddress, setShowCreateAddress] = useState(false);
  const [createAddressFirstName, setCreateAddressFirstName] = useState("");
  const [createAddressLastName, setCreateAddressLastName] = useState("");
  const [createAddressCompanyName, setCreateAddressCompanyName] = useState("");
  const [createAddressEmail, setCreateAddressEmail] = useState("");
  const [createAddressPhoneNumber, setCreateAddressPhoneNumber] = useState("");
  const [createAddressDni, setCreateAddressDni] = useState("");
  const [createAddressCuit, setCreateAddressCuit] = useState("");
  const [createAddressStreetAddress, setCreateAddressStreetAddress] = useState("");
  const [createAddressCity, setCreateAddressCity] = useState("");
  const [createAddressState, setCreateAddressState] = useState("");
  const [createAddressPostalCode, setCreateAddressPostalCode] = useState("");
  
  // Estados para el modal de edición
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<IUser | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editDni, setEditDni] = useState("");
  const [editCuit, setEditCuit] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState<UserRole>(UserRole.User);
  const [editStatus, setEditStatus] = useState<UserStatus>(UserStatus.Active);

  // Estados para la dirección en el modal de edición
  const [showAddress, setShowAddress] = useState(false);
  const [editAddressFirstName, setEditAddressFirstName] = useState("");
  const [editAddressLastName, setEditAddressLastName] = useState("");
  const [editAddressCompanyName, setEditAddressCompanyName] = useState("");
  const [editAddressEmail, setEditAddressEmail] = useState("");
  const [editAddressPhoneNumber, setEditAddressPhoneNumber] = useState("");
  const [editAddressDni, setEditAddressDni] = useState("");
  const [editAddressCuit, setEditAddressCuit] = useState("");
  const [editAddressStreetAddress, setEditAddressStreetAddress] = useState("");
  const [editAddressCity, setEditAddressCity] = useState("");
  const [editAddressState, setEditAddressState] = useState("");
  const [editAddressPostalCode, setEditAddressPostalCode] = useState("");

  // Debounced loadUsers for infinite scroll
  const debouncedFetch = useRef(
    debounce((params: { cursor?: string }) => {
      loadUsers(100, params.cursor);
    }, 200)
  ).current;

  // Debounced search for search input
  const debouncedSearch = useRef(
    debounce((query: string, cursor?: string) => {
      if (query.trim()) {
        searchUsersByQuery(query.trim(), undefined, 100, cursor);
      } else {
        clearSearch();
        loadUsers(100, cursor);
      }
    }, 300)
  ).current;

  const lastUserRef = useCallback(
    (node: HTMLTableRowElement | HTMLDivElement | null) => {
      const isSearching = searchQuery.trim() !== "";
      const currentLoading = isSearching ? searchLoading : loading;
      const currentCursor = isSearching ? searchNextCursor : nextCursor;
      const currentDebouncedFetch = isSearching
        ? (params: { cursor?: string }) => debouncedSearch(searchQuery.trim(), params.cursor)
        : debouncedFetch;

      if (currentLoading) return;
      if (observer.current) observer.current.disconnect();
      
      if (node) {
        observer.current = new window.IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting && currentCursor && !currentLoading) {
              currentDebouncedFetch({ cursor: currentCursor });
            }
          },
          {
            rootMargin: '100px' // Trigger a bit before reaching the element
          }
        );
        observer.current.observe(node);
      }
    },
    [loading, nextCursor, debouncedFetch, searchQuery, searchLoading, searchNextCursor, debouncedSearch]
  );

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  // Handle search query changes
  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setDisplayName("");
    setFirstName("");
    setLastName("");
    setDni("");
    setCuit("");
    setPhone("");
    setFormError(null);
    setShowCreateAddress(false);
    setCreateAddressFirstName("");
    setCreateAddressLastName("");
    setCreateAddressCompanyName("");
    setCreateAddressEmail("");
    setCreateAddressPhoneNumber("");
    setCreateAddressDni("");
    setCreateAddressCuit("");
    setCreateAddressStreetAddress("");
    setCreateAddressCity("");
    setCreateAddressState("");
    setCreateAddressPostalCode("");
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!email || !password) {
      setFormError("Email y contraseña son requeridos");
      return;
    }
    
    // Validar dirección si está activada
    if (showCreateAddress) {
      const missingFields = [];
      if (!createAddressFirstName) missingFields.push("Nombre");
      if (!createAddressLastName) missingFields.push("Apellido");
      if (!createAddressEmail) missingFields.push("Email");
      if (!createAddressPhoneNumber) missingFields.push("Teléfono");
      if (!createAddressDni) missingFields.push("DNI");
      if (!createAddressCity) missingFields.push("Ciudad");
      if (!createAddressState) missingFields.push("Provincia");
      if (!createAddressPostalCode) missingFields.push("Código Postal");
      
      if (missingFields.length > 0) {
        setFormError(`Faltan campos requeridos en la dirección: ${missingFields.join(", ")}`);
        return;
      }
    }
    
    // Construir payload base
    const payload: CreateUserByAdminPayload = {
      email,
      password,
      displayName: displayName || undefined,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      dni: dni || undefined,
      cuit: cuit || undefined,
      phone: phone || undefined,
    };
    
    // Agregar dirección si se completaron los campos requeridos
    if (showCreateAddress) {
      payload.address = {
        firstName: createAddressFirstName,
        lastName: createAddressLastName,
        companyName: createAddressCompanyName || undefined,
        email: createAddressEmail,
        phoneNumber: createAddressPhoneNumber,
        dni: createAddressDni,
        cuit: createAddressCuit || undefined,
        streetAddress: createAddressStreetAddress || undefined,
        city: createAddressCity,
        state: createAddressState,
        postalCode: createAddressPostalCode,
      };
    }
    
    setSubmitting(true);
    const action = await createUser(payload);
    setSubmitting(false);
    if (createUserByAdmin.fulfilled.match(action)) {
      handleCloseCreate();
    } else {
      setFormError((action.payload as string) || "No se pudo crear el usuario");
    }
  };

  // Funciones para el modal de edición
  const resetEditForm = () => {
    setEditEmail("");
    setEditPassword("");
    setEditDisplayName("");
    setEditFirstName("");
    setEditLastName("");
    setEditDni("");
    setEditCuit("");
    setEditPhone("");
    setEditRole(UserRole.User);
    setEditStatus(UserStatus.Active);
    setEditFormError(null);
  };

  const resetAddressForm = () => {
    setEditAddressFirstName("");
    setEditAddressLastName("");
    setEditAddressCompanyName("");
    setEditAddressEmail("");
    setEditAddressPhoneNumber("");
    setEditAddressDni("");
    setEditAddressCuit("");
    setEditAddressStreetAddress("");
    setEditAddressCity("");
    setEditAddressState("");
    setEditAddressPostalCode("");
  };

  const handleOpenEdit = (user: IUser) => {
    setEditingUser(user);
    setEditEmail(user.email);
    setEditDisplayName(user.displayName);
    setEditFirstName(user.firstName || "");
    setEditLastName(user.lastName || "");
    setEditDni(user.dni || "");
    setEditCuit(user.cuit || "");
    setEditPhone(user.phone || "");
    setEditRole(user.role);
    setEditStatus(user.status);
    setEditPassword(""); // No pre-llenar la contraseña
    setEditFormError(null);
    clearUpdateUserError();
    clearUpdateAddressError();
    setShowAddress(false);
    setIsEditOpen(true);
    
    // Cargar la dirección más reciente del usuario
    getMostRecentAddress(user.id);
  };

  const handleCloseEdit = () => {
    setIsEditOpen(false);
    setEditingUser(null);
    resetEditForm();
    resetAddressForm();
    clearRecentAddress();
    clearUpdateAddressError();
    setShowAddress(false);
  };

  // Efecto para poblar los campos de dirección cuando se carga
  useEffect(() => {
    if (recentAddress) {
      setEditAddressFirstName(recentAddress.firstName || "");
      setEditAddressLastName(recentAddress.lastName || "");
      setEditAddressCompanyName(recentAddress.companyName || "");
      setEditAddressEmail(recentAddress.email || "");
      setEditAddressPhoneNumber(recentAddress.phoneNumber || "");
      setEditAddressDni(recentAddress.dni || "");
      setEditAddressCuit(recentAddress.cuit || "");
      setEditAddressStreetAddress(recentAddress.streetAddress || "");
      setEditAddressCity(recentAddress.city || "");
      setEditAddressState(recentAddress.state || "");
      setEditAddressPostalCode(recentAddress.postalCode || "");
    }
  }, [recentAddress]);

  const handleSubmitAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setEditFormError(null);
    setEditSubmitting(true);
    
    // Construir payload con los datos de la dirección
    const addressPayload = {
      userId: editingUser.id,
      firstName: editAddressFirstName,
      lastName: editAddressLastName,
      companyName: editAddressCompanyName || undefined,
      email: editAddressEmail,
      phoneNumber: editAddressPhoneNumber,
      dni: editAddressDni,
      cuit: editAddressCuit || undefined,
      streetAddress: editAddressStreetAddress || undefined,
      city: editAddressCity,
      state: editAddressState,
      postalCode: editAddressPostalCode,
    };
    
    const action = await updateAddress(addressPayload);
    setEditSubmitting(false);
    
    if (action.type.endsWith('/fulfilled')) {
      // Dirección creada/actualizada exitosamente
      setEditFormError(null);
    } else {
      setEditFormError((action.payload as string) || "No se pudo guardar la dirección");
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setEditFormError(null);
    setEditSubmitting(true);
    
    // Construir payload solo con campos que han cambiado
    const updatePayload: UpdateUserByAdminPayload = {
      userId: editingUser.id,
    };
    
    if (editEmail !== editingUser.email) updatePayload.email = editEmail;
    if (editDisplayName !== editingUser.displayName) updatePayload.displayName = editDisplayName;
    if (editFirstName !== (editingUser.firstName || "")) updatePayload.firstName = editFirstName || undefined;
    if (editLastName !== (editingUser.lastName || "")) updatePayload.lastName = editLastName || undefined;
    if (editDni !== (editingUser.dni || "")) updatePayload.dni = editDni || undefined;
    if (editCuit !== (editingUser.cuit || "")) updatePayload.cuit = editCuit || undefined;
    if (editPhone !== (editingUser.phone || "")) updatePayload.phone = editPhone || undefined;
    if (editRole !== editingUser.role) updatePayload.role = editRole;
    if (editStatus !== editingUser.status) updatePayload.status = editStatus;
    if (editPassword.trim()) updatePayload.password = editPassword;
    
    // Si no hay cambios, cerrar modal
    if (Object.keys(updatePayload).length === 1) { // Solo userId
      handleCloseEdit();
      return;
    }
    
    const action = await updateUser(updatePayload);
    setEditSubmitting(false);
    
    if (updateUserAsAdmin.fulfilled.match(action)) {
      handleCloseEdit();
    } else {
      setEditFormError((action.payload as string) || "No se pudo actualizar el usuario");
    }
  };

  // Skeleton row for loading
  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <th>
        <div className="h-4 w-4 bg-gray-200 rounded" />
      </th>
      <td>
        <div className="h-4 w-24 bg-gray-200 rounded" />
      </td>
      <td>
        <div className="h-4 w-32 bg-gray-200 rounded" />
      </td>
      <td>
        <div className="h-4 w-20 bg-gray-200 rounded" />
      </td>
      <td>
        <div className="h-8 w-16 bg-gray-200 rounded" />
      </td>
    </tr>
  );

  // Determine if we're searching
  const isSearching = searchQuery.trim() !== "";
  const currentUsers = isSearching ? searchResults : users;
  const currentLoading = isSearching ? searchLoading : loading;
  const currentError = isSearching ? searchError : error;
  const currentCursor = isSearching ? searchNextCursor : nextCursor;

  return (
    <div className="px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-[#111111] font-bold text-2xl">
          Lista de clientes
        </h1>
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          <input
            type="text"
            placeholder="Buscar clientes..."
            className="px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF] w-full sm:w-64"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            onClick={handleOpenCreate}
            className="btn bg-[#222222] text-white px-4 py-2 rounded-none shadow-none"
          >
            Crear cliente
          </button>
        </div>
      </div>
      {/* Tabla DaisyUI para desktop */}
      <div className="hidden md:block">
        <table className="table">
          <thead className="text-[#222222]">
            <tr>
              <th>#</th>
              <th>Email</th>
              <th>Último acceso</th>
              <th>Fecha de creación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody className="text-[#222222]">
            {currentLoading &&
              currentUsers.length === 0 &&
              Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
                <SkeletonRow key={`skeleton-${idx}`} />
              ))}
            {currentError && (
              <tr>
                <td colSpan={6} className="text-center text-error">
                  {currentError}
                </td>
              </tr>
            )}
            {!currentLoading && !currentError && currentUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-sm opacity-60">
                  {isSearching ? "No se encontraron clientes" : "No hay clientes"}
                </td>
              </tr>
            )}
            {currentUsers.map((user, idx) => (
              <tr key={`${isSearching ? 'search' : 'list'}-${user.id}-${idx}`}>
                <th>{idx + 1}</th>
                <td>
                  <Link
                    href={`/analytics/users/${user.id}`}
                    className="text-[#2271B1] hover:text-[#1a5a8a] underline"
                  >
                    {user.email}
                  </Link>
                </td>
                <td>
                  {user.lastLogin
                    ? new Date(user.lastLogin).toLocaleString("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </td>
                <td>
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleString("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                      })
                    : ""}
                </td>
                <td>
                  <button
                    onClick={() => handleOpenEdit(user)}
                    className="btn bg-[#222222] text-white px-4 py-2 rounded-none shadow-none hover:bg-[#111111]"
                    disabled={updatingUser}
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Tabla mobile: una "columna" por usuario */}
      <div className="block md:hidden">
        <div className="space-y-4">
          {currentLoading &&
            currentUsers.length === 0 &&
            Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
              <div
                key={`skeleton-mobile-${idx}`}
                className="p-4 border rounded animate-pulse space-y-2"
              >
                <div className="h-4 w-4 bg-gray-200 rounded" />
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-4 w-32 bg-gray-200 rounded" />
              </div>
            ))}
          {currentError && (
            <div className="p-4 border rounded text-center text-error">
              {currentError}
            </div>
          )}
          {!currentLoading && !currentError && currentUsers.length === 0 && (
            <div className="p-4 border rounded text-center text-sm opacity-60">
              {isSearching ? "No se encontraron clientes" : "No hay clientes"}
            </div>
          )}
          {currentUsers.map((user, idx) => (
            <div
              key={`${isSearching ? 'search' : 'list'}-${user.id}-${idx}`}
              className="p-4 border rounded space-y-1 text-[#222222]"
            >
              <div className="font-bold text-xs">#{idx + 1}</div>
              <div>
                <span className="font-semibold">Email:</span>{" "}
                <Link
                  href={`/analytics/users/${user.id}`}
                  className="text-[#2271B1] hover:text-[#1a5a8a] underline"
                >
                  {user.email}
                </Link>
              </div>
              {user.lastLogin && (
                <div>
                  <span className="font-semibold">Último acceso:</span>{" "}
                  {new Date(user.lastLogin).toLocaleString("es-AR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}
              <div>
                <span className="font-semibold">Fecha de creación:</span>{" "}
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleString("es-AR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                    })
                  : ""}
              </div>
              <div className="pt-2">
                <button
                  onClick={() => handleOpenEdit(user)}
                  className="btn bg-[#222222] text-white px-4 py-2 rounded-none shadow-none hover:bg-[#111111]"
                  disabled={updatingUser}
                >
                  Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Unified trigger element for infinite scroll - works for both desktop and mobile */}
      {currentUsers.length > 0 && currentCursor && (
        <div ref={lastUserRef} className="h-1 w-full" />
      )}
      {/* Mensajes de carga y fin de lista */}
      {currentLoading && currentUsers.length > 0 && (
        <div className="flex justify-center py-4 text-[#666666]">
          <LoadingSpinner />
        </div>
      )}
      {!currentCursor && !currentLoading && currentUsers.length > 0 && (
        <div className="p-4 text-center text-sm text-[#222222] opacity-60">
          {isSearching ? "No hay más resultados" : "No hay más clientes"}
        </div>
      )}

      {/* Modal crear cliente (estilo consistente con EditItemPricesModal) */}
      <dialog className={`modal ${isCreateOpen ? "modal-open" : ""}`}>
        <div className="modal-box w-full max-w-md rounded-none border border-[#e1e1e1] bg-[#FFFFFF] text-[#222222] p-0 max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-[#FFFFFF] border-b border-[#e1e1e1] flex justify-between items-center h-12 z-30">
            <h3 className="font-bold text-lg text-[#111111] m-0 px-4">
              Crear cliente
            </h3>
            <button
              className="btn btn-sm bg-transparent text-[#333333] hover:text-[#111111] shadow-none h-full w-12 border-l border-[#e1e1e1] border-t-0 border-r-0 border-b-0 m-0"
              onClick={handleCloseCreate}
              disabled={submitting}
            >
              ✕
            </button>
          </div>

          <div className="p-4">
            <form onSubmit={handleSubmitCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#111111] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111111] mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111111] mb-1">
                  Nombre a mostrar (opcional)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#111111] mb-1">
                    Nombre (opcional)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111111] mb-1">
                    Apellido (opcional)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#111111] mb-1">
                    DNI (opcional)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111111] mb-1">
                    CUIT (opcional)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                    value={cuit}
                    onChange={(e) => setCuit(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111111] mb-1">
                  Teléfono (opcional)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              {/* Toggle para mostrar/ocultar campos de dirección */}
              <div className="pt-2 border-t border-[#e1e1e1]">
                <button
                  type="button"
                  onClick={() => setShowCreateAddress(!showCreateAddress)}
                  className="text-sm text-[#2271B1] hover:underline flex items-center gap-1"
                >
                  {showCreateAddress ? "▼" : "▶"} {showCreateAddress ? "Ocultar" : "Agregar"} dirección (opcional)
                </button>
              </div>

              {/* Campos de dirección */}
              {showCreateAddress && (
                <div className="space-y-3 p-3 bg-[#f9f9f9] border border-[#e1e1e1] rounded">
                  <h4 className="text-sm font-semibold text-[#111111]">Dirección de envío</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-[#111111] mb-1">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                        value={createAddressFirstName}
                        onChange={(e) => setCreateAddressFirstName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#111111] mb-1">
                        Apellido *
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                        value={createAddressLastName}
                        onChange={(e) => setCreateAddressLastName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#111111] mb-1">
                      Empresa (opcional)
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                      value={createAddressCompanyName}
                      onChange={(e) => setCreateAddressCompanyName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#111111] mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                      value={createAddressEmail}
                      onChange={(e) => setCreateAddressEmail(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-[#111111] mb-1">
                        Teléfono *
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                        value={createAddressPhoneNumber}
                        onChange={(e) => setCreateAddressPhoneNumber(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#111111] mb-1">
                        DNI *
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                        value={createAddressDni}
                        onChange={(e) => setCreateAddressDni(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#111111] mb-1">
                      CUIT (opcional)
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                      value={createAddressCuit}
                      onChange={(e) => setCreateAddressCuit(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#111111] mb-1">
                      Dirección (opcional)
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                      value={createAddressStreetAddress}
                      onChange={(e) => setCreateAddressStreetAddress(e.target.value)}
                      placeholder="Calle, número, piso, depto"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-[#111111] mb-1">
                        Ciudad *
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                        value={createAddressCity}
                        onChange={(e) => setCreateAddressCity(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#111111] mb-1">
                        Provincia *
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                        value={createAddressState}
                        onChange={(e) => setCreateAddressState(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#111111] mb-1">
                        C.P. *
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                        value={createAddressPostalCode}
                        onChange={(e) => setCreateAddressPostalCode(e.target.value)}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-[#666666] italic">
                    * Campos requeridos para crear la dirección
                  </p>
                </div>
              )}

              {formError && (
                <div className="text-error text-sm">{formError}</div>
              )}
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseCreate}
                  className="flex-1 px-4 py-2 text-[#333333] bg-[#f1f1f1] rounded-none hover:bg-[#e1e1e1] transition-colors border border-[#e1e1e1]"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-white bg-[#222222] rounded-none hover:bg-[#111111] transition-colors disabled:opacity-50 shadow-none"
                  disabled={submitting}
                >
                  {submitting ? "Creando..." : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
        <form
          method="dialog"
          className="modal-backdrop"
          onClick={handleCloseCreate}
        >
          <button>close</button>
        </form>
      </dialog>

      {/* Modal editar cliente */}
      <dialog className={`modal ${isEditOpen ? "modal-open" : ""}`}>
        <div className="modal-box w-full max-w-md rounded-none border border-[#e1e1e1] bg-[#FFFFFF] text-[#222222] p-0 max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-[#FFFFFF] border-b border-[#e1e1e1] flex justify-between items-center h-12 z-30">
            <h3 className="font-bold text-lg text-[#111111] m-0 px-4">
              Editar cliente
            </h3>
            <button
              className="btn btn-sm bg-transparent text-[#333333] hover:text-[#111111] shadow-none h-full w-12 border-l border-[#e1e1e1] border-t-0 border-r-0 border-b-0 m-0"
              onClick={handleCloseEdit}
              disabled={editSubmitting}
            >
              ✕
            </button>
          </div>

          <div className="p-4">
            <form onSubmit={handleSubmitEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#222222] mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#222222] mb-1">
                  Nueva Contraseña (opcional)
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Dejar vacío para mantener actual"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#222222] mb-1">
                  Nombre a mostrar
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#222222] mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#222222] mb-1">
                    Apellido
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#222222] mb-1">
                    DNI
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                    value={editDni}
                    onChange={(e) => setEditDni(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#222222] mb-1">
                    CUIT
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                    value={editCuit}
                    onChange={(e) => setEditCuit(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#222222] mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#222222] mb-1">
                    Rol
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                  >
                    <option value={UserRole.User}>Usuario</option>
                    <option value={UserRole.Admin}>Administrador</option>
                    <option value={UserRole.Guest}>Invitado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#222222] mb-1">
                    Estado
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as UserStatus)}
                  >
                    <option value={UserStatus.Active}>Activo</option>
                    <option value={UserStatus.Inactive}>Inactivo</option>
                  </select>
                </div>
              </div>

              {(editFormError || updateUserError) && (
                <div className="text-red-600 text-sm">
                  {editFormError || updateUserError}
                </div>
              )}

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  className="flex-1 px-4 py-2 text-[#333333] bg-[#f1f1f1] rounded-none hover:bg-[#e1e1e1] transition-colors border border-[#e1e1e1]"
                  onClick={handleCloseEdit}
                  disabled={editSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-white bg-[#222222] rounded-none hover:bg-[#111111] transition-colors disabled:opacity-50 shadow-none"
                  disabled={editSubmitting}
                >
                  {editSubmitting ? "Actualizando..." : "Actualizar Usuario"}
                </button>
              </div>
            </form>

            {/* Sección de dirección */}
            <div className="mt-6 border-t border-[#e1e1e1] pt-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-[#111111]">Dirección por defecto</h4>
                <button
                  type="button"
                  onClick={() => setShowAddress(!showAddress)}
                  className="text-sm text-[#2271B1] hover:text-[#1a5a8a] underline"
                  disabled={loadingRecentAddress}
                >
                  {showAddress ? "Ocultar" : "Mostrar"}
                </button>
              </div>

              {loadingRecentAddress && (
                <div className="flex justify-center py-4">
                  <LoadingSpinner />
                </div>
              )}

              {!loadingRecentAddress && showAddress && (
                <>
                  {!recentAddress && !errorRecentAddress && (
                    <div className="text-sm text-[#2271B1] italic mb-4 bg-blue-50 p-3 rounded border border-[#2271B1]">
                      ℹ️ Este cliente no tiene dirección registrada. Complete el formulario para crear una.
                    </div>
                  )}

                  {errorRecentAddress && !recentAddress && (
                    <div className="text-sm text-amber-600 italic mb-4 bg-amber-50 p-3 rounded border border-amber-300">
                      ⚠️ {errorRecentAddress}. Puede crear una nueva dirección completando el formulario.
                    </div>
                  )}

                  <form onSubmit={handleSubmitAddress} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-[#222222] mb-1">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                        value={editAddressFirstName}
                        onChange={(e) => setEditAddressFirstName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#222222] mb-1">
                        Apellido *
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                        value={editAddressLastName}
                        onChange={(e) => setEditAddressLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#222222] mb-1">
                      Empresa (opcional)
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                      value={editAddressCompanyName}
                      onChange={(e) => setEditAddressCompanyName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#222222] mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                      value={editAddressEmail}
                      onChange={(e) => setEditAddressEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-[#222222] mb-1">
                        Teléfono *
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                        value={editAddressPhoneNumber}
                        onChange={(e) => setEditAddressPhoneNumber(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#222222] mb-1">
                        DNI *
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                        value={editAddressDni}
                        onChange={(e) => setEditAddressDni(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#222222] mb-1">
                      CUIT (opcional)
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                      value={editAddressCuit}
                      onChange={(e) => setEditAddressCuit(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#222222] mb-1">
                      Dirección
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                      value={editAddressStreetAddress}
                      onChange={(e) => setEditAddressStreetAddress(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-[#222222] mb-1">
                        Ciudad *
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                        value={editAddressCity}
                        onChange={(e) => setEditAddressCity(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#222222] mb-1">
                        Provincia *
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                        value={editAddressState}
                        onChange={(e) => setEditAddressState(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#222222] mb-1">
                        Código Postal *
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-[#e1e1e1] rounded-none focus:outline-none focus:ring-2 focus:ring-[#2271B1] text-[#222222] bg-[#FFFFFF]"
                        value={editAddressPostalCode}
                        onChange={(e) => setEditAddressPostalCode(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {updateAddressError && (
                    <div className="text-red-600 text-sm">
                      {updateAddressError}
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 text-white bg-[#222222] rounded-none hover:bg-[#111111] transition-colors disabled:opacity-50 shadow-none"
                      disabled={editSubmitting || updatingAddress}
                    >
                      {updatingAddress ? "Actualizando..." : recentAddress ? "Actualizar Dirección" : "Crear Dirección"}
                    </button>
                  </div>
                </form>
                </>
              )}
            </div>
          </div>
        </div>
        <form
          method="dialog"
          className="modal-backdrop"
          onClick={handleCloseEdit}
        >
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
};

export default CustomersPage;
