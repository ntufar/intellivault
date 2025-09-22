import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger, createRequestLogger } from '../../lib/logger';

export interface CustomError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

// Custom error classes
export class ValidationError extends Error implements CustomError {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
  details: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class NotFoundError extends Error implements CustomError {
  statusCode = 404;
  code = 'NOT_FOUND';

  constructor(resource: string, id?: string) {
    super(`${resource}${id ? ` with ID ${id}` : ''} not found`);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error implements CustomError {
  statusCode = 401;
  code = 'UNAUTHORIZED';

  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error implements CustomError {
  statusCode = 403;
  code = 'FORBIDDEN';

  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends Error implements CustomError {
  statusCode = 409;
  code = 'CONFLICT';

  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class ServiceUnavailableError extends Error implements CustomError {
  statusCode = 503;
  code = 'SERVICE_UNAVAILABLE';

  constructor(message: string = 'Service temporarily unavailable') {
    super(message);
    this.name = 'ServiceUnavailableError';
  }
}

// Global error handler
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestLogger = createRequestLogger(req.headers['x-request-id'] as string || 'unknown');
  
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'Internal server error';
  let details: any = undefined;

  // Handle different error types
  if (error instanceof CustomError) {
    statusCode = error.statusCode || 500;
    code = error.code || 'INTERNAL_SERVER_ERROR';
    message = error.message;
    details = error.details;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));
  } else if (error.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = 'Invalid ID format';
  } else if (error.name === 'MongoError' && (error as any).code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_KEY';
    message = 'Resource already exists';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token expired';
  }

  // Log error
  const logLevel = statusCode >= 500 ? 'error' : 'warn';
  requestLogger[logLevel]('Request error', {
    method: req.method,
    url: req.url,
    statusCode,
    code,
    message,
    details,
    stack: statusCode >= 500 ? error.stack : undefined,
  });

  // Send error response
  const errorResponse: any = {
    error: {
      code,
      message,
    },
    requestId: req.headers['x-request-id'],
  };

  if (details) {
    errorResponse.error.details = details;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && statusCode >= 500) {
    errorResponse.stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
};

// 404 handler for unmatched routes
export const notFoundHandler = (req: Request, res: Response): void => {
  const requestLogger = createRequestLogger(req.headers['x-request-id'] as string || 'unknown');
  
  requestLogger.warn('Route not found', {
    method: req.method,
    url: req.url,
  });

  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.url} not found`,
    },
    requestId: req.headers['x-request-id'],
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Validation error helper
export const createValidationError = (message: string, details?: any): ValidationError => {
  return new ValidationError(message, details);
};

// Not found error helper
export const createNotFoundError = (resource: string, id?: string): NotFoundError => {
  return new NotFoundError(resource, id);
};
