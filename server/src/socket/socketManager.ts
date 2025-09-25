import { Namespace } from 'socket.io';
import logger from '@config/logger';
import { AppError } from '@utils/AppError';

let catalogIo: Namespace | null = null;
const roomLimits = new Map<string, { sockets: Set<string>; expiresAt: number }>();
const socketEventCounts = new Map<string, { count: number; lastReset: number }>(); // Rate limiting básico

// Función para normalizar errores de socket
const normalizeSocketError = (error: unknown, context: Record<string, unknown>): AppError => {
  if (error instanceof AppError) return error;
  if (error instanceof Error)
    return new AppError(error.message, 500, 'error', false, { ...context, cause: error.message });
  return new AppError(String(error), 500, 'error', false, context);
};

// Función para rate limiting básico (máximo 10 eventos por minuto por socket)
const checkRateLimit = (socketId: string, event: string): boolean => {
  const now = Date.now();
  const key = `${socketId}-${event}`;
  const record = socketEventCounts.get(key) || { count: 0, lastReset: now };
  if (now - record.lastReset > 60000) {
    // Reset cada minuto
    record.count = 0;
    record.lastReset = now;
  }
  if (record.count >= 10) {
    logger.warn('Rate limit exceeded', { socketId, event, count: record.count });
    return false;
  }
  record.count++;
  socketEventCounts.set(key, record);
  return true;
};

export const setCatalogIo = (io: Namespace) => {
  catalogIo = io;
};

export const getCatalogIo = (): Namespace | null => {
  return catalogIo;
};

// Nueva función: Gestionar rooms con límites y expiración
export const joinRoom = (socketId: string, roomId: string): boolean => {
  try {
    if (!checkRateLimit(socketId, 'join-room')) return false;
    const room = roomLimits.get(roomId) || { sockets: new Set(), expiresAt: Date.now() + 30 * 60 * 1000 }; // 30 min
    if (room.sockets.size >= 5) {
      logger.warn('Room limit reached', { roomId, socketId, roomSize: room.sockets.size });
      return false; // Límite de 5 sockets por room
    }
    room.sockets.add(socketId);
    roomLimits.set(roomId, room);
    logger.info('Socket joined room', { socketId, roomId, roomSize: room.sockets.size });
    return true;
  } catch (error) {
    const appError = normalizeSocketError(error, { socketId, roomId, operation: 'joinRoom' });
    logger.error('Error joining room', { error: appError.message, stack: appError.stack });
    return false;
  }
};

export const leaveRoom = (socketId: string, roomId?: string) => {
  try {
    if (roomId) {
      const room = roomLimits.get(roomId);
      if (room) {
        room.sockets.delete(socketId);
        logger.info('Socket left room', { socketId, roomId, roomSize: room.sockets.size });
        if (room.sockets.size === 0) {
          roomLimits.delete(roomId);
          logger.info('Room cleaned up (empty)', { roomId });
        }
      }
    } else {
      // Si no se especifica roomId, salir de todas las rooms
      let roomsLeft = 0;
      for (const [rId, room] of roomLimits) {
        if (room.sockets.delete(socketId)) {
          roomsLeft++;
          logger.info('Socket left room (bulk)', { socketId, roomId: rId, roomSize: room.sockets.size });
          if (room.sockets.size === 0) {
            roomLimits.delete(rId);
            logger.info('Room cleaned up (empty)', { roomId: rId });
          }
        }
      }
      logger.info('Bulk leave completed', { socketId, roomsLeft });
    }
  } catch (error) {
    const appError = normalizeSocketError(error, { socketId, roomId, operation: 'leaveRoom' });
    logger.error('Error leaving room', { error: appError.message, stack: appError.stack });
  }
};

export const cleanupExpiredRooms = () => {
  try {
    const now = Date.now();
    let cleaned = 0;
    for (const [roomId, room] of roomLimits) {
      if (room.expiresAt < now) {
        roomLimits.delete(roomId);
        cleaned++;
        logger.info('Expired room cleaned up', { roomId, socketsRemoved: room.sockets.size });
      }
    }
    if (cleaned > 0) {
      logger.info('Cleanup completed', { roomsCleaned: cleaned, activeRooms: roomLimits.size });
    }
  } catch (error) {
    const appError = normalizeSocketError(error, { operation: 'cleanupExpiredRooms' });
    logger.error('Error during cleanup', { error: appError.message, stack: appError.stack });
  }
};

// Función para obtener métricas básicas
export const getSocketMetrics = () => {
  const totalSockets = Array.from(roomLimits.values()).reduce((sum, room) => sum + room.sockets.size, 0);
  return {
    activeRooms: roomLimits.size,
    totalSockets,
    rooms: Array.from(roomLimits.entries()).map(([roomId, room]) => ({
      roomId,
      socketCount: room.sockets.size,
      expiresAt: room.expiresAt,
    })),
  };
};
