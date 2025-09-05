import mongoose from 'mongoose';
import env from './env';
import logger from './logger';
import { AppError } from '@utils/AppError';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    });

    logger.info('✅ Conexión a MongoDB establecida correctamente');
  } catch (error) {
    const dbError = new AppError('Error al conectar a MongoDB', 500, 'error', false, {
      cause: (error as Error).message,
    });

    logger.error('❌ %s', dbError.message, {
      stack: dbError.stack,
      details: dbError.details,
    });

    process.exit(1);
  }

  mongoose.connection.on('connected', () => {
    logger.info('🟢 Mongoose conectado a la base de datos');
  });

  mongoose.connection.on('error', (err) => {
    logger.error('🔴 Error en la conexión de Mongoose: %s', err.message, {
      stack: err.stack,
    });
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('🟡 Mongoose desconectado de la base de datos');
  });
};
