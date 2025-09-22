import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger, createRequestLogger } from '../../lib/logger';
import { AuthService } from '../../services/AuthService';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    tenantId?: string;
  };
  requestId: string;
}

// JWT authentication middleware
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const requestLogger = createRequestLogger(req.requestId || 'unknown');
  
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      requestLogger.warn('Authentication failed: No token provided');
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;
    
    // Get user details from AuthService
    const authService = new AuthService();
    const user = await authService.getUserById(decoded.userId);
    
    if (!user) {
      requestLogger.warn('Authentication failed: User not found', { userId: decoded.userId });
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: decoded.tenantId,
    };

    requestLogger.debug('User authenticated successfully', {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    next();
  } catch (error) {
    requestLogger.error('Authentication failed', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
    } else {
      res.status(500).json({ error: 'Authentication error' });
    }
  }
};

// Role-based access control middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const requestLogger = createRequestLogger(req.requestId || 'unknown');
    
    if (!req.user) {
      requestLogger.warn('Authorization failed: No user in request');
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      requestLogger.warn('Authorization failed: Insufficient role', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
      });
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    requestLogger.debug('Role authorization successful', {
      userId: req.user.id,
      role: req.user.role,
    });

    next();
  };
};

// Tenant access control middleware
export const requireTenantAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const requestLogger = createRequestLogger(req.requestId || 'unknown');
  
  if (!req.user) {
    requestLogger.warn('Tenant authorization failed: No user in request');
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const requestedTenantId = req.query.tenantId || req.body.tenantId || req.params.tenantId;
  
  // Admins can access any tenant
  if (req.user.role === 'admin') {
    requestLogger.debug('Admin tenant access granted', {
      userId: req.user.id,
      requestedTenantId,
    });
    next();
    return;
  }

  // Regular users can only access their own tenant
  if (req.user.tenantId !== requestedTenantId) {
    requestLogger.warn('Tenant authorization failed: Tenant mismatch', {
      userId: req.user.id,
      userTenantId: req.user.tenantId,
      requestedTenantId,
    });
    res.status(403).json({ error: 'Access denied for this tenant' });
    return;
  }

  requestLogger.debug('Tenant authorization successful', {
    userId: req.user.id,
    tenantId: req.user.tenantId,
  });

  next();
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;
    const authService = new AuthService();
    const user = await authService.getUserById(decoded.userId);
    
    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: decoded.tenantId,
      };
    }
  } catch (error) {
    // Silently ignore authentication errors for optional auth
    logger.debug('Optional authentication failed', { error });
  }

  next();
};
