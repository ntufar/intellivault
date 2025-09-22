import { describe, beforeAll, afterAll, it, expect } from '@jest/globals';
import { TestClient } from '../utils/test-client';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('End-to-end Document Processing Flow', () => {
  let documentClient: TestClient;
  let searchClient: TestClient;
  let analyticsClient: TestClient;

  beforeAll(async () => {
    documentClient = new TestClient(process.env.DOCUMENT_SERVICE_URL);
    searchClient = new TestClient(process.env.SEARCH_SERVICE_URL);
    analyticsClient = new TestClient(process.env.ANALYTICS_SERVICE_URL);
  });

  afterAll(async () => {
    await documentClient.cleanup();
    await searchClient.cleanup();
    await analyticsClient.cleanup();
  });

  it('should process document through the complete pipeline', async () => {
    // 1. Upload document
    const testFile = readFileSync(join(__dirname, '../fixtures/test-document.pdf'));
    const uploadResponse = await documentClient.post('/api/v1/documents', {
      file: testFile,
      metadata: {
        title: 'Test Document',
        author: ['Test Author'],
        keywords: ['test', 'integration'],
        classification: 'public',
        confidentiality: 'low'
      }
    });

    expect(uploadResponse.status).toBe(201);
    const { id } = uploadResponse.data;

    // 2. Monitor processing status
    let status;
    do {
      const statusResponse = await documentClient.get(`/api/v1/documents/${id}/status`);
      status = statusResponse.data.status;
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between checks
    } while (status === 'processing');

    expect(status).toBe('completed');

    // 3. Verify document is searchable
    const searchResponse = await searchClient.post('/api/v1/search', {
      query: 'Test Document',
      filters: [
        { field: 'classification', operator: 'eq', value: 'public' }
      ]
    });

    expect(searchResponse.status).toBe(200);
    expect(searchResponse.data.results).toHaveLength(1);
    expect(searchResponse.data.results[0].id).toBe(id);

    // 4. Check analytics are being collected
    const analyticsResponse = await analyticsClient.get(`/api/v1/analytics/documents/${id}`);
    expect(analyticsResponse.status).toBe(200);
    expect(analyticsResponse.data.metrics).toBeDefined();
  }, 300000); // 5 minute timeout for complete flow

  it('should handle concurrent document uploads', async () => {
    const testFile = readFileSync(join(__dirname, '../fixtures/test-document.pdf'));
    const uploads = Array(5).fill(null).map(() => 
      documentClient.post('/api/v1/documents', {
        file: testFile,
        metadata: {
          title: 'Concurrent Test Document',
          classification: 'public'
        }
      })
    );

    const responses = await Promise.all(uploads);
    responses.forEach(response => {
      expect(response.status).toBe(201);
      expect(response.data.id).toBeDefined();
    });
  });
});