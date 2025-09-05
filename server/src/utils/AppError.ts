import { ErrorDetails } from '@custom-types/errorDetails';

export class AppError extends Error {
  public statusCode: number;
  public status: 'fail' | 'error';
  public isOperational: boolean;
  public details: ErrorDetails | undefined;

  constructor(
    message: string,
    statusCode = 500,
    status: 'fail' | 'error' = 'error',
    isOperational = true,
    details?: ErrorDetails,
  ) {
    super(message);
    this.name = this.constructor.name; // Set the name of the error to the class name

    this.statusCode = Math.min(Math.max(statusCode, 100), 599);
    this.status = status;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}
