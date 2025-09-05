import { AppError } from './AppError';

export function normalizeError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof Error) return new AppError(err.message, 500, 'error', false);
  return new AppError(String(err), 500, 'error', false);
}
