import { UserRole } from '@enums/user.enum';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '@utils/AppError'; // Asegúrate de importar la clase AppError
import logger from '@config/logger'; // Importamos el logger

// Middleware para verificar si la sesión existe
const checkSession = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.session || !req.session.user) {
    const error = new AppError('Unauthorized: Please log in', 401, 'error', true);
    logger.warn('Unauthorized access attempt', {
      message: error.message,
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
    });
    return next(error);
  }
  next();
};

// Middleware para verificar el rol de un usuario
const checkRole = (role: UserRole) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.session || !req.session.user) {
      const error = new AppError('Unauthorized: Please log in', 401, 'error', true);
      logger.warn('Unauthorized access attempt', {
        message: error.message,
        ip: req.ip,
        url: req.originalUrl,
        method: req.method,
      });
      return next(error);
    }

    if (req.session.user.role !== role) {
      const error = new AppError(`Forbidden: Only ${role}s can access this`, 403, 'error', true, {
        attemptedRole: req.session.user.role,
        requiredRole: role,
      });
      logger.warn('Forbidden access attempt', {
        message: error.message,
        ip: req.ip,
        url: req.originalUrl,
        method: req.method,
        attemptedRole: req.session.user.role,
        requiredRole: role,
      });
      return next(error);
    }

    next();
  };
};

// Middleware específico para admins
const checkAdmin = checkRole(UserRole.Admin);

export { checkSession, checkAdmin, checkRole };
