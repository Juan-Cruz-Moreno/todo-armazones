import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import type { TypeOf } from 'zod';

export interface ValidationSchemas {
  body?: ZodSchema<unknown>;
  query?: ZodSchema<unknown>;
  params?: ZodSchema<unknown>;
}

type ExtractType<T extends ZodSchema<unknown> | undefined> = T extends ZodSchema<unknown> ? TypeOf<T> : unknown;

export function validateRequest<T extends ValidationSchemas>(schemas: T) {
  return (
    req: Request<ExtractType<T['params']>, unknown, ExtractType<T['body']>, ExtractType<T['query']>>,
    res: Response,
    next: NextFunction,
  ): void => {
    try {
      if (schemas.body) {
        const parsed = schemas.body.safeParse(req.body);
        if (!parsed.success) {
          handleValidationError(res, parsed.error);
          return;
        }
        req.body = parsed.data as ExtractType<T['body']>;
      }

      if (schemas.query) {
        const parsed = schemas.query.safeParse(req.query);
        if (!parsed.success) {
          handleValidationError(res, parsed.error);
          return;
        }
        req.query = parsed.data as ExtractType<T['query']>;
      }

      if (schemas.params) {
        const parsed = schemas.params.safeParse(req.params);
        if (!parsed.success) {
          handleValidationError(res, parsed.error);
          return;
        }
        req.params = parsed.data as ExtractType<T['params']>;
      }

      next();
    } catch (error) {
      console.error('Validation middleware error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
}

function handleValidationError(res: Response, error: ZodError) {
  res.status(400).json({
    message: 'Validation error',
    errors: error.format(),
  });
}
