import app from './app';
import { connectDB } from '@config/mongoose-config';
import env from '@config/env';
import logger from '@config/logger';
import { AppError } from '@utils/AppError';
import 'queues/order-queue.processor';
import 'cron/dollar.cron';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { setCatalogIo, joinRoom, leaveRoom, cleanupExpiredRooms } from './socket/socketManager';

const startServer = async (): Promise<void> => {
  try {
    // Validar que el puerto esté definido
    if (!env.PORT) {
      throw new AppError('PORT is not defined in the environment variables.', 500, 'error', false);
    }

    await connectDB();

    // Crear servidor HTTP
    const server = createServer(app);

    // Configurar Socket.IO
    const io = new Server(server, {
      cors: {
        origin: [
          'https://www.todoarmazonesarg.com',
          'https://todoarmazonesarg.com',
          'https://admin.todoarmazonesarg.com',
          'http://localhost:3000',
          'http://localhost:3001',
        ],
        credentials: true,
        methods: ['GET', 'POST'],
      },
    });

    // Namespace para catálogo
    const catalogNamespace = io.of('/catalog');

    // Configurar el namespace en el manager
    setCatalogIo(catalogNamespace);

    // Manejar conexiones Socket.IO generales
    io.on('connection', (socket) => {
      logger.info('Socket connected', {
        socketId: socket.id,
        timestamp: Date.now(),
      });

      socket.on('disconnect', (reason) => {
        logger.info('Socket disconnected', {
          socketId: socket.id,
          reason,
          timestamp: Date.now(),
        });
      });
    });

    // Manejar conexiones al namespace de catálogo
    catalogNamespace.on('connection', (socket) => {
      logger.info('Catalog socket connected', {
        socketId: socket.id,
        timestamp: Date.now(),
      });

      socket.on('join-room', (roomId: string, ack?: (response: { success: boolean; message?: string }) => void) => {
        logger.info('Join room attempt', {
          socketId: socket.id,
          roomId,
          timestamp: Date.now(),
        });
        // Validar roomId como UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(roomId)) {
          logger.warn('Invalid roomId', { socketId: socket.id, roomId });
          ack?.({ success: false, message: 'Invalid room ID' });
          return;
        }
        const success = joinRoom(socket.id, roomId);
        if (success) {
          socket.join(roomId);
          logger.info('Room joined successfully', {
            socketId: socket.id,
            roomId,
          });
          ack?.({ success: true });
        } else {
          logger.warn('Failed to join room', {
            socketId: socket.id,
            roomId,
            reason: 'limit reached or error',
          });
          ack?.({ success: false, message: 'Room limit reached' });
        }
      });

      socket.on('disconnect', (reason) => {
        logger.info('Catalog socket disconnected', {
          socketId: socket.id,
          reason,
          timestamp: Date.now(),
        });
        // Cleanup: Salir de todas las rooms
        leaveRoom(socket.id);
      });

      socket.on('error', (error) => {
        const appError = new AppError('Socket error', 500, 'error', false, {
          socketId: socket.id,
          error: error.message,
        });
        logger.error('Socket error handled', {
          error: appError.message,
          stack: appError.stack,
          socketId: socket.id,
        });
      });
    });

    // Cleanup periódico de rooms expiradas
    setInterval(cleanupExpiredRooms, 5 * 60 * 1000); // Cada 5 min

    server.listen(env.PORT, '0.0.0.0', () => {
      logger.info(`✅ HTTP Server is running on port ${env.PORT}`);
      logger.info(`🔌 Socket.IO is ready`);
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
