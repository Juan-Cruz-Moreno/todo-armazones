import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchUsers, resetUsers, fetchUserByEmail, createUserByAdmin, CreateUserByAdminPayload } from "@/redux/slices/userSlice";

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
  };
};
