interface ApiResponse<T = any> {
  status: number;
  data: T;
}

interface ApiError {
  response: ApiResponse<{
    error: string;
    message: string;
  }>;
}

class ApiRequestError extends Error implements ApiError {
  response: ApiResponse<{
    error: string;
    message: string;
  }>;

  constructor(status: number, error: string, message: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.response = {
      status,
      data: { error, message }
    };
  }
}

export class TestClient {
  private token: string | null = null;
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  async init(): Promise<void> {
    // Initialize test client with mock token
    this.token = 'test-token';
  }

  async cleanup(): Promise<void> {
    // Cleanup resources if needed
    this.token = null;
  }

  getToken(): string {
    if (!this.token) {
      throw new Error('TestClient not initialized');
    }
    return this.token;
  }

  setToken(token: string): void {
    this.token = token;
  }

  clearToken(): void {
    this.token = null;
  }

  private createError(status: number, error: string, message: string): ApiRequestError {
    return new ApiRequestError(status, error, message);
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.getToken()}`,
      'Content-Type': 'application/json',
    };
  }

  async get<T = any>(path: string, options: { params?: Record<string, any> } = {}): Promise<ApiResponse<T>> {
    // Validate authentication
    if (!this.token) {
      throw this.createError(401, 'Unauthorized', 'Missing authentication token');
    }

    // Check for limited access token
    if (this.token === 'limited-access-token' && path === '/api/v1/analytics/system') {
      throw this.createError(403, 'Forbidden', 'Insufficient permissions to access system metrics');
    }

    // Check for non-existent document
    if (path.includes('/api/v1/analytics/documents/non-existent-doc')) {
      throw this.createError(404, 'Not Found', 'Document not found');
    }

    // Validate date ranges
    const { startDate, endDate } = options.params || {};
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      throw this.createError(400, 'Bad Request', 'End date must be after start date');
    }

    // Validate metrics
    const { metrics } = options.params || {};
    if (metrics && Array.isArray(metrics)) {
      const validMetrics = ['cpu', 'memory', 'storage', 'requests'];
      const hasInvalidMetric = metrics.some(metric => !validMetrics.includes(metric));
      if (hasInvalidMetric) {
        throw this.createError(400, 'Bad Request', 'Invalid metric name provided');
      }
    }

    // Return mock response for valid requests
    return {
      status: 200,
      data: this.getMockResponse(path, options.params)
    };
  }

  private getMockResponse(path: string, params?: Record<string, any>): any {
    if (path.includes('/api/v1/analytics/documents/')) {
      return {
        id: path.split('/').pop(),
        metrics: {
          views: 150,
          downloads: 45,
          searches: 75,
          uniqueUsers: 30
        },
        timeline: [
          {
            date: '2025-09-01T00:00:00Z',
            metrics: {
              views: 50,
              downloads: 15,
              searches: 25
            }
          }
        ],
        topQueries: [
          {
            query: 'sample query',
            count: 25,
            avgPosition: 1.5
          }
        ]
      };
    } else if (path === '/api/v1/analytics/system') {
      const metrics = params?.metrics || [];
      const result: Record<string, any> = {};
      
      metrics.forEach((metric: string) => {
        result[metric] = {
          current: 45.5,
          average: 35.0,
          peak: 85.0,
          timeSeries: [
            {
              timestamp: '2025-09-22T12:00:00Z',
              value: 45.5
            }
          ]
        };
      });

      return result;
    } else if (path === '/api/v1/analytics/search') {
      return {
        summary: {
          totalQueries: 1000,
          uniqueQueries: 250,
          avgResponseTime: 150,
          successRate: 98.5
        },
        topQueries: [
          {
            query: 'example search',
            count: 50,
            avgResults: 15,
            avgResponseTime: 145
          }
        ],
        distribution: {
          byHour: [
            {
              hour: 12,
              count: 150
            }
          ],
          byDay: [
            {
              date: '2025-09-01',
              count: 350
            }
          ]
        }
      };
    }
    return {};
  }
}