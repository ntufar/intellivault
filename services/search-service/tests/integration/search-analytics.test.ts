import { describe, beforeAll, afterAll, it, expect } from '@jest/globals';
import { TestClient } from '../utils/test-client';

describe('Search and Analytics Integration', () => {
  let searchClient: TestClient;
  let analyticsClient: TestClient;
  let documentIds: string[] = [];

  beforeAll(async () => {
    searchClient = new TestClient(process.env.SEARCH_SERVICE_URL);
    analyticsClient = new TestClient(process.env.ANALYTICS_SERVICE_URL);

    // Create test documents for search
    const documentClient = new TestClient(process.env.DOCUMENT_SERVICE_URL);
    const docs = await Promise.all([
      documentClient.post('/api/v1/documents', {
        file: Buffer.from('test content 1'),
        metadata: { title: 'Search Test 1', classification: 'public' }
      }),
      documentClient.post('/api/v1/documents', {
        file: Buffer.from('test content 2'),
        metadata: { title: 'Search Test 2', classification: 'confidential' }
      })
    ]);
    documentIds = docs.map(d => d.data.id);

    // Wait for documents to be processed
    for (const id of documentIds) {
      let status;
      do {
        const response = await documentClient.get(`/api/v1/documents/${id}/status`);
        status = response.data.status;
        await new Promise(resolve => setTimeout(resolve, 1000));
      } while (status === 'processing');
    }
  });

  it('should update analytics when documents are searched', async () => {
    // Perform searches
    const searchResponse = await searchClient.post('/api/v1/search', {
      query: 'Search Test',
      filters: [{ field: 'classification', operator: 'eq', value: 'public' }]
    });

    expect(searchResponse.status).toBe(200);
    expect(searchResponse.data.results).toHaveLength(1);

    // Verify analytics are updated
    const analyticsResponse = await analyticsClient.get('/api/v1/analytics/search');
    expect(analyticsResponse.status).toBe(200);
    expect(analyticsResponse.data.topQueries).toContainEqual(
      expect.objectContaining({
        query: 'Search Test'
      })
    );
  });

  it('should handle faceted search with analytics', async () => {
    const searchResponse = await searchClient.post('/api/v1/search', {
      query: 'Test',
      facets: ['classification'],
      searchType: 'semantic'
    });

    expect(searchResponse.status).toBe(200);
    expect(searchResponse.data.facets).toBeDefined();
    expect(searchResponse.data.facets.classification).toEqual(
      expect.arrayContaining(['public', 'confidential'])
    );

    // Verify search metrics in analytics
    const analyticsResponse = await analyticsClient.get('/api/v1/analytics/search', {
      params: {
        startDate: new Date(Date.now() - 3600000).toISOString(), // Last hour
        endDate: new Date().toISOString()
      }
    });

    expect(analyticsResponse.status).toBe(200);
    expect(analyticsResponse.data.facetUsage).toBeDefined();
    expect(analyticsResponse.data.facetUsage.classification).toBeGreaterThan(0);
  });

  it('should track document view analytics', async () => {
    // Simulate document views
    for (const id of documentIds) {
      await searchClient.post(`/api/v1/documents/${id}/view`);
    }

    // Check analytics for views
    const analyticsPromises = documentIds.map(id =>
      analyticsClient.get(`/api/v1/analytics/documents/${id}`, {
        params: {
          metrics: ['views']
        }
      })
    );

    const analyticsResponses = await Promise.all(analyticsPromises);
    analyticsResponses.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.data.metrics.views).toBeGreaterThan(0);
    });
  });
});