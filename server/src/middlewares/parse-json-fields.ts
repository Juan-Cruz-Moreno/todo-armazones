import { Request, Response, NextFunction } from 'express';
import { AppError } from '@utils/AppError';

export function parseJsonFields(fields: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      for (const field of fields) {
        if (req.body[field] && typeof req.body[field] === 'string') {
          req.body[field] = JSON.parse(req.body[field]);
        }
      }
      next();
    } catch (_error) {
      next(new AppError('JSON inválido en campos del formulario', 400, 'fail', false));
    }
  };
}
