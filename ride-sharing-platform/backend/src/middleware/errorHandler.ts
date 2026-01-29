import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import { ApiResponse } from '@rideshare/shared';
import { ErrorCodes } from '@rideshare/shared';
import { logger } from '../config/logger.js';

// Custom error class
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = ErrorCodes.INTERNAL_ERROR,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error response helper
function sendErrorResponse(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: Record<string, unknown>
): void {
  const response: ApiResponse<null> = {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
  res.status(statusCode).json(response);
}

// Global error handler
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error(`Error: ${err.message}`, { stack: err.stack });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    sendErrorResponse(
      res,
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Validation failed',
      { errors: err.flatten().fieldErrors }
    );
    return;
  }

  // Handle custom app errors
  if (err instanceof AppError) {
    sendErrorResponse(res, err.statusCode, err.code, err.message);
    return;
  }

  // Handle unknown errors
  sendErrorResponse(
    res,
    500,
    ErrorCodes.INTERNAL_ERROR,
    'An unexpected error occurred'
  );
}

// Async handler wrapper
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Request validation middleware
export function validate<T extends ZodSchema>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      req.body = parsed.body ?? req.body;
      req.query = parsed.query ?? req.query;
      req.params = parsed.params ?? req.params;
      next();
    } catch (error) {
      next(error);
    }
  };
}

// Not found handler
export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  sendErrorResponse(
    res,
    404,
    ErrorCodes.NOT_FOUND,
    `Route ${req.method} ${req.path} not found`
  );
}
