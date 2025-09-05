import mongoose from 'mongoose';
import logger from '@config/logger';
import { AppError } from '@utils/AppError';

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
