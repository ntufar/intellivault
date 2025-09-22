import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';
import { SearchService } from '../src/services/search.service';
import { SearchRequest, SearchResponse, SimilarDocumentsResponse } from '../src/models/search.model';
import { createTestClient } from './utils/test-client';
import Ajv from 'ajv';

describe('Search Service Response Formats', () => {
  let searchService: SearchService;
  let testToken: string;
  let ajv: Ajv;

  const searchResponseSchema = {
    type: 'object',
    required: ['results', 'total', 'page', 'pageSize', 'timing'],
    properties: {
      results: {
        type: 'array',
        items: {
          type: 'object',
          required: ['id', 'score', 'document', 'highlights', 'vectors'],
          properties: {
            id: { type: 'string' },
            score: { type: 'number', minimum: 0, maximum: 1 },
            document: {
              type: 'object',
              required: ['title', 'summary', 'metadata'],
              properties: {
                title: { type: 'string' },
                summary: { type: 'string' },
                metadata: { type: 'object' }
              }
            },
            highlights: {
              type: 'array',
              items: {
                type: 'object',
                required: ['field', 'fragments'],
                properties: {
                  field: { type: 'string' },
                  fragments: { 
                    type: 'array',
                    items: { type: 'string' }
                  }
                }
              }
            },
            vectors: {
              type: 'object',
              required: ['similarity', 'model'],
              properties: {
                similarity: { type: 'number', minimum: 0, maximum: 1 },
                model: { type: 'string' }
              }
            }
          }
        }
      },
      facets: {
        type: 'array',
        items: {
          type: 'object',
          required: ['field', 'values'],
          properties: {
            field: { type: 'string' },
            values: {
              type: 'array',
              items: {
                type: 'object',
                required: ['value', 'count'],
                properties: {
                  value: { type: 'string' },
                  count: { type: 'integer', minimum: 0 }
                }
              }
            }
          }
        }
      },
      total: { type: 'integer', minimum: 0 },
      page: { type: 'integer', minimum: 1 },
      pageSize: { type: 'integer', minimum: 1 },
      timing: {
        type: 'object',
        required: ['total', 'search', 'rank'],
        properties: {
          total: { type: 'number', minimum: 0 },
          search: { type: 'number', minimum: 0 },
          rank: { type: 'number', minimum: 0 }
        }
      }
    }
  };

  const similarDocumentsResponseSchema = {
    type: 'object',
    required: ['results'],
    properties: {
      results: {
        type: 'array',
        items: {
          type: 'object',
          required: ['id', 'similarity', 'document'],
          properties: {
            id: { type: 'string' },
            similarity: { type: 'number', minimum: 0, maximum: 1 },
            document: {
              type: 'object',
              required: ['title'],
              properties: {
                title: { type: 'string' },
                summary: { type: 'string' },
                content: { type: 'string' }
              }
            }
          }
        }
      }
    }
  };

  beforeAll(async () => {
    searchService = await SearchService.initialize();
    testToken = await createTestClient();
    ajv = new Ajv();
  });

  afterAll(async () => {
    await searchService.cleanup();
  });

  describe('Search Response Format', () => {
    test('should validate search response structure', async () => {
      const request: SearchRequest = {
        query: 'test document',
        searchType: 'semantic',
        facets: ['metadata.type']
      };

      const response = await searchService.search(request, testToken);
      const validateSearchResponse = ajv.compile(searchResponseSchema);
      const isValid = validateSearchResponse(response);

      expect(isValid).toBe(true);
      if (!isValid) {
        console.error('Validation errors:', validateSearchResponse.errors);
      }
    });

    test('should validate all required fields are present', async () => {
      const request: SearchRequest = {
        query: 'test document',
        searchType: 'semantic'
      };

      const response = await searchService.search(request, testToken);
      expect(response).toEqual(
        expect.objectContaining({
          results: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              score: expect.any(Number),
              document: expect.objectContaining({
                title: expect.any(String),
                summary: expect.any(String),
                metadata: expect.any(Object)
              }),
              highlights: expect.arrayContaining([
                expect.objectContaining({
                  field: expect.any(String),
                  fragments: expect.arrayContaining([expect.any(String)])
                })
              ]),
              vectors: expect.objectContaining({
                similarity: expect.any(Number),
                model: expect.any(String)
              })
            })
          ]),
          total: expect.any(Number),
          page: expect.any(Number),
          pageSize: expect.any(Number),
          timing: expect.objectContaining({
            total: expect.any(Number),
            search: expect.any(Number),
            rank: expect.any(Number)
          })
        })
      );
    });
  });

  describe('Similar Documents Response Format', () => {
    test('should validate similar documents response structure', async () => {
      const documentId = 'test-doc-1';
      const response = await searchService.getSimilarDocuments(documentId, {
        includeContent: true
      }, testToken);

      const validateSimilarDocsResponse = ajv.compile(similarDocumentsResponseSchema);
      const isValid = validateSimilarDocsResponse(response);

      expect(isValid).toBe(true);
      if (!isValid) {
        console.error('Validation errors:', validateSimilarDocsResponse.errors);
      }
    });

    test('should validate all required fields are present', async () => {
      const documentId = 'test-doc-1';
      const response = await searchService.getSimilarDocuments(documentId, {}, testToken);

      expect(response).toEqual(
        expect.objectContaining({
          results: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              similarity: expect.any(Number),
              document: expect.objectContaining({
                title: expect.any(String)
              })
            })
          ])
        })
      );
    });

    test('should include optional fields when requested', async () => {
      const documentId = 'test-doc-1';
      const response = await searchService.getSimilarDocuments(documentId, {
        includeContent: true
      }, testToken);

      expect(response.results[0].document).toEqual(
        expect.objectContaining({
          title: expect.any(String),
          summary: expect.any(String),
          content: expect.any(String)
        })
      );
    });
  });
});