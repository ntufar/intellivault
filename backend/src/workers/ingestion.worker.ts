import { Worker, Queue, Job } from 'bullmq';
import IORedis from 'ioredis';
import { logger, createRequestLogger } from '../lib/logger';
import { getBlobStorageService } from '../lib/blob';
import { getCosmosRepository } from '../lib/cosmos';
import { getAISearchService } from '../lib/ai-search';
import { getOpenAIService } from '../lib/openai';
import { DocumentService } from '../services/DocumentService';
import { EmbeddingService } from '../services/EmbeddingService';

// Redis connection
const redis = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
});

// Job types
export interface DocumentIngestionJob {
  documentId: string;
  tenantId: string;
  filename: string;
  blobPath: string;
  contentType: string;
}

export interface ChunkProcessingJob {
  documentId: string;
  tenantId: string;
  chunkIndex: number;
  text: string;
  embedding?: number[];
}

export interface DocumentIndexingJob {
  documentId: string;
  tenantId: string;
  chunks: Array<{
    id: string;
    chunkIndex: number;
    text: string;
    embedding: number[];
  }>;
}

// Queue definitions
export const documentIngestionQueue = new Queue<DocumentIngestionJob>('document-ingestion', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

export const chunkProcessingQueue = new Queue<ChunkProcessingJob>('chunk-processing', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 10,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

export const documentIndexingQueue = new Queue<DocumentIndexingJob>('document-indexing', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
  },
});

