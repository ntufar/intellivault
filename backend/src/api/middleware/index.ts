// Authentication middleware
export {
  authenticateToken,
  requireRole,
  requireTenantAccess,
  optionalAuth,
  type AuthenticatedRequest,
} from './auth';

// Logging middleware
export {
  requestLogging,
  errorLogging,
  type RequestWithId,
} from './logging';

// Security middleware
export {
  securityHeaders,
  corsOptions,
  createRateLimit,
  apiRateLimit,
  authRateLimit,
  uploadRateLimit,
  searchRateLimit,
  requestId,
  validateContentType,
  validateFileUpload,
  sanitizeLogData,
} from './security';

// Error handling middleware
export {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ServiceUnavailableError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  createValidationError,
  createNotFoundError,
  type CustomError,
} from './errorHandler';
