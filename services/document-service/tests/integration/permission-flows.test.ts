import { describe, beforeAll, afterAll, it, expect } from '@jest/globals';
import { TestClient } from '../utils/test-client';

describe('User Permission Flows', () => {
  let adminClient: TestClient;
  let regularUserClient: TestClient;
  let guestUserClient: TestClient;
  let documentId: string;

  beforeAll(async () => {
    // Initialize clients with different permission levels
    adminClient = new TestClient(process.env.DOCUMENT_SERVICE_URL, process.env.ADMIN_TOKEN);
    regularUserClient = new TestClient(process.env.DOCUMENT_SERVICE_URL, process.env.USER_TOKEN);
    guestUserClient = new TestClient(process.env.DOCUMENT_SERVICE_URL, process.env.GUEST_TOKEN);

    // Create a test document as admin
    const response = await adminClient.post('/api/v1/documents', {
      file: Buffer.from('confidential content'),
      metadata: {
        title: 'Permission Test Document',
        classification: 'confidential',
        confidentiality: 'high'
      }
    });
    documentId = response.data.id;

    // Wait for document processing
    let status;
    do {
      const statusResponse = await adminClient.get(`/api/v1/documents/${documentId}/status`);
      status = statusResponse.data.status;
      await new Promise(resolve => setTimeout(resolve, 1000));
    } while (status === 'processing');
  });

  it('should enforce document access permissions', async () => {
    // Admin should have full access
    const adminResponse = await adminClient.get(`/api/v1/documents/${documentId}`);
    expect(adminResponse.status).toBe(200);

    // Regular user should get redacted version
    const userResponse = await regularUserClient.get(`/api/v1/documents/${documentId}`);
    expect(userResponse.status).toBe(200);
    expect(userResponse.data.content).not.toContain('confidential');
    expect(userResponse.data.isRedacted).toBe(true);

    // Guest user should be denied
    try {
      await guestUserClient.get(`/api/v1/documents/${documentId}`);
      fail('Guest user should not have access');
    } catch (error) {
      expect(error.response.status).toBe(403);
    }
  });

  it('should enforce search permissions', async () => {
    const searchQuery = {
      query: 'confidential',
      filters: [{ field: 'classification', operator: 'eq', value: 'confidential' }]
    };

    // Admin should see all results
    const adminSearch = await adminClient.post('/api/v1/search', searchQuery);
    expect(adminSearch.status).toBe(200);
    expect(adminSearch.data.results).toHaveLength(1);

    // Regular user should see redacted results
    const userSearch = await regularUserClient.post('/api/v1/search', searchQuery);
    expect(userSearch.status).toBe(200);
    expect(userSearch.data.results).toHaveLength(1);
    expect(userSearch.data.results[0].document.isRedacted).toBe(true);

    // Guest user should see no results
    const guestSearch = await guestUserClient.post('/api/v1/search', searchQuery);
    expect(guestSearch.status).toBe(200);
    expect(guestSearch.data.results).toHaveLength(0);
  });

  it('should enforce analytics permissions', async () => {
    // Admin should see all analytics
    const adminAnalytics = await adminClient.get(`/api/v1/analytics/documents/${documentId}`);
    expect(adminAnalytics.status).toBe(200);
    expect(adminAnalytics.data.metrics).toBeDefined();

    // Regular user should see limited analytics
    const userAnalytics = await regularUserClient.get(`/api/v1/analytics/documents/${documentId}`);
    expect(userAnalytics.status).toBe(200);
    expect(userAnalytics.data.metrics).toBeDefined();
    expect(userAnalytics.data.sensitiveMetrics).toBeUndefined();

    // Guest user should be denied
    try {
      await guestUserClient.get(`/api/v1/analytics/documents/${documentId}`);
      fail('Guest user should not have access to analytics');
    } catch (error) {
      expect(error.response.status).toBe(403);
    }
  });

  it('should enforce document modification permissions', async () => {
    const updateMetadata = {
      classification: 'public'
    };

    // Admin should be able to modify
    const adminUpdate = await adminClient.patch(`/api/v1/documents/${documentId}`, updateMetadata);
    expect(adminUpdate.status).toBe(200);

    // Regular user should be denied
    try {
      await regularUserClient.patch(`/api/v1/documents/${documentId}`, updateMetadata);
      fail('Regular user should not be able to modify document');
    } catch (error) {
      expect(error.response.status).toBe(403);
    }

    // Guest user should be denied
    try {
      await guestUserClient.patch(`/api/v1/documents/${documentId}`, updateMetadata);
      fail('Guest user should not be able to modify document');
    } catch (error) {
      expect(error.response.status).toBe(403);
    }
  });

  afterAll(async () => {
    // Clean up test document
    await adminClient.cleanup();
  });
});