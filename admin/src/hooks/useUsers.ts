import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchUsers, resetUsers, fetchUserByEmail, createUserByAdmin, CreateUserByAdminPayload, searchUsers, resetSearch, updateUserAsAdmin, UpdateUserByAdminPayload, resetUpdateUser } from "@/redux/slices/userSlice";

export const useUsers = () => {
  const dispatch = useAppDispatch();
  const {
    users,
    nextCursor,
    loading,
    error,
    userByEmail,
    loadingUserByEmail,
    errorUserByEmail,
    // Nuevos campos para búsqueda
    searchResults,
    searchNextCursor,
    searchLoading,
    searchError,
    // Campos para actualización
    updatingUser,
    updateUserError,
  } = useAppSelector((state) => state.users);

  const findUserByEmail = useCallback(
    (email: string) => {
      dispatch(fetchUserByEmail(email));
    },
    [dispatch]
  );

  const loadUsers = useCallback(
    (limit?: number, cursor?: string) => {
      dispatch(fetchUsers({ limit, cursor }));
    },
    [dispatch]
  );

  const clearUsers = useCallback(() => {
    dispatch(resetUsers());
  }, [dispatch]);

  const createUser = useCallback(
    async (payload: CreateUserByAdminPayload) => {
      const action = await dispatch(createUserByAdmin(payload));
      if (createUserByAdmin.fulfilled.match(action)) {
        // Reinicia la lista y recarga primer página para consistencia
        dispatch(resetUsers());
        dispatch(fetchUsers({ limit: 10 }));
      }
      return action;
    },
    [dispatch]
  );

  // Nuevo método para búsqueda flexible
  const searchUsersByQuery = useCallback(
    (query: string, fields?: string, limit?: number, cursor?: string) => {
      dispatch(searchUsers({ query, fields, limit, cursor }));
    },
    [dispatch]
  );

  const clearSearch = useCallback(() => {
    dispatch(resetSearch());
  }, [dispatch]);

  // Nuevo método para actualizar usuario como admin
  const updateUser = useCallback(
    async (payload: UpdateUserByAdminPayload) => {
      const action = await dispatch(updateUserAsAdmin(payload));
      return action;
    },
    [dispatch]
  );

  const clearUpdateUserError = useCallback(() => {
    dispatch(resetUpdateUser());
  }, [dispatch]);

  return {
    users,
    nextCursor,
    loading,
    error,
    loadUsers,
    clearUsers,
    userByEmail,
    loadingUserByEmail,
    errorUserByEmail,
    findUserByEmail,
    createUser,
    // Nuevos para búsqueda
    searchResults,
    searchNextCursor,
    searchLoading,
    searchError,
    searchUsersByQuery,
    clearSearch,
    // Nuevos para actualización
    updateUser,
    updatingUser,
    updateUserError,
    clearUpdateUserError,
  };
};