// Document ingestion worker
export const documentIngestionWorker = new Worker<DocumentIngestionJob>(
  'document-ingestion',
  async (job: Job<DocumentIngestionJob>) => {
    const requestLogger = createRequestLogger(job.id || 'unknown');
    const { documentId, tenantId, filename, blobPath, contentType } = job.data;

    requestLogger.info('Starting document ingestion', {
      documentId,
      tenantId,
      filename,
      contentType,
    });

    try {
      const blobService = getBlobStorageService();
      const cosmosRepo = getCosmosRepository();
      const documentService = new DocumentService();

      // Update document status to processing
      await documentService.updateDocumentStatus(documentId, 'processing');

      // Download document from blob storage
      const documentBuffer = await blobService.downloadDocument(tenantId, filename);

      // Extract text content based on file type
      const extractedText = await documentService.extractTextContent(
        documentBuffer,
        contentType
      );

      if (!extractedText) {
        throw new Error('Failed to extract text content from document');
      }

      // Chunk the document
      const chunks = await documentService.chunkDocument(extractedText, {
        maxChunkSize: 1000,
        overlapSize: 200,
      });

      requestLogger.info('Document chunked successfully', {
        documentId,
        chunkCount: chunks.length,
      });

      // Create chunk processing jobs
      const chunkJobs = chunks.map((chunk, index) => ({
        name: `chunk-${documentId}-${index}`,
        data: {
          documentId,
          tenantId,
          chunkIndex: index,
          text: chunk,
        },
      }));

      await chunkProcessingQueue.addBulk(chunkJobs);

      // Update document with chunk count
      await documentService.updateDocumentMetadata(documentId, {
        chunkCount: chunks.length,
        textLength: extractedText.length,
      });

      requestLogger.info('Document ingestion completed', {
        documentId,
        chunkCount: chunks.length,
      });

      return { chunkCount: chunks.length };
    } catch (error) {
      requestLogger.error('Document ingestion failed', {
        documentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Update document status to error
      const documentService = new DocumentService();
      await documentService.updateDocumentStatus(documentId, 'error');

      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 3,
  }
);

// Chunk processing worker
export const chunkProcessingWorker = new Worker<ChunkProcessingJob>(
  'chunk-processing',
  async (job: Job<ChunkProcessingJob>) => {
    const requestLogger = createRequestLogger(job.id || 'unknown');
    const { documentId, tenantId, chunkIndex, text } = job.data;

    requestLogger.debug('Processing chunk', {
      documentId,
      chunkIndex,
      textLength: text.length,
    });

    try {
      const cosmosRepo = getCosmosRepository();
      const embeddingService = new EmbeddingService();

      // Generate embedding for the chunk
      const embedding = await embeddingService.generateEmbedding(text);

      // Store chunk in Cosmos DB
      const chunkId = `${documentId}-${chunkIndex}`;
      const chunkDocument = {
        id: chunkId,
        document_id: documentId,
        tenant_id: tenantId,
        chunk_index: chunkIndex,
        text,
        embedding,
        created_at: new Date().toISOString(),
      };

      await cosmosRepo.createDocument('document_chunks', chunkDocument);

      requestLogger.debug('Chunk processed successfully', {
        documentId,
        chunkIndex,
        embeddingLength: embedding.length,
      });

      return { chunkId, embeddingLength: embedding.length };
    } catch (error) {
      requestLogger.error('Chunk processing failed', {
        documentId,
        chunkIndex,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 10,
  }
);

// Document indexing worker
export const documentIndexingWorker = new Worker<DocumentIndexingJob>(
  'document-indexing',
  async (job: Job<DocumentIndexingJob>) => {
    const requestLogger = createRequestLogger(job.id || 'unknown');
    const { documentId, tenantId, chunks } = job.data;

    requestLogger.info('Starting document indexing', {
      documentId,
      chunkCount: chunks.length,
    });

    try {
      const aiSearchService = getAISearchService();
      const cosmosRepo = getCosmosRepository();

      // Get document metadata
      const document = await cosmosRepo.getDocument('documents', documentId, tenantId);
      if (!document) {
        throw new Error(`Document ${documentId} not found`);
      }

      // Prepare search documents for indexing
      const searchDocuments = chunks.map(chunk => ({
        id: chunk.id,
        tenant_id: tenantId,
        document_id: documentId,
        chunk_index: chunk.chunkIndex,
        content: chunk.text,
        filename: document.filename,
        embedding: chunk.embedding,
        metadata: JSON.stringify({
          documentId,
          chunkIndex: chunk.chunkIndex,
          tenantId,
        }),
      }));

      // Add documents to search index
      await aiSearchService.addDocuments(searchDocuments);

      // Update document status to ready
      const documentService = new DocumentService();
      await documentService.updateDocumentStatus(documentId, 'ready');

      requestLogger.info('Document indexing completed', {
        documentId,
        indexedChunks: chunks.length,
      });

      return { indexedChunks: chunks.length };
    } catch (error) {
      requestLogger.error('Document indexing failed', {
        documentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Update document status to error
      const documentService = new DocumentService();
      await documentService.updateDocumentStatus(documentId, 'error');

      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 2,
  }
);

// Worker event handlers
documentIngestionWorker.on('completed', (job) => {
  logger.info('Document ingestion job completed', {
    jobId: job.id,
    documentId: job.data.documentId,
  });
});

documentIngestionWorker.on('failed', (job, err) => {
  logger.error('Document ingestion job failed', {
    jobId: job?.id,
    documentId: job?.data.documentId,
    error: err.message,
  });
});

chunkProcessingWorker.on('completed', (job) => {
  logger.debug('Chunk processing job completed', {
    jobId: job.id,
    documentId: job.data.documentId,
    chunkIndex: job.data.chunkIndex,
  });
});

chunkProcessingWorker.on('failed', (job, err) => {
  logger.error('Chunk processing job failed', {
    jobId: job?.id,
    documentId: job?.data.documentId,
    chunkIndex: job?.data.chunkIndex,
    error: err.message,
  });
});

documentIndexingWorker.on('completed', (job) => {
  logger.info('Document indexing job completed', {
    jobId: job.id,
    documentId: job.data.documentId,
  });
});

documentIndexingWorker.on('failed', (job, err) => {
  logger.error('Document indexing job failed', {
    jobId: job?.id,
    documentId: job?.data.documentId,
    error: err.message,
  });
});

// Queue monitoring and management functions
export async function getQueueStats() {
  const [ingestionStats, chunkStats, indexingStats] = await Promise.all([
    documentIngestionQueue.getJobCounts(),
    chunkProcessingQueue.getJobCounts(),
    documentIndexingQueue.getJobCounts(),
  ]);

  return {
    documentIngestion: ingestionStats,
    chunkProcessing: chunkStats,
    documentIndexing: indexingStats,
  };
}

export async function pauseQueues() {
  await Promise.all([
    documentIngestionQueue.pause(),
    chunkProcessingQueue.pause(),
    documentIndexingQueue.pause(),
  ]);
  logger.info('All queues paused');
}

export async function resumeQueues() {
  await Promise.all([
    documentIngestionQueue.resume(),
    chunkProcessingQueue.resume(),
    documentIndexingQueue.resume(),
  ]);
  logger.info('All queues resumed');
}

export async function clearFailedJobs() {
  await Promise.all([
    documentIngestionQueue.clean(0, 10, 'failed'),
    chunkProcessingQueue.clean(0, 10, 'failed'),
    documentIndexingQueue.clean(0, 10, 'failed'),
  ]);
  logger.info('Failed jobs cleared');
}

// Graceful shutdown
export async function shutdownWorkers() {
  logger.info('Shutting down workers...');
  
  await Promise.all([
    documentIngestionWorker.close(),
    chunkProcessingWorker.close(),
    documentIndexingWorker.close(),
  ]);
  
  await redis.quit();
  logger.info('Workers shutdown complete');
}

// Initialize workers
export async function initializeWorkers() {
  try {
    // Test Redis connection
    await redis.ping();
    logger.info('Redis connection established');

    // Start workers
    logger.info('Starting ingestion workers...');
    
    // Workers are automatically started when created
    logger.info('All workers started successfully');
  } catch (error) {
    logger.error('Failed to initialize workers', { error });
    throw error;
  }
}
