import { AxiosError } from 'axios';

export type ErrorDetails = {
  code?: string;
  fields?: Record<string, string[]>;
  hint?: string;
  cause?: string;
  context?: Record<string, unknown>;
  [key: string]: unknown;
};

// Respuesta exitosa de la API
export interface ApiResponse<T = unknown> {
  status: "success" | "fail" | "error";
  message?: string;
  data?: T;
  details?: ErrorDetails;
}

// Respuesta de error de la API (coincide con ApiErrorResponse del backend)
export interface ApiErrorResponse {
  status: 'fail' | 'error';
  message: string;
  details?: ErrorDetails;
}

// ============================================================================
// ERROR TYPES - Tipos para manejo de errores
// ============================================================================

// Tipo para errores de Axios con nuestra API
export type ApiAxiosError = AxiosError<ApiErrorResponse>;

// ============================================================================
// ERROR HELPERS - Funciones utilitarias para manejo de errores
// ============================================================================

// Helper para verificar si es un error de nuestra API
export function isApiError(error: unknown): error is ApiAxiosError {
  return (
    error instanceof Error &&
    'isAxiosError' in error &&
    'response' in error &&
    typeof (error as AxiosError).isAxiosError === 'boolean' &&
    (error as AxiosError).isAxiosError === true &&
    (error as ApiAxiosError).response?.data?.status !== undefined
  );
}

// Helper para extraer mensaje de error
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.response?.data?.message || 'Error desconocido';
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'Error desconocido';
}

// Helper para extraer detalles de error
export function getErrorDetails(error: unknown): ErrorDetails | undefined {
  if (isApiError(error)) {
    return error.response?.data?.details;
  }
  return undefined;
}

// Helper para extraer código de status HTTP
export function getErrorStatus(error: unknown): number | undefined {
  if (isApiError(error)) {
    return error.response?.status;
  }
  return undefined;
}

// Helper para verificar si es un error específico
export function isErrorCode(error: unknown, code: string): boolean {
  const details = getErrorDetails(error);
  return details?.code === code;
}
