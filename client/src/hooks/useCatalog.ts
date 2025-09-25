import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { io, Socket } from 'socket.io-client';
import axiosInstance from '@/utils/axiosInstance';
import { ApiResponse, getErrorMessage, isApiError, getErrorDetails } from '@/types/api';
import {
  CatalogFormData,
  CatalogPageState,
  UseCatalogReturn,
  GenerateCatalogResponse,
  PriceAdjustment,
  CatalogProgressEvent,
  CatalogErrorEvent,
  CATALOG_CATEGORIES,
  CATALOG_SUBCATEGORIES,
} from '@/interfaces/catalog';

export const useCatalog = (): UseCatalogReturn => {
  // ============================================================================
  // STATE - Estado del componente
  // ============================================================================
  const [state, setState] = useState<CatalogPageState>({
    loading: false,
    error: null,
    logoFile: null,
    logoPreview: null,
    progress: 0,
    roomId: null,
    pdfFileName: null,
    currentStep: undefined,
    progressMessage: undefined,
    isProgressModalOpen: false,
    modalError: null,
    completed: false,
  });

  const [socket, setSocket] = useState<Socket | null>(null);
  const roomIdRef = useRef<string | null>(null);

  // ============================================================================
  // FORM - Configuración del formulario
  // ============================================================================
  const form = useForm<CatalogFormData>({
    defaultValues: {
      categories: CATALOG_CATEGORIES.map(cat => cat.id), // Siempre todas las categorías por defecto
      subcategories: CATALOG_SUBCATEGORIES.map(sub => sub.id), // Siempre todas las subcategorías por defecto
      priceAdjustments: [],
      inStock: true, // Siempre filtrar por productos con stock
      showPrices: false, // Ocultar precios por defecto
    },
  });

  const { watch, setValue } = form;
  const selectedCategories = watch('categories');
  const selectedSubcategories = watch('subcategories');
  const priceAdjustments = watch('priceAdjustments');
  const showPrices = watch('showPrices');

  // ============================================================================
  // SOCKET.IO - Conexión y manejo de eventos
  // ============================================================================
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_API_URL + '/catalog';
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    const handleConnect = () => {
      // Emitir join-room si hay roomId pendiente
      if (roomIdRef.current) {
        newSocket.emit('join-room', roomIdRef.current);
      }
    };

    const handleDisconnect = () => {
      // Opcional: manejar desconexión si es necesario
    };

    const handleCatalogProgress = (data: CatalogProgressEvent) => {
      if (data.step === 'completed') {
        setState(prev => ({
          ...prev,
          pdfFileName: data.data?.fileName || null,
          progress: 100,
          loading: false,
          completed: true,
          // No cerrar modal aquí, mostrar mensaje de éxito con botón de descarga
        }));
      } else {
        setState(prev => ({
          ...prev,
          progress: data.progress,
          currentStep: data.step,
          progressMessage: data.data?.message,
          isProgressModalOpen: true, // Abrir modal al recibir progreso
        }));
      }
    };

    const handleCatalogError = (data: CatalogErrorEvent) => {
      setState(prev => ({
        ...prev,
        modalError: data.message,
        loading: false,
        // No cerrar el modal aquí, mostrar error dentro del modal
      }));
    };

    newSocket.on('connect', handleConnect);
    newSocket.on('disconnect', handleDisconnect);
    newSocket.on('catalog-progress', handleCatalogProgress);
    newSocket.on('catalog-error', handleCatalogError);

    return () => {
      newSocket.off('connect', handleConnect);
      newSocket.off('disconnect', handleDisconnect);
      newSocket.off('catalog-progress', handleCatalogProgress);
      newSocket.off('catalog-error', handleCatalogError);
      newSocket.disconnect();
    };
  }, []);

  // Emitir join-room cuando roomId cambie, asegurando que el socket esté conectado
  useEffect(() => {
    if (socket && socket.connected && roomIdRef.current) {
      socket.emit('join-room', roomIdRef.current);
    }
  }, [socket, state.roomId]);

  // ============================================================================
  // COMPUTED VALUES - Valores computados
  // ============================================================================
  const filteredSubcategories = useMemo(() => {
    return selectedCategories.length > 0
      ? CATALOG_SUBCATEGORIES.filter(sub =>
          sub.categories.some(catId => selectedCategories.includes(catId))
        )
      : CATALOG_SUBCATEGORIES;
  }, [selectedCategories]);

  // Cerrar modal de progreso
  const closeProgressModal = useCallback(() => {
    setState(prev => ({ ...prev, isProgressModalOpen: false }));
  }, []);

  // Descargar PDF
  const downloadPdf = useCallback(() => {
    if (state.pdfFileName) {
      const link = document.createElement('a');
      link.href = `${process.env.NEXT_PUBLIC_API_URL}/catalog/download/${state.pdfFileName}`;
      link.download = state.pdfFileName;
      link.click();
    }
  }, [state.pdfFileName]);

  // ============================================================================
  // HANDLERS - Manejadores de eventos
  // ============================================================================

  // Manejar cambio de logo
  const handleLogoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setState(prev => ({ ...prev, logoFile: file }));

      const reader = new FileReader();
      reader.onload = (e) => {
        setState(prev => ({
          ...prev,
          logoPreview: e.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // Remover logo
  const removeLogo = useCallback(() => {
    setState(prev => ({
      ...prev,
      logoFile: null,
      logoPreview: null
    }));

    // Reset file input
    const fileInput = document.getElementById('logo') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }, []);

  // Manejar selección de categorías
  const handleCategoryChange = useCallback((categoryId: string, checked: boolean) => {
    const current = selectedCategories;
    if (checked) {
      setValue('categories', [...current, categoryId]);
    } else {
      setValue('categories', current.filter((id: string) => id !== categoryId));
    }
  }, [selectedCategories, setValue]);

  // Manejar selección de subcategorías
  const handleSubcategoryChange = useCallback((subcategoryId: string, checked: boolean) => {
    const current = selectedSubcategories;
    if (checked) {
      setValue('subcategories', [...current, subcategoryId]);
    } else {
      setValue('subcategories', current.filter((id: string) => id !== subcategoryId));
    }
  }, [selectedSubcategories, setValue]);

  // Limpiar error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Limpiar estado de éxito
  const clearSuccess = useCallback(() => {
    roomIdRef.current = null; // Resetear ref
    setState(prev => ({
      ...prev,
      progress: 0,
      roomId: null,
      pdfFileName: null,
      completed: false,
    }));
  }, []);

  // Limpiar error del modal
  const clearModalError = useCallback(() => {
    setState(prev => ({
      ...prev,
      modalError: null,
      isProgressModalOpen: false, // Cerrar modal al limpiar error
    }));
  }, []);

  // Agregar nuevo ajuste de precio
  const addPriceAdjustment = useCallback(() => {
    const current = priceAdjustments;
    setValue('priceAdjustments', [
      ...current,
      { percentageIncrease: "" }
    ]);
  }, [priceAdjustments, setValue]);

  // Remover ajuste de precio
  const removePriceAdjustment = useCallback((index: number) => {
    const current = priceAdjustments;
    setValue('priceAdjustments', current.filter((_, i) => i !== index));
  }, [priceAdjustments, setValue]);

  // Actualizar ajuste de precio específico
  const updatePriceAdjustment = useCallback((index: number, field: keyof PriceAdjustment, value: string | number) => {
    const current = priceAdjustments;
    const updated = [...current];

    if (field === 'percentageIncrease') {
      // Para percentageIncrease, almacenar como string para permitir vacío
      updated[index] = { ...updated[index], [field]: value as string };
    } else {
      // Para categoryId y subcategoryId - ahora se pueden usar juntos
      updated[index] = { ...updated[index], [field]: value as string };
    }

    setValue('priceAdjustments', updated);
  }, [priceAdjustments, setValue]);  // ============================================================================
  // API CALLS - Llamadas a la API
  // ============================================================================

  // Enviar formulario
  const onSubmit: SubmitHandler<CatalogFormData> = useCallback(async (data) => {
    setState(prev => ({
      ...prev,
      error: null,
    }));

    // Validación manual
    if (data.categories.length === 0 && data.subcategories.length === 0) {
      setState(prev => ({
        ...prev,
        error: 'Debe seleccionar al menos una categoría o subcategoría'
      }));
      return;
    }

    // Validación de ajustes de precios
    for (const adjustment of data.priceAdjustments) {
      const num = Number(adjustment.percentageIncrease);
      if (isNaN(num) || num < 0) {
        setState(prev => ({
          ...prev,
          error: 'Los porcentajes de aumento de precio deben ser números válidos no negativos'
        }));
        return;
      }
      if (!adjustment.categoryId && !adjustment.subcategoryId) {
        setState(prev => ({
          ...prev,
          error: 'Cada ajuste de precio debe tener al menos una categoría o subcategoría seleccionada'
        }));
        return;
      }
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      const formData = new FormData();

      // Agregar categorías y subcategorías como JSON
      if (data.categories.length > 0) {
        formData.append('categories', JSON.stringify(data.categories));
      }
      if (data.subcategories.length > 0) {
        formData.append('subcategories', JSON.stringify(data.subcategories));
      }

      // Agregar ajustes de precio si existen
      if (data.priceAdjustments.length > 0) {
        const adjustedPriceAdjustments = data.priceAdjustments.map(a => ({
          ...a,
          percentageIncrease: Number(a.percentageIncrease) || 0
        }));
        formData.append('priceAdjustments', JSON.stringify(adjustedPriceAdjustments));
      }

      // Agregar filtro de stock (siempre true)
      formData.append('inStock', JSON.stringify(true));

      // Agregar mostrar precios
      formData.append('showPrices', JSON.stringify(data.showPrices ?? true));

      // Agregar logo si existe
      if (state.logoFile) {
        formData.append('logo', state.logoFile);
      }

      const response = await axiosInstance.post<ApiResponse<GenerateCatalogResponse>>('/catalog/generate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.status === 'success' && response.data.data) {
        roomIdRef.current = response.data.data.roomId; // Setear ref
        setState(prev => ({
          ...prev,
          roomId: response.data.data!.roomId,
          progress: 0, // Reset progress
          isProgressModalOpen: true, // Abrir modal al iniciar
        }));
        // Emitir join-room inmediatamente después de setear roomId
        if (socket && socket.connected) {
          socket.emit('join-room', response.data.data!.roomId);
        }
      }
    } catch (err) {
      let errorMessage = 'Error desconocido';
      let errorDetails: unknown = undefined;

      if (isApiError(err)) {
        // Error específico de la API del backend
        errorMessage = getErrorMessage(err);
        errorDetails = getErrorDetails(err);
        // Opcional: logging adicional para debugging
        console.error('API Error Details:', errorDetails);
      } else if (err instanceof Error) {
        // Error de red u otro tipo de error
        errorMessage = err.message;
      }

      console.error('Error in catalog generation:', errorMessage, err);
      setState(prev => ({
        ...prev,
        error: `Error al generar catálogo: ${errorMessage}`,
        loading: false,
      }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [state.logoFile, socket, roomIdRef]);

  // ============================================================================
  // RETURN - Valor de retorno del hook
  // ============================================================================
  return useMemo(() => ({
    // Estado
    state,

    // Datos
    categories: CATALOG_CATEGORIES,
    subcategories: CATALOG_SUBCATEGORIES,
    filteredSubcategories,

    // Formulario
    form,

    // Handlers
    handlers: {
      handleLogoChange,
      removeLogo,
      handleCategoryChange,
      handleSubcategoryChange,
      clearError,
      clearSuccess,
      clearModalError,
      addPriceAdjustment,
      removePriceAdjustment,
      updatePriceAdjustment,
      downloadPdf,
      closeProgressModal,
      onSubmit,
    },

    // Valores observados del formulario
    selectedCategories,
    selectedSubcategories,
    priceAdjustments,
    showPrices: showPrices ?? false,
  }), [
    state,
    filteredSubcategories,
    form,
    handleLogoChange,
    removeLogo,
    handleCategoryChange,
    handleSubcategoryChange,
    clearError,
    clearSuccess,
    clearModalError,
    addPriceAdjustment,
    removePriceAdjustment,
    updatePriceAdjustment,
    downloadPdf,
    closeProgressModal,
    onSubmit,
    selectedCategories,
    selectedSubcategories,
    priceAdjustments,
    showPrices,
  ]);
};