import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';
import { SearchService } from '../src/services/search.service';
import { SearchRequest } from '../src/models/search.model';
import { createTestClient } from './utils/test-client';

describe('Search Service Error Cases', () => {
  let searchService: SearchService;
  let testToken: string;

  beforeAll(async () => {
    searchService = await SearchService.initialize();
    testToken = await createTestClient();
  });

  afterAll(async () => {
    await searchService.cleanup();
  });

  describe('Authentication and Authorization', () => {
    test('should reject requests with invalid token', async () => {
      const request: SearchRequest = {
        query: 'test',
        searchType: 'semantic'
      };

      await expect(searchService.search(request, 'invalid-token'))
        .rejects.toThrow('401 Unauthorized');
    });

    test('should reject requests with missing token', async () => {
      const request: SearchRequest = {
        query: 'test',
        searchType: 'semantic'
      };

      await expect(searchService.search(request, ''))
        .rejects.toThrow('401 Unauthorized');
    });
  });

  describe('Input Validation', () => {
    test('should reject empty search query', async () => {
      const request: SearchRequest = {
        query: '',
        searchType: 'semantic'
      };

      await expect(searchService.search(request, testToken))
        .rejects.toThrow('400 Bad Request');
    });

    test('should reject invalid search type', async () => {
      const request = {
        query: 'test',
        searchType: 'invalid'
      } as any;

      await expect(searchService.search(request, testToken))
        .rejects.toThrow('422 Unprocessable Entity');
    });

    test('should reject invalid filter operator', async () => {
      const request: SearchRequest = {
        query: 'test',
        searchType: 'semantic',
        filters: [{
          field: 'test',
          operator: 'invalid' as any,
          value: 'test'
        }]
      };

      await expect(searchService.search(request, testToken))
        .rejects.toThrow('422 Unprocessable Entity');
    });

    test('should reject non-existent document ID for similar documents', async () => {
      await expect(searchService.getSimilarDocuments('non-existent-id', {}, testToken))
        .rejects.toThrow('404 Not Found');
    });

    test('should reject invalid limit for similar documents', async () => {
      await expect(searchService.getSimilarDocuments('test-doc-1', { limit: -1 }, testToken))
        .rejects.toThrow('422 Unprocessable Entity');
    });
  });

  describe('Edge Cases', () => {
    test('should handle large page sizes', async () => {
      const request: SearchRequest = {
        query: 'test',
        searchType: 'semantic',
        pageSize: 1000
      };

      await expect(searchService.search(request, testToken))
        .rejects.toThrow('422 Unprocessable Entity - Page size exceeds maximum limit');
    });

    test('should handle non-existent page number', async () => {
      const request: SearchRequest = {
        query: 'test',
        searchType: 'semantic',
        page: 9999
      };

      const response = await searchService.search(request, testToken);
      expect(response.results).toHaveLength(0);
      expect(response.total).toBeDefined();
    });

    test('should handle extremely high minScore', async () => {
      const request: SearchRequest = {
        query: 'test',
        searchType: 'semantic',
        minScore: 0.99999
      };

      const response = await searchService.search(request, testToken);
      expect(response.results).toHaveLength(0);
    });

    test('should handle many concurrent requests', async () => {
      const requests = Array(10).fill({
        query: 'test',
        searchType: 'semantic'
      });

      await expect(Promise.all(
        requests.map(req => searchService.search(req, testToken))
      )).resolves.toBeDefined();
    });

    test('should handle extremely long search queries', async () => {
      const longQuery = 'a'.repeat(10000);
      const request: SearchRequest = {
        query: longQuery,
        searchType: 'semantic'
      };

      await expect(searchService.search(request, testToken))
        .rejects.toThrow('400 Bad Request - Query exceeds maximum length');
    });
  });

  describe('Rate Limiting', () => {
    test('should enforce rate limits', async () => {
      const requests = Array(100).fill({
        query: 'test',
        searchType: 'semantic'
      });

      try {
        await Promise.all(
          requests.map(req => searchService.search(req, testToken))
        );
      } catch (error) {
        expect(error.message).toContain('429 Too Many Requests');
      }
    });
  });
});