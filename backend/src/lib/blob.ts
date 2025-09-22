import { BlobServiceClient, ContainerClient, BlockBlobClient, type PublicAccessType, type BlobSASPermissions } from '@azure/storage-blob';
import { logger } from './logger';

export interface BlobConfig {
  connectionString: string;
  containerName: string;
}

export class BlobStorageService {
  private blobServiceClient: BlobServiceClient;
  private containerClient: ContainerClient;

  constructor(config: BlobConfig) {
    this.blobServiceClient = BlobServiceClient.fromConnectionString(config.connectionString);
    this.containerClient = this.blobServiceClient.getContainerClient(config.containerName);
  }

  async initialize(): Promise<void> {
    try {
      // Create container if it doesn't exist
      await this.containerClient.createIfNotExists({
        access: 'private' as PublicAccessType, // Private access for security
      });
      logger.info('Azure Blob Storage container ready', { 
        containerName: this.containerClient.containerName 
      } as any);
    } catch (error) {
      logger.error('Failed to initialize Blob Storage', { error } as any);
      throw error;
    }
  }

  // Generate blob path with tenant isolation
  private getBlobPath(tenantId: string, filename: string): string {
    return `tenants/${tenantId}/documents/${filename}`;
  }

  // Upload document to blob storage
  async uploadDocument(
    tenantId: string,
    filename: string,
    buffer: Buffer,
    contentType: string
  ): Promise<string> {
    const blobPath = this.getBlobPath(tenantId, filename);
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobPath);

    try {
      await blockBlobClient.upload(buffer, buffer.length, {
        blobHTTPHeaders: {
          blobContentType: contentType,
        },
        metadata: {
          tenantId,
          originalFilename: filename,
          uploadedAt: new Date().toISOString(),
        },
      });

      logger.info('Document uploaded to blob storage', {
        tenantId,
        filename,
        blobPath,
        size: buffer.length,
      } as any);

      return blobPath;
    } catch (error) {
      logger.error('Failed to upload document to blob storage', {
        tenantId,
        filename,
        error,
      } as any);
      throw error;
    }
  }

  // Download document from blob storage
  async downloadDocument(tenantId: string, filename: string): Promise<Buffer> {
    const blobPath = this.getBlobPath(tenantId, filename);
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobPath);

    try {
      const downloadResponse = await blockBlobClient.download(0);
      const chunks: Uint8Array[] = [];
      
      if (downloadResponse.readableStreamBody) {
        for await (const chunk of downloadResponse.readableStreamBody) {
          chunks.push(chunk as Uint8Array);
        }
      }

      const buffer = Buffer.concat(chunks);
      
      logger.debug('Document downloaded from blob storage', {
        tenantId,
        filename,
        blobPath,
        size: buffer.length,
      } as any);

      return buffer;
    } catch (error) {
      logger.error('Failed to download document from blob storage', {
        tenantId,
        filename,
        error,
      } as any);
      throw error;
    }
  }

  // Delete document from blob storage
  async deleteDocument(tenantId: string, filename: string): Promise<void> {
    const blobPath = this.getBlobPath(tenantId, filename);
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobPath);

    try {
      await blockBlobClient.delete();
      
      logger.info('Document deleted from blob storage', {
        tenantId,
        filename,
        blobPath,
      } as any);
    } catch (error: any) {
      if (error.statusCode === 404) {
        logger.warn('Document not found in blob storage during deletion', {
          tenantId,
          filename,
          blobPath,
        } as any);
        return;
      }
      
      logger.error('Failed to delete document from blob storage', {
        tenantId,
        filename,
        error,
      } as any);
      throw error;
    }
  }

  // Generate SAS URL for temporary access
  async generateSasUrl(
    tenantId: string,
    filename: string,
    expiresInMinutes: number = 60
  ): Promise<string> {
    const blobPath = this.getBlobPath(tenantId, filename);
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobPath);

    try {
      const expiresOn = new Date();
      expiresOn.setMinutes(expiresOn.getMinutes() + expiresInMinutes);

      const sasUrl = await blockBlobClient.generateSasUrl({
        permissions: 'r' as any, // Read only
        expiresOn,
      });

      logger.debug('Generated SAS URL for document', {
        tenantId,
        filename,
        expiresInMinutes,
      } as any);

      return sasUrl;
    } catch (error) {
      logger.error('Failed to generate SAS URL', {
        tenantId,
        filename,
        error,
      } as any);
      throw error;
    }
  }

  // Check if document exists
  async documentExists(tenantId: string, filename: string): Promise<boolean> {
    const blobPath = this.getBlobPath(tenantId, filename);
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobPath);

    try {
      await blockBlobClient.getProperties();
      return true;
    } catch (error: any) {
      if (error.statusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  // Get document metadata
  async getDocumentMetadata(tenantId: string, filename: string): Promise<any> {
    const blobPath = this.getBlobPath(tenantId, filename);
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobPath);

    try {
      const properties = await blockBlobClient.getProperties();
      return {
        size: properties.contentLength,
        contentType: properties.contentType,
        lastModified: properties.lastModified,
        metadata: properties.metadata,
      };
    } catch (error: any) {
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }
}

// Global instance
let blobStorageService: BlobStorageService | null = null;

export function getBlobStorageService(): BlobStorageService {
  if (!blobStorageService) {
    const config: BlobConfig = {
      connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || '',
      containerName: process.env.AZURE_STORAGE_CONTAINER_NAME || 'documents',
    };
    blobStorageService = new BlobStorageService(config);
  }
  return blobStorageService;
}

export async function initializeBlobStorage(): Promise<void> {
  const service = getBlobStorageService();
  await service.initialize();
}
