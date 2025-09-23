# IntelliVault API Architecture

## Overview

The IntelliVault API follows RESTful principles with a focus on simplicity, consistency, and developer experience. The API is designed to be self-documenting, versioned, and optimized for both human and machine consumption.

## API Design Principles

### 1. RESTful Design
- **Resource-Based URLs**: Clear, hierarchical resource identification
- **HTTP Methods**: Proper use of GET, POST, PUT, DELETE for different operations
- **Status Codes**: Meaningful HTTP status codes for all responses
- **Stateless**: Each request contains all necessary information

### 2. Consistency
- **Naming Conventions**: Consistent camelCase for JSON properties
- **Response Format**: Standardized response structure across all endpoints
- **Error Handling**: Uniform error response format
- **Pagination**: Consistent pagination parameters and response structure

### 3. Versioning Strategy
- **URL Versioning**: `/v1/` prefix for clear API versioning
- **Backward Compatibility**: Maintain compatibility for at least 2 major versions
- **Deprecation Policy**: Clear deprecation timeline with migration guides

## API Endpoints

### Core Endpoints

#### Document Management
```http
# List documents
GET /v1/documents?tenantId={id}&limit={n}&offset={n}

# Upload document
POST /v1/documents?tenantId={id}
Content-Type: multipart/form-data

# Get document details
GET /v1/documents/{documentId}?tenantId={id}

# Delete document
DELETE /v1/documents/{documentId}?tenantId={id}
```

#### Search Operations
```http
# Semantic search
GET /v1/search?tenantId={id}&q={query}&k={topK}&filters={json}

# Vector search
POST /v1/search/vector?tenantId={id}
Content-Type: application/json
{
  "vector": [0.1, 0.2, ...],
  "k": 10,
  "filters": {...}
}
```

#### Question & Answer
```http
# Ask questions
POST /v1/qa?tenantId={id}
Content-Type: application/json
{
  "question": "What are the payment terms?",
  "k": 10,
  "include_sources": true
}
```

#### Knowledge Graph
```http
# Explore entities
GET /v1/graph/entities?tenantId={id}&entity={name}&depth={n}

# Get relationships
GET /v1/graph/relationships?tenantId={id}&entity={id}
```

### Authentication Endpoints
```http
# Login
POST /v1/auth/login
{
  "email": "user@example.com",
  "password": "password"
}

# Refresh token
POST /v1/auth/refresh
{
  "refresh_token": "token"
}

# Logout
POST /v1/auth/logout
```

## Request/Response Formats

### Standard Response Structure
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "request_id": "req_123",
    "timestamp": "2025-01-01T00:00:00Z",
    "version": "v1"
  },
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 100,
    "has_more": true
  }
}
```

### Error Response Structure
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "tenantId",
        "message": "Required field is missing",
        "code": "REQUIRED"
      }
    ]
  },
  "meta": {
    "request_id": "req_123",
    "timestamp": "2025-01-01T00:00:00Z"
  }
}
```

### Document Schema
```json
{
  "id": "doc_123",
  "tenant_id": "tenant_456",
  "filename": "contract.pdf",
  "mime_type": "application/pdf",
  "size_bytes": 1024000,
  "status": "ready",
  "metadata": {
    "title": "Service Agreement",
    "author": "John Doe",
    "created_date": "2024-12-01",
    "language": "en",
    "page_count": 25
  },
  "processing": {
    "started_at": "2025-01-01T00:00:00Z",
    "completed_at": "2025-01-01T00:05:00Z",
    "chunks_count": 150,
    "entities_count": 45
  },
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:05:00Z"
}
```

### Search Result Schema
```json
{
  "id": "chunk_789",
  "document_id": "doc_123",
  "chunk_index": 5,
  "score": 0.95,
  "content": "Payment terms are 30 days net...",
  "highlight": "Payment <mark>terms</mark> are 30 days net...",
  "metadata": {
    "page_number": 3,
    "section_title": "Payment Terms"
  },
  "entities": [
    {
      "type": "MONEY",
      "value": "30 days",
      "confidence": 0.98
    }
  ]
}
```

## Authentication & Authorization

### JWT Token Structure
```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user_123",
    "tenant_id": "tenant_456",
    "role": "admin",
    "permissions": ["read", "write", "admin"],
    "iat": 1640995200,
    "exp": 1641081600,
    "iss": "intellivault-api"
  }
}
```

### Authorization Headers
```http
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
X-Tenant-ID: tenant_456
X-Request-ID: req_123
```

### Role-Based Access Control
```typescript
enum Permission {
  DOCUMENTS_READ = 'documents:read',
  DOCUMENTS_WRITE = 'documents:write',
  DOCUMENTS_DELETE = 'documents:delete',
  SEARCH_READ = 'search:read',
  ANALYTICS_READ = 'analytics:read',
  ADMIN_ALL = 'admin:all'
}

enum Role {
  VIEWER = 'viewer',
  USER = 'user',
  ADMIN = 'admin'
}

const rolePermissions = {
  [Role.VIEWER]: [Permission.DOCUMENTS_READ, Permission.SEARCH_READ],
  [Role.USER]: [Permission.DOCUMENTS_READ, Permission.DOCUMENTS_WRITE, Permission.SEARCH_READ],
  [Role.ADMIN]: Object.values(Permission)
};
```

