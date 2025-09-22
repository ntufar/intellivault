import { describe, expect, test, beforeAll, afterAll, jest } from '@jest/globals';
import { SearchService } from '../src/services/search.service';
import { SearchRequest, SearchResponse, SimilarDocumentsResponse } from '../src/models/search.model';
import { createTestClient } from './utils/test-client';

describe('Search Service API Tests', () => {
  let searchService: SearchService;
  let testToken: string;

  beforeAll(async () => {
    searchService = await SearchService.initialize();
    testToken = await createTestClient();
  });

  afterAll(async () => {
    await searchService.cleanup();
  });

  describe('Semantic Search Endpoint', () => {
    test('should return valid search results with basic query', async () => {
      const request: SearchRequest = {
        query: 'test document',
        page: 1,
        pageSize: 10,
        searchType: 'semantic'
      };

      const response = await searchService.search(request, testToken);
      expect(response.results).toBeDefined();
      expect(Array.isArray(response.results)).toBe(true);
      expect(response.total).toBeDefined();
      expect(response.page).toBe(1);
      expect(response.pageSize).toBe(10);
      expect(response.timing).toBeDefined();
      expect(response.timing.total).toBeGreaterThan(0);
    });

    test('should handle different search types', async () => {
      const searchTypes: Array<'semantic' | 'keyword' | 'hybrid'> = ['semantic', 'keyword', 'hybrid'];
      
      for (const searchType of searchTypes) {
        const request: SearchRequest = {
          query: 'test document',
          searchType
        };

        const response = await searchService.search(request, testToken);
        expect(response.results).toBeDefined();
        expect(Array.isArray(response.results)).toBe(true);
        if (searchType === 'semantic' || searchType === 'hybrid') {
          expect(response.results[0].vectors).toBeDefined();
        }
      }
    });

    test('should apply filters correctly', async () => {
      const request: SearchRequest = {
        query: 'test document',
        filters: [
          {
            field: 'metadata.type',
            operator: 'eq',
            value: 'pdf'
          },
          {
            field: 'metadata.size',
            operator: 'gt',
            value: 1000
          }
        ],
        searchType: 'semantic'
      };

      const response = await searchService.search(request, testToken);
      expect(response.results.every(r => r.document.metadata.type === 'pdf')).toBe(true);
      expect(response.results.every(r => r.document.metadata.size > 1000)).toBe(true);
    });

    test('should apply sorting correctly', async () => {
      const request: SearchRequest = {
        query: 'test document',
        sort: [
          {
            field: 'score',
            order: 'desc'
          },
          {
            field: 'metadata.createdAt',
            order: 'desc'
          }
        ],
        searchType: 'semantic'
      };

      const response = await searchService.search(request, testToken);
      expect(response.results.length).toBeGreaterThan(1);
      
      // Check score sorting
      for (let i = 1; i < response.results.length; i++) {
        expect(response.results[i-1].score).toBeGreaterThanOrEqual(response.results[i].score);
      }
    });

    test('should return facets when requested', async () => {
      const request: SearchRequest = {
        query: 'test document',
        facets: ['metadata.type', 'metadata.category'],
        searchType: 'semantic'
      };

      const response = await searchService.search(request, testToken);
      expect(response.facets).toBeDefined();
      expect(response.facets.length).toBe(2);
      expect(response.facets[0].field).toBe('metadata.type');
      expect(response.facets[1].field).toBe('metadata.category');
      expect(response.facets[0].values).toBeDefined();
      expect(response.facets[0].values.length).toBeGreaterThan(0);
      expect(response.facets[0].values[0]).toHaveProperty('value');
      expect(response.facets[0].values[0]).toHaveProperty('count');
    });

    test('should apply minScore filter correctly', async () => {
      const request: SearchRequest = {
        query: 'test document',
        minScore: 0.7,
        searchType: 'semantic'
      };

      const response = await searchService.search(request, testToken);
      expect(response.results.every(r => r.score >= 0.7)).toBe(true);
    });
  });

  describe('Similar Documents Endpoint', () => {
    const documentId = 'test-doc-1';

    test('should return similar documents with valid id', async () => {
      const response = await searchService.getSimilarDocuments(documentId, {
        limit: 5,
        minScore: 0.7,
        includeContent: false
      }, testToken);

      expect(response.results).toBeDefined();
      expect(Array.isArray(response.results)).toBe(true);
      expect(response.results.length).toBeLessThanOrEqual(5);
      expect(response.results[0].similarity).toBeGreaterThanOrEqual(0.7);
      expect(response.results[0].document.title).toBeDefined();
      expect(response.results[0].document.content).toBeUndefined();
    });

    test('should include content when requested', async () => {
      const response = await searchService.getSimilarDocuments(documentId, {
        limit: 3,
        includeContent: true
      }, testToken);

      expect(response.results).toBeDefined();
      expect(response.results.length).toBeLessThanOrEqual(3);
      expect(response.results[0].document.content).toBeDefined();
    });

    test('should respect minScore parameter', async () => {
      const response = await searchService.getSimilarDocuments(documentId, {
        minScore: 0.9
      }, testToken);

      expect(response.results.every(doc => doc.similarity >= 0.9)).toBe(true);
    });

    test('should use default values when options not provided', async () => {
      const response = await searchService.getSimilarDocuments(documentId, {}, testToken);

      expect(response.results.length).toBeLessThanOrEqual(10); // default limit
      expect(response.results[0].document.content).toBeUndefined(); // default includeContent
      expect(response.results.every(doc => doc.similarity >= 0.7)).toBe(true); // default minScore
    });

    test('should sort results by similarity in descending order', async () => {
      const response = await searchService.getSimilarDocuments(documentId, {
        limit: 5
      }, testToken);

      for (let i = 1; i < response.results.length; i++) {
        expect(response.results[i-1].similarity).toBeGreaterThanOrEqual(response.results[i].similarity);
      }
    });
  });
});