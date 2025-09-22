import { Request, Response, NextFunction } from 'express';
import { logger, generateRequestId, createRequestLogger } from '../../lib/logger';

export interface RequestWithId extends Request {
  requestId: string;
  startTime: number;
}

// Request logging middleware
export const requestLogging = (req: RequestWithId, res: Response, next: NextFunction): void => {
  // Generate request ID
  req.requestId = generateRequestId();
  req.startTime = Date.now();

  const requestLogger = createRequestLogger(req.requestId);

  // Log request
  requestLogger.info('Request started', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    contentLength: req.get('Content-Length'),
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - req.startTime;
    
    requestLogger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      contentLength: res.get('Content-Length'),
    });

    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Error logging middleware
export const errorLogging = (
  error: Error,
  req: RequestWithId,
  res: Response,
  next: NextFunction
): void => {
  const requestLogger = createRequestLogger(req.requestId || 'unknown');
  
  requestLogger.error('Request error', {
    method: req.method,
    url: req.url,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    duration: req.startTime ? Date.now() - req.startTime : undefined,
  });

  next(error);
};
