import { describe, expect, test, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { BlobServiceClient } from '@azure/storage-blob';
import { CosmosClient } from '@azure/cosmos';
import path from 'path';
import fs from 'fs';

// Mock the Azure Storage connection for tests
const mockStorageAccount = 'devstoreaccount1';
const mockStorageKey = 'Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==';

describe('Document Service API', () => {
  let mongoServer: MongoMemoryServer;
  let azuriteContainer: StartedTestContainer;
  let blobServiceClient: BlobServiceClient;
  let cosmosClient: CosmosClient;

  beforeAll(async () => {
    // Start MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Start Azurite container for blob storage testing
    azuriteContainer = await new GenericContainer('mcr.microsoft.com/azure-storage/azurite')
      .withExposedPorts(10000)
      .start();

    const blobPort = azuriteContainer.getMappedPort(10000);
    const blobHost = azuriteContainer.getHost();
    const blobEndpoint = `http://${blobHost}:${blobPort}/${mockStorageAccount}`;
    
    // Initialize blob service client
    blobServiceClient = BlobServiceClient.fromConnectionString(
      `DefaultEndpointsProtocol=http;AccountName=${mockStorageAccount};AccountKey=${mockStorageKey};BlobEndpoint=${blobEndpoint}`
    );

    // Initialize Cosmos client with MongoDB API
    cosmosClient = new CosmosClient({
      endpoint: mongoUri,
      key: 'dummy-key'
    });

    try {
      // Create required containers and collections
      await blobServiceClient.createContainer('documents');
      await cosmosClient.database('intellivault').container('documents').create();
    } catch (error) {
      console.error('Error setting up test environment:', error);
      throw error;
    }
  });

  beforeEach(async () => {
    // Clean up test data before each test
    try {
      const container = blobServiceClient.getContainerClient('documents');
      const database = cosmosClient.database('intellivault');
      for await (const blob of container.listBlobsFlat()) {
        await container.deleteBlob(blob.name);
      }
      const { resources } = await database.container('documents').items.readAll().fetchAll();
      for (const doc of resources) {
        await database.container('documents').item(doc.id).delete();
      }
    } catch (error) {
      console.error('Error cleaning up test data:', error);
      throw error;
    }
  });

  afterAll(async () => {
    // Cleanup resources
    await mongoServer.stop();
    await azuriteContainer.stop();
  });

  describe('POST /api/v1/documents', () => {
    test('should upload a document successfully', async () => {
      // Create a test file
      const testFilePath = path.join(__dirname, 'test.pdf');
      fs.writeFileSync(testFilePath, 'Test PDF content');

      const formData = new FormData();
      formData.append('file', fs.createReadStream(testFilePath));
      formData.append('metadata', JSON.stringify({
        title: 'Test Document',
        author: ['Test Author'],
        keywords: ['test', 'document'],
        classification: 'public',
        confidentiality: 'low'
      }));

      const response = await fetch('/api/v1/documents', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token'
        },
        body: formData
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('status', 'processing');
      expect(data).toHaveProperty('uploadUrl');
      expect(data.metadata).toHaveProperty('title', 'Test Document');

      // Clean up test file
      fs.unlinkSync(testFilePath);
    });

    test('should reject files larger than the size limit', async () => {
      const largeFilePath = path.join(__dirname, 'large.pdf');
      const largeFileContent = Buffer.alloc(100 * 1024 * 1024); // 100MB file
      fs.writeFileSync(largeFilePath, largeFileContent);

      const formData = new FormData();
      formData.append('file', fs.createReadStream(largeFilePath));

      const response = await fetch('/api/v1/documents', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token'
        },
        body: formData
      });

      expect(response.status).toBe(413);
      const error = await response.json();
      expect(error).toHaveProperty('error', 'File size exceeds limit');

      // Clean up test file
      fs.unlinkSync(largeFilePath);
    });

    test('should reject unsupported file types', async () => {
      const testFilePath = path.join(__dirname, 'test.exe');
      fs.writeFileSync(testFilePath, 'Test EXE content');

      const formData = new FormData();
      formData.append('file', fs.createReadStream(testFilePath));

      const response = await fetch('/api/v1/documents', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token'
        },
        body: formData
      });

      expect(response.status).toBe(415);
      const error = await response.json();
      expect(error).toHaveProperty('error', 'Unsupported file type');

      // Clean up test file
      fs.unlinkSync(testFilePath);
    });

    test('should handle missing authorization token', async () => {
      const testFilePath = path.join(__dirname, 'test.pdf');
      fs.writeFileSync(testFilePath, 'Test PDF content');

      const formData = new FormData();
      formData.append('file', fs.createReadStream(testFilePath));

      const response = await fetch('/api/v1/documents', {
        method: 'POST',
        body: formData
      });

      expect(response.status).toBe(401);
      const error = await response.json();
      expect(error).toHaveProperty('error', 'Missing authorization token');

      // Clean up test file
      fs.unlinkSync(testFilePath);
    });
  });

  describe('GET /api/v1/documents/{id}/status', () => {
    let documentId: string;

    beforeEach(async () => {
      // Create a test document
      const response = await fetch('/api/v1/documents', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'Test Document',
          content: 'Test content'
        })
      });

      const data = await response.json();
      documentId = data.id;
    });

    test('should return processing status for newly uploaded document', async () => {
      const response = await fetch(`/api/v1/documents/${documentId}/status`, {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });

      expect(response.status).toBe(200);
      const status = await response.json();
      expect(status).toHaveProperty('status', 'processing');
      expect(status).toHaveProperty('progress');
    });

    test('should return completed status for processed document', async () => {
      // Simulate document processing completion
      await cosmosClient
        .database('intellivault')
        .container('documents')
        .item(documentId)
        .patch([{ op: 'replace', path: '/status', value: 'completed' }]);

      const response = await fetch(`/api/v1/documents/${documentId}/status`, {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });

      expect(response.status).toBe(200);
      const status = await response.json();
      expect(status).toHaveProperty('status', 'completed');
      expect(status).toHaveProperty('progress', 100);
    });

    test('should return failed status for failed processing', async () => {
      // Simulate document processing failure
      await cosmosClient
        .database('intellivault')
        .container('documents')
        .item(documentId)
        .patch([
          { op: 'replace', path: '/status', value: 'failed' },
          { op: 'add', path: '/error', value: 'Processing failed' }
        ]);

      const response = await fetch(`/api/v1/documents/${documentId}/status`, {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });

      expect(response.status).toBe(200);
      const status = await response.json();
      expect(status).toHaveProperty('status', 'failed');
      expect(status).toHaveProperty('error', 'Processing failed');
    });

    test('should return 404 for non-existent document', async () => {
      const response = await fetch(`/api/v1/documents/non-existent-id/status`, {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });

      expect(response.status).toBe(404);
      const error = await response.json();
      expect(error).toHaveProperty('error', 'Document not found');
    });
  });

  // Note: Additional test suites for content retrieval and error handling follow similar patterns
});