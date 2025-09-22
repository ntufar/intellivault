import { describe, beforeAll, afterAll, it, expect } from '@jest/globals';
import { TestClient } from '../utils/test-client';

describe('Performance Requirements', () => {
  let documentClient: TestClient;
  let searchClient: TestClient;

  beforeAll(async () => {
    documentClient = new TestClient(process.env.DOCUMENT_SERVICE_URL as string);
    searchClient = new TestClient(process.env.SEARCH_SERVICE_URL as string);
  });

  it('should meet document processing time requirements', async () => {
    const testFile = Buffer.from('test content');
    const startTime = Date.now();
    
    // Upload document
    const uploadResponse = await documentClient.post('/api/v1/documents', {
      file: testFile,
      metadata: { title: 'Performance Test Document' }
    });
    expect(uploadResponse.status).toBe(201);
    
    // Monitor processing
    let status;
    do {
      const statusResponse = await documentClient.get(`/api/v1/documents/${uploadResponse.data.id}/status`);
      status = statusResponse.data.status;
      await new Promise(resolve => setTimeout(resolve, 1000));
    } while (status === 'processing');

    const processingTime = Date.now() - startTime;
    expect(processingTime).toBeLessThan(5 * 60 * 1000); // Less than 5 minutes
  });

  it('should meet search latency requirements', async () => {
    const searchPromises = Array(10).fill(null).map(() => {
      const startTime = Date.now();
      return searchClient.post('/api/v1/search', {
        query: 'test document',
        searchType: 'semantic'
      }).then(response => {
        const latency = Date.now() - startTime;
        return { response, latency };
      });
    });

    const results = await Promise.all(searchPromises);
    
    // Check 95th percentile latency
    const latencies = results.map(r => r.latency).sort((a, b) => a - b);
    const p95Index = Math.ceil(latencies.length * 0.95) - 1;
    const p95Latency = latencies[p95Index];
    
    expect(p95Latency).toBeLessThan(2000); // Less than 2s for 95th percentile
  });

  it('should handle concurrent users', async () => {
    const concurrentUsers = 100;
    const searchPromises = Array(concurrentUsers).fill(null).map(() =>
      searchClient.post('/api/v1/search', {
        query: 'test',
        filters: [{ field: 'classification', operator: 'eq', value: 'public' }]
      })
    );

    const results = await Promise.all(searchPromises);
    results.forEach(response => {
      expect(response.status).toBe(200);
    });
  });

  it('should meet document processing throughput requirements', async () => {
    const documentsPerHour = 10000;
    const testDuration = 5 * 60 * 1000; // 5 minutes
    const expectedDocs = Math.ceil((documentsPerHour / 3600000) * testDuration);
    const testFile = Buffer.from('test content');
    
    const startTime = Date.now();
    const uploadPromises = Array(expectedDocs).fill(null).map(() =>
      documentClient.post('/api/v1/documents', {
        file: testFile,
        metadata: { title: 'Throughput Test Document' }
      })
    );

    const results = await Promise.all(uploadPromises);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Calculate achieved throughput
    const achievedThroughput = (results.length / duration) * 3600000;
    
    expect(achievedThroughput).toBeGreaterThanOrEqual(documentsPerHour);
  }, 300000); // 5 minute timeout

  afterAll(async () => {
    await documentClient.cleanup();
  });
});