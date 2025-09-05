import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import {
  fetchStockMovements,
  fetchProductStockSummary,
  createStockEntry,
  createStockExit,
  clearMovements,
  clearSummary,
  clearOperationError,
} from "../redux/slices/inventorySlice";
import type {
  CreateStockEntryPayload,
  CreateStockExitPayload,
} from "../interfaces/inventory";

export const useInventory = () => {
  const dispatch = useAppDispatch();
  
  const {
    movements,
    movementsLoading,
    movementsError,
    stockSummary,
    summaryLoading,
    summaryError,
    operationLoading,
    operationError,
  } = useAppSelector((state) => state.inventory);

  // Obtener movimientos de stock
  const getStockMovements = useCallback(
    (productVariantId: string, options?: { limit?: number; offset?: number }) => {
      return dispatch(fetchStockMovements({ productVariantId, ...options }));
    },
    [dispatch]
  );

  // Obtener resumen de stock de producto
  const getProductStockSummary = useCallback(
    (productId: string) => {
      return dispatch(fetchProductStockSummary(productId));
    },
    [dispatch]
  );

  // Crear entrada de stock
  const addStockEntry = useCallback(
    (payload: CreateStockEntryPayload) => {
      return dispatch(createStockEntry(payload));
    },
    [dispatch]
  );

  // Crear salida de stock
  const addStockExit = useCallback(
    (payload: CreateStockExitPayload) => {
      return dispatch(createStockExit(payload));
    },
    [dispatch]
  );

  // Limpiar datos
  const clearMovementData = useCallback(() => {
    dispatch(clearMovements());
  }, [dispatch]);

  const clearSummaryData = useCallback(() => {
    dispatch(clearSummary());
  }, [dispatch]);

  const clearErrors = useCallback(() => {
    dispatch(clearOperationError());
  }, [dispatch]);

  // Refrescar datos después de operaciones
  const refreshData = useCallback(
    async (productId?: string, productVariantId?: string) => {
      const promises = [];
      
      if (productId) {
        promises.push(dispatch(fetchProductStockSummary(productId)));
      }
      
      if (productVariantId) {
        promises.push(dispatch(fetchStockMovements({ productVariantId })));
      }
      
      return Promise.all(promises);
    },
    [dispatch]
  );

  // Operación completa: crear entrada y refrescar
  const createEntryAndRefresh = useCallback(
    async (payload: CreateStockEntryPayload, productId?: string) => {
      try {
        await dispatch(createStockEntry(payload)).unwrap();
        
        // Refrescar datos
        if (productId) {
          await dispatch(fetchProductStockSummary(productId));
        }
        await dispatch(fetchStockMovements({ 
          productVariantId: payload.productVariantId 
        }));
        
        return true;
      } catch (error) {
        console.error("Error creating stock entry:", error);
        return false;
      }
    },
    [dispatch]
  );

  // Operación completa: crear salida y refrescar
  const createExitAndRefresh = useCallback(
    async (payload: CreateStockExitPayload, productId?: string) => {
      try {
        await dispatch(createStockExit(payload)).unwrap();
        
        // Refrescar datos
        if (productId) {
          await dispatch(fetchProductStockSummary(productId));
        }
        await dispatch(fetchStockMovements({ 
          productVariantId: payload.productVariantId 
        }));
        
        return true;
      } catch (error) {
        console.error("Error creating stock exit:", error);
        return false;
      }
    },
    [dispatch]
  );

  return {
    // Estado
    movements,
    movementsLoading,
    movementsError,
    stockSummary,
    summaryLoading,
    summaryError,
    operationLoading,
    operationError,
    
    // Acciones básicas
    getStockMovements,
    getProductStockSummary,
    addStockEntry,
    addStockExit,
    
    // Utilidades
    clearMovementData,
    clearSummaryData,
    clearErrors,
    refreshData,
    
    // Operaciones completas
    createEntryAndRefresh,
    createExitAndRefresh,
  };
};
