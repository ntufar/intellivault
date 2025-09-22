import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Security headers middleware using Helmet
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for API
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// CORS configuration
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Request-ID'],
};

// Rate limiting
export const createRateLimit = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: message || 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.round(windowMs / 1000),
      });
    },
  });
};

// General API rate limiting (100 requests per 15 minutes)
export const apiRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests
  'Too many API requests, please try again later.'
);

// Strict rate limiting for authentication endpoints
export const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 requests
  'Too many authentication attempts, please try again later.'
);

// Upload rate limiting
export const uploadRateLimit = createRateLimit(
  60 * 1000, // 1 minute
  10, // 10 uploads
  'Too many upload requests, please try again later.'
);

// Search rate limiting
export const searchRateLimit = createRateLimit(
  60 * 1000, // 1 minute
  60, // 60 searches
  'Too many search requests, please try again later.'
);

// Request ID middleware
export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.get('X-Request-ID') || req.get('x-request-id') || 'unknown';
  req.headers['x-request-id'] = requestId;
  res.set('X-Request-ID', requestId);
  next();
};

// Input validation and sanitization
export const validateContentType = (allowedTypes: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentType = req.get('Content-Type');
    
    if (req.method === 'POST' || req.method === 'PUT') {
      if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
        res.status(415).json({
          error: 'Unsupported Media Type',
          allowedTypes,
        });
        return;
      }
    }
    
    next();
  };
};

// File upload validation
export const validateFileUpload = (maxSize: number, allowedTypes: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.file) {
      // Check file size
      if (req.file.size > maxSize) {
        res.status(413).json({
          error: 'File too large',
          maxSize,
          actualSize: req.file.size,
        });
        return;
      }
      
      // Check file type
      if (!allowedTypes.includes(req.file.mimetype)) {
        res.status(415).json({
          error: 'Unsupported file type',
          allowedTypes,
          actualType: req.file.mimetype,
        });
        return;
      }
    }
    
    next();
  };
};

// Prevent sensitive data in logs
export const sanitizeLogData = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
  const sanitized = { ...data };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
};
