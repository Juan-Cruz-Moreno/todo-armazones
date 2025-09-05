import app from './app';
import { connectDB } from '@config/mongoose-config';
import env from '@config/env';
import logger from '@config/logger';
import { AppError } from '@utils/AppError';
import 'queues/order-queue.processor';
import 'cron/dollar.cron';

const startServer = async (): Promise<void> => {
  try {
    // Validar que el puerto esté definido
    if (!env.PORT) {
      throw new AppError('PORT is not defined in the environment variables.', 500, 'error', false);
    }

    await connectDB();

    app.listen(env.PORT, '0.0.0.0', () => {
      logger.info(`✅ HTTP Server is running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error('ERROR DETECTADO:', error);
    const serverError = new AppError('Failed to start server', 500, 'error', false, {
      cause: (error as Error).message,
    });

    logger.error('❌ %s', serverError.message, {
      stack: serverError.stack,
      details: serverError.details,
    });

    process.exit(1);
  }
};

startServer();
