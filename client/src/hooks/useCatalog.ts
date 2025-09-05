import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import axiosInstance from '@/utils/axiosInstance';
import { getErrorMessage } from '@/types/api';
import {
  CatalogFormData,
  CatalogPageState,
  UseCatalogReturn,
  UseCatalogOptions,
  GenerateCatalogResponse,
  PriceAdjustment,
  CATALOG_CATEGORIES,
  CATALOG_SUBCATEGORIES,
} from '@/interfaces/catalog';

export const useCatalog = (options: UseCatalogOptions = {}): UseCatalogReturn => {
  const {
    initialCategories = [],
    initialSubcategories = [],
    autoSelectAll = false,
  } = options;
  // ============================================================================
  // STATE - Estado del componente
  // ============================================================================
  const [state, setState] = useState<CatalogPageState>({
    loading: false,
    error: null,
    logoFile: null,
    logoPreview: null,
    generatedPdfUrl: null,
    emailSent: false,
    emailAddress: null,
  });

  // ============================================================================
  // FORM - Configuración del formulario
  // ============================================================================
  const form = useForm<CatalogFormData>({
    defaultValues: {
      email: '',
      categories: CATALOG_CATEGORIES.map(cat => cat.id), // Siempre todas las categorías por defecto
      subcategories: CATALOG_SUBCATEGORIES.map(sub => sub.id), // Siempre todas las subcategorías por defecto
      priceAdjustments: [],
    },
  });

  const { watch, setValue } = form;
  const selectedCategories = watch('categories');
  const selectedSubcategories = watch('subcategories');
  const priceAdjustments = watch('priceAdjustments');
  const email = watch('email');

  // ============================================================================
  // COMPUTED VALUES - Valores computados
  // ============================================================================
  const filteredSubcategories = selectedCategories.length > 0 
    ? CATALOG_SUBCATEGORIES.filter(sub => 
        sub.categories.some(catId => selectedCategories.includes(catId))
      )
    : CATALOG_SUBCATEGORIES;

  // ============================================================================
  // HANDLERS - Manejadores de eventos
  // ============================================================================

  // Manejar cambio de logo
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  // Remover logo
  const removeLogo = () => {
    setState(prev => ({ 
      ...prev, 
      logoFile: null, 
      logoPreview: null 
    }));
    
    // Reset file input
    const fileInput = document.getElementById('logo') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  // Manejar selección de categorías
  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    const current = selectedCategories;
    if (checked) {
      setValue('categories', [...current, categoryId]);
    } else {
      setValue('categories', current.filter((id: string) => id !== categoryId));
    }
  };

  // Manejar selección de subcategorías
  const handleSubcategoryChange = (subcategoryId: string, checked: boolean) => {
    const current = selectedSubcategories;
    if (checked) {
      setValue('subcategories', [...current, subcategoryId]);
    } else {
      setValue('subcategories', current.filter((id: string) => id !== subcategoryId));
    }
  };

  // Limpiar error
  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  // Limpiar estado de éxito
  const clearSuccess = () => {
    setState(prev => ({ 
      ...prev, 
      emailSent: false, 
      emailAddress: null, 
      generatedPdfUrl: null 
    }));
  };

  // Agregar nuevo ajuste de precio
  const addPriceAdjustment = () => {
    const current = priceAdjustments;
    setValue('priceAdjustments', [
      ...current,
      { percentageIncrease: 0 }
    ]);
  };

  // Remover ajuste de precio
  const removePriceAdjustment = (index: number) => {
    const current = priceAdjustments;
    setValue('priceAdjustments', current.filter((_, i) => i !== index));
  };

  // Actualizar ajuste de precio específico
  const updatePriceAdjustment = (index: number, field: keyof PriceAdjustment, value: string | number) => {
    const current = priceAdjustments;
    const updated = [...current];
    
    if (field === 'percentageIncrease') {
      updated[index] = { ...updated[index], [field]: Number(value) };
    } else {
      // Para categoryId y subcategoryId - ahora se pueden usar juntos
      updated[index] = { ...updated[index], [field]: value as string };
    }
    
    setValue('priceAdjustments', updated);
  };

  // ============================================================================
  // API CALLS - Llamadas a la API
  // ============================================================================

  // Enviar formulario
  const onSubmit: SubmitHandler<CatalogFormData> = async (data) => {
    setState(prev => ({ 
      ...prev, 
      error: null, 
      generatedPdfUrl: null,
      emailSent: false,
      emailAddress: null
    }));

    // Validación manual
    if (!data.email) {
      setState(prev => ({ 
        ...prev, 
        error: 'El email es requerido' 
      }));
      return;
    }

    if (data.categories.length === 0 && data.subcategories.length === 0) {
      setState(prev => ({ 
        ...prev, 
        error: 'Debe seleccionar al menos una categoría o subcategoría' 
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      const formData = new FormData();
      
      // Agregar email
      formData.append('email', data.email);
      
      // Agregar categorías y subcategorías como JSON
      if (data.categories.length > 0) {
        formData.append('categories', JSON.stringify(data.categories));
      }
      if (data.subcategories.length > 0) {
        formData.append('subcategories', JSON.stringify(data.subcategories));
      }
      
      // Agregar ajustes de precio si existen
      if (data.priceAdjustments.length > 0) {
        formData.append('priceAdjustments', JSON.stringify(data.priceAdjustments));
      }
      
      // Agregar logo si existe
      if (state.logoFile) {
        formData.append('logo', state.logoFile);
      }

      const response = await axiosInstance.post<{
        status: string;
        data: GenerateCatalogResponse;
      }>('/catalog/generate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.status === 'success' && response.data.data) {
        setState(prev => ({ 
          ...prev, 
          generatedPdfUrl: response.data.data.pdfUrl,
          emailSent: true,
          emailAddress: data.email
        }));
      }
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: `Error al generar catálogo: ${getErrorMessage(err)}` 
      }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  // ============================================================================
  // RETURN - Valor de retorno del hook
  // ============================================================================
  return {
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
      addPriceAdjustment,
      removePriceAdjustment,
      updatePriceAdjustment,
      onSubmit,
    },
    
    // Valores observados del formulario
    selectedCategories,
    selectedSubcategories,
    priceAdjustments,
    email,
  };
};