## Rate Limiting

### Rate Limit Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
X-RateLimit-Retry-After: 60
```

### Rate Limiting Rules
```typescript
const rateLimits = {
  'search': { requests: 100, window: '1m' },
  'documents': { requests: 50, window: '1m' },
  'qa': { requests: 20, window: '1m' },
  'auth': { requests: 10, window: '1m' },
  'default': { requests: 1000, window: '1h' }
};
```

## Input Validation

### Request Validation Schema
```typescript
import { z } from 'zod';

const DocumentUploadSchema = z.object({
  tenantId: z.string().uuid(),
  file: z.object({
    name: z.string().min(1).max(255),
    type: z.string().regex(/^[a-zA-Z0-9\/\-\.]+$/),
    size: z.number().min(1).max(100 * 1024 * 1024) // 100MB max
  })
});

const SearchQuerySchema = z.object({
  tenantId: z.string().uuid(),
  q: z.string().min(1).max(500),
  k: z.number().int().min(1).max(100).default(10),
  filters: z.object({
    mime_type: z.array(z.string()).optional(),
    date_range: z.object({
      start: z.string().datetime().optional(),
      end: z.string().datetime().optional()
    }).optional()
  }).optional()
});
```

### Validation Middleware
```typescript
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request parameters',
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
              code: err.code
            }))
          }
        });
      } else {
        next(error);
      }
    }
  };
};
```

## Error Handling

### Error Categories
```typescript
enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Resources
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  DUPLICATE_KEY = 'DUPLICATE_KEY',
  
  // External Services
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Internal
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR'
}
```

### Error Handler Implementation
```typescript
export class APIError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let code = ErrorCode.INTERNAL_ERROR;
  let message = 'Internal server error';
  let details = undefined;

  if (error instanceof APIError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    details = error.details;
  } else if (error instanceof z.ZodError) {
    statusCode = 400;
    code = ErrorCode.VALIDATION_ERROR;
    message = 'Validation failed';
    details = error.errors;
  }

  res.status(statusCode).json({
    success: false,
    error: { code, message, details },
    meta: {
      request_id: req.headers['x-request-id'],
      timestamp: new Date().toISOString()
    }
  });
};
```

## API Documentation

### OpenAPI Specification
The API is fully documented using OpenAPI 3.1 specification located at `/specs/001-intellivault-ai-powered/contracts/openapi.yaml`.

### Interactive Documentation
- **Swagger UI**: Available at `/docs` endpoint
- **ReDoc**: Available at `/docs/redoc` endpoint
- **Postman Collection**: Exported collection for testing

### SDK Generation
```bash
# Generate TypeScript client
npx @openapitools/openapi-generator-cli generate \
  -i openapi.yaml \
  -g typescript-axios \
  -o ./clients/typescript

# Generate Python client
npx @openapitools/openapi-generator-cli generate \
  -i openapi.yaml \
  -g python \
  -o ./clients/python
```

## Performance Optimization

### Response Caching
```typescript
const cacheConfig = {
  'search': { ttl: 300, maxSize: 1000 },      // 5 minutes
  'documents': { ttl: 3600, maxSize: 100 },   // 1 hour
  'qa': { ttl: 600, maxSize: 500 },           // 10 minutes
  'graph': { ttl: 1800, maxSize: 200 }        // 30 minutes
};
```

### Response Compression
```typescript
import compression from 'compression';

app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024, // Only compress responses > 1KB
  level: 6
}));
```

### Database Query Optimization
```typescript
class QueryOptimizer {
  optimizeDocumentQuery(filters: DocumentFilters): OptimizedQuery {
    const query: any = { tenant_id: filters.tenantId };
    const projection: any = {};
    
    // Add filters
    if (filters.status) query.status = filters.status;
    if (filters.mime_type) query.mime_type = { $in: filters.mime_type };
    if (filters.date_range) {
      query.created_at = {
        $gte: filters.date_range.start,
        $lte: filters.date_range.end
      };
    }
    
    // Optimize projection
    projection.id = 1;
    projection.filename = 1;
    projection.status = 1;
    projection.created_at = 1;
    
    return {
      filter: query,
      projection,
      sort: { created_at: -1 },
      limit: filters.limit || 50,
      skip: filters.offset || 0
    };
  }
}
```

## Monitoring & Analytics

### Request Metrics
```typescript
const metrics = {
  request_count: new Counter('api_requests_total', ['method', 'endpoint', 'status']),
  request_duration: new Histogram('api_request_duration_seconds', ['method', 'endpoint']),
  active_connections: new Gauge('api_active_connections'),
  error_rate: new Counter('api_errors_total', ['error_code'])
};
```

### Health Check Endpoint
```http
GET /v1/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00Z",
  "version": "1.0.0",
  "checks": {
    "database": { "status": "healthy", "response_time": 45 },
    "search": { "status": "healthy", "response_time": 120 },
    "storage": { "status": "healthy", "response_time": 89 },
    "openai": { "status": "healthy", "response_time": 234 }
  }
}
```

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Next Review**: March 2025
