import mongoose from 'mongoose';
import logger from '@config/logger';
import { AppError } from '@utils/AppError';

interface MongoDuplicateError extends mongoose.Error {
  code: 11000;
  keyValue: Record<string, unknown>;
}

interface MongoServerError extends Error {
  code?: number;
  keyPattern?: Record<string, unknown>;
  keyValue?: Record<string, unknown>;
  errmsg?: string;
}

export async function withTransaction<T>(operation: (session: mongoose.ClientSession) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession();

  try {
    const result = await session.withTransaction(async () => {
      const operationResult = await operation(session);
      if (operationResult === undefined) {
        throw new AppError('La transacción no devolvió ningún resultado.', 500, 'error', false);
      }
      return operationResult;
    });

    return result as T; // TypeScript garantiza que `result` no será undefined aquí
  } catch (error: unknown) {
    // Manejar errores de unicidad de MongoDB (código 11000)
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      const mongoError = error as MongoDuplicateError | MongoServerError;
      const keyValue = mongoError.keyValue || {};
      const field = Object.keys(keyValue)[0] || 'campo';
      const value = keyValue[field];
      logger.warn(`Duplicate key error detected: ${field} '${value}'`, { field, value });
      throw new AppError(`El ${field} '${value}' ya existe en la base de datos`, 409, 'error', false, {
        field,
        value,
        code: '11000',
      });
    }

    logger.error('Transaction failed', {
      error,
    });

    throw error instanceof AppError
      ? error
      : new AppError('Error en la transacción', 500, 'error', false, {
          cause: error instanceof Error ? error.message : String(error),
        });
  } finally {
    await session.endSession();
  }
}
