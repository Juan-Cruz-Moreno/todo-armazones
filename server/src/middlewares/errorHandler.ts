import { NextFunction, Request, Response } from 'express';
import env from '@config/env';
import { AppError } from '@utils/AppError';
import { normalizeError } from '@utils/normalizeError';
import logger from '@config/logger';

// Middleware de manejo de errores
export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const isDev = env.NODE_ENV === 'development';
  const appError: AppError = normalizeError(err);

  const { statusCode, status, isOperational, details } = appError;

  // Log del error
  try {
    if (!isOperational || isDev) {
      logger.error('Error handled:', {
        message: appError.message,
        stack: appError.stack,
        statusCode,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        details,
      });
    }
  } catch (loggingError: unknown) {
    logger.error('Failed to log error:', loggingError);
  }

  // Estructura de la respuesta
  const responseBody: Record<string, unknown> = {
    status,
    message: appError.message || 'Internal Server Error',
  };

  if (isDev) {
    responseBody.stack = appError.stack;
    if (details) responseBody.details = details;
  }

  // Enviar la respuesta
  try {
    res.status(statusCode).json(responseBody);
  } catch (jsonError) {
    logger.error('Failed to send error response:', jsonError);
    res.status(500).send('Internal Server Error');
  }
};
