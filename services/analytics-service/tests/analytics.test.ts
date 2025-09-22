import { TestClient } from './utils/test-client';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';

describe('Analytics Service API Tests', () => {
  let testClient: TestClient;

  beforeAll(async () => {
    testClient = new TestClient();
    await testClient.init();
  });

  afterAll(async () => {
    await testClient.cleanup();
  });

  describe('Document Analytics', () => {
    const testDocId = 'test-doc-123';
    const startDate = '2025-09-01T00:00:00Z';
    const endDate = '2025-09-22T23:59:59Z';

    it('should return document analytics with all metrics', async () => {
      const response = await testClient.get(`/api/v1/analytics/documents/${testDocId}`, {
        params: { startDate, endDate }
      });

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        id: testDocId,
        metrics: {
          views: expect.any(Number),
          downloads: expect.any(Number),
          searches: expect.any(Number),
          uniqueUsers: expect.any(Number)
        }
      });
    });

    it('should return document timeline data', async () => {
      const response = await testClient.get(`/api/v1/analytics/documents/${testDocId}`, {
        params: { startDate, endDate }
      });

      expect(response.status).toBe(200);
      expect(response.data.timeline).toBeDefined();
      expect(Array.isArray(response.data.timeline)).toBe(true);
      expect(response.data.timeline[0]).toMatchObject({
        date: expect.any(String),
        metrics: {
          views: expect.any(Number),
          downloads: expect.any(Number),
          searches: expect.any(Number)
        }
      });
    });

    it('should return top search queries for the document', async () => {
      const response = await testClient.get(`/api/v1/analytics/documents/${testDocId}`, {
        params: { startDate, endDate }
      });

      expect(response.status).toBe(200);
      expect(response.data.topQueries).toBeDefined();
      expect(Array.isArray(response.data.topQueries)).toBe(true);
      expect(response.data.topQueries[0]).toMatchObject({
        query: expect.any(String),
        count: expect.any(Number),
        avgPosition: expect.any(Number)
      });
    });

    it('should filter metrics based on query parameters', async () => {
      const response = await testClient.get(`/api/v1/analytics/documents/${testDocId}`, {
        params: {
          startDate,
          endDate,
          metrics: ['views', 'downloads']
        }
      });

      expect(response.status).toBe(200);
      expect(response.data.metrics).toHaveProperty('views');
      expect(response.data.metrics).toHaveProperty('downloads');
      expect(response.data.metrics).not.toHaveProperty('searches');
    });
  });

  describe('Search Analytics', () => {
    const startDate = '2025-09-01T00:00:00Z';
    const endDate = '2025-09-22T23:59:59Z';

    it('should return search analytics summary', async () => {
      const response = await testClient.get('/api/v1/analytics/search', {
        params: { startDate, endDate }
      });

      expect(response.status).toBe(200);
      expect(response.data.summary).toMatchObject({
        totalQueries: expect.any(Number),
        uniqueQueries: expect.any(Number),
        avgResponseTime: expect.any(Number),
        successRate: expect.any(Number)
      });
    });

    it('should return top search queries with metrics', async () => {
      const response = await testClient.get('/api/v1/analytics/search', {
        params: { startDate, endDate }
      });

      expect(response.status).toBe(200);
      expect(response.data.topQueries).toBeDefined();
      expect(Array.isArray(response.data.topQueries)).toBe(true);
      expect(response.data.topQueries[0]).toMatchObject({
        query: expect.any(String),
        count: expect.any(Number),
        avgResults: expect.any(Number),
        avgResponseTime: expect.any(Number)
      });
    });

    it('should return search distribution by hour and day', async () => {
      const response = await testClient.get('/api/v1/analytics/search', {
        params: { startDate, endDate }
      });

      expect(response.status).toBe(200);
      expect(response.data.distribution).toMatchObject({
        byHour: expect.arrayContaining([{
          hour: expect.any(Number),
          count: expect.any(Number)
        }]),
        byDay: expect.arrayContaining([{
          date: expect.any(String),
          count: expect.any(Number)
        }])
      });
    });

    it('should allow grouping results by different dimensions', async () => {
      const dimensions = ['query', 'user', 'document', 'date'];
      
      for (const groupBy of dimensions) {
        const response = await testClient.get('/api/v1/analytics/search', {
          params: { startDate, endDate, groupBy }
        });

        expect(response.status).toBe(200);
        expect(response.data.summary).toBeDefined();
        expect(response.data.topQueries).toBeDefined();
        expect(response.data.distribution).toBeDefined();
      }
    });
  });

  describe('System Metrics', () => {
    it('should return requested system metrics', async () => {
      const metrics = ['cpu', 'memory', 'storage', 'requests'];
      const response = await testClient.get('/api/v1/analytics/system', {
        params: { metrics }
      });

      expect(response.status).toBe(200);
      metrics.forEach(metric => {
        expect(response.data).toHaveProperty(metric);
        expect(response.data[metric]).toMatchObject({
          current: expect.any(Number),
          average: expect.any(Number),
          peak: expect.any(Number)
        });
      });
    });

    it('should return metrics with time series data', async () => {
      const metrics = ['cpu'];
      const response = await testClient.get('/api/v1/analytics/system', {
        params: { metrics }
      });

      expect(response.status).toBe(200);
      expect(response.data.cpu.timeSeries).toBeDefined();
      expect(Array.isArray(response.data.cpu.timeSeries)).toBe(true);
      expect(response.data.cpu.timeSeries[0]).toMatchObject({
        timestamp: expect.any(String),
        value: expect.any(Number)
      });
    });

    it('should handle custom time ranges for metrics', async () => {
      const metrics = ['memory'];
      const startTime = '2025-09-22T00:00:00Z';
      const endTime = '2025-09-22T23:59:59Z';
      
      const response = await testClient.get('/api/v1/analytics/system', {
        params: { metrics, startTime, endTime }
      });

      expect(response.status).toBe(200);
      expect(response.data.memory).toBeDefined();
      expect(response.data.memory.timeSeries).toBeDefined();
      expect(response.data.memory.timeSeries.every((point: any) => {
        const timestamp = new Date(point.timestamp);
        return timestamp >= new Date(startTime) && timestamp <= new Date(endTime);
      })).toBe(true);
    });
  });

  describe('Error Handling', () => {
    const testDocId = 'test-doc-123';

    it('should handle unauthorized requests', async () => {
      // Reset token to simulate unauthorized request
      testClient.clearToken();

      const endpoints = [
        `/api/v1/analytics/documents/${testDocId}`,
        '/api/v1/analytics/search',
        '/api/v1/analytics/system'
      ];

      for (const endpoint of endpoints) {
        const response = await testClient.get(endpoint).catch(err => err.response);
        expect(response.status).toBe(401);
        expect(response.data).toMatchObject({
          error: 'Unauthorized',
          message: expect.any(String)
        });
      }
    });

    it('should handle forbidden access', async () => {
      // Set token with insufficient permissions
      testClient.setToken('limited-access-token');

      const response = await testClient.get('/api/v1/analytics/system', {
        params: { metrics: ['cpu'] }
      }).catch(err => err.response);

      expect(response.status).toBe(403);
      expect(response.data).toMatchObject({
        error: 'Forbidden',
        message: expect.any(String)
      });
    });

    it('should handle non-existent document', async () => {
      const response = await testClient.get('/api/v1/analytics/documents/non-existent-doc', {
        params: { startDate: '2025-09-01T00:00:00Z', endDate: '2025-09-22T23:59:59Z' }
      }).catch(err => err.response);

      expect(response.status).toBe(404);
      expect(response.data).toMatchObject({
        error: 'Not Found',
        message: expect.any(String)
      });
    });

    it('should handle invalid date ranges', async () => {
      const response = await testClient.get('/api/v1/analytics/search', {
        params: {
          startDate: '2025-09-22T00:00:00Z',
          endDate: '2025-09-01T00:00:00Z' // End date before start date
        }
      }).catch(err => err.response);

      expect(response.status).toBe(400);
      expect(response.data).toMatchObject({
        error: 'Bad Request',
        message: expect.any(String)
      });
    });

    it('should handle invalid metric names', async () => {
      const response = await testClient.get('/api/v1/analytics/system', {
        params: {
          metrics: ['invalid_metric']
        }
      }).catch(err => err.response);

      expect(response.status).toBe(400);
      expect(response.data).toMatchObject({
        error: 'Bad Request',
        message: expect.any(String)
      });
    });
  });
});