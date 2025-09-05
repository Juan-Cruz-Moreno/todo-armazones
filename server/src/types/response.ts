import { ErrorDetails } from './errorDetails';

export interface ApiResponse<T = unknown> {
  status: 'success' | 'fail' | 'error';
  message?: string;
  data?: T;
  details?: ErrorDetails;
}

export interface ApiErrorResponse {
  status: 'fail' | 'error';
  message: string;
  details?: ErrorDetails;
}
