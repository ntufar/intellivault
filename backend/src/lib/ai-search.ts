import { SearchClient, SearchIndexClient, AzureKeyCredential, type SearchField, type SearchFieldDataType } from '@azure/search-documents';
import { logger } from './logger';

export interface AISearchConfig {
  endpoint: string;
  apiKey: string;
  indexName: string;
}

export interface SearchDocument {
  id: string;
  tenant_id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  filename: string;
  embedding?: number[];
  metadata?: Record<string, any>;
}

export interface SearchResult {
  documentId: string;
  chunkIndex: number;
  score: number;
  highlight: string;
  content: string;
  filename: string;
}

export class AISearchService {
  private searchClient: SearchClient<SearchDocument>;
  private indexClient: SearchIndexClient;
  private config: AISearchConfig;

  constructor(config: AISearchConfig) {
    const credential = new AzureKeyCredential(config.apiKey);
    this.config = config;
    this.searchClient = new SearchClient<SearchDocument>(
      config.endpoint,
      config.indexName,
      credential
    );
    this.indexClient = new SearchIndexClient(config.endpoint, credential);
  }

  async initialize(): Promise<void> {
    try {
      // Create index if it doesn't exist
      await this.createIndexIfNotExists();
      logger.info('Azure AI Search index ready', { 
        indexName: this.config.indexName 
      } as any);
    } catch (error) {
      logger.error('Failed to initialize Azure AI Search', { error } as any);
      throw error;
    }
  }

  private async createIndexIfNotExists(): Promise<void> {
    try {
      await this.indexClient.getIndex(this.config.indexName);
      logger.debug('Azure AI Search index already exists', { 
        indexName: this.config.indexName 
      } as any);
    } catch (error: any) {
      if (error.statusCode === 404) {
        await this.createIndex();
      } else {
        throw error;
      }
    }
  }

  private async createIndex(): Promise<void> {
    // Simplified index creation to avoid complex type issues
    const indexDefinition = {
      name: this.config.indexName,
      fields: [
        {
          name: 'id',
          type: 'Edm.String',
          key: true,
          searchable: false,
          filterable: true,
          sortable: false,
          facetable: false,
        },
        {
          name: 'tenant_id',
          type: 'Edm.String',
          key: false,
          searchable: false,
          filterable: true,
          sortable: false,
          facetable: false,
        },
        {
          name: 'document_id',
          type: 'Edm.String',
          key: false,
          searchable: false,
          filterable: true,
          sortable: false,
          facetable: false,
        },
        {
          name: 'chunk_index',
          type: 'Edm.Int32',
          key: false,
          searchable: false,
          filterable: true,
          sortable: true,
          facetable: false,
        },
        {
          name: 'content',
          type: 'Edm.String',
          key: false,
          searchable: true,
          filterable: false,
          sortable: false,
          facetable: false,
          analyzer: 'standard.lucene',
        },
        {
          name: 'filename',
          type: 'Edm.String',
          key: false,
          searchable: true,
          filterable: true,
          sortable: false,
          facetable: false,
        },
        {
          name: 'embedding',
          type: 'Collection(Edm.Single)',
          key: false,
          searchable: false,
          filterable: false,
          sortable: false,
          facetable: false,
          dimensions: 1536,
        },
        {
          name: 'metadata',
          type: 'Edm.String',
          key: false,
          searchable: false,
          filterable: false,
          sortable: false,
          facetable: false,
        },
      ],
    };

    await this.indexClient.createIndex(indexDefinition as any);
    logger.info('Created Azure AI Search index', { 
      indexName: this.config.indexName 
    } as any);
  }

  // Add documents to the search index
  async addDocuments(documents: SearchDocument[]): Promise<void> {
    try {
      const result = await this.searchClient.uploadDocuments(documents);
      
      const failed = (result as any).filter((r: any) => !r.succeeded);
      if (failed.length > 0) {
        logger.error('Some documents failed to index', { 
          failedCount: failed.length,
          totalCount: documents.length,
          failures: failed.map((f: any) => f.key)
        } as any);
        throw new Error(`Failed to index ${failed.length} documents`);
      }

      logger.info('Documents indexed successfully', { 
        count: documents.length 
      } as any);
    } catch (error) {
      logger.error('Failed to add documents to search index', { error } as any);
      throw error;
    }
  }

  // Update documents in the search index
  async updateDocuments(documents: SearchDocument[]): Promise<void> {
    try {
      const result = await this.searchClient.mergeOrUploadDocuments(documents);
      
      const failed = (result as any).filter((r: any) => !r.succeeded);
      if (failed.length > 0) {
        logger.error('Some documents failed to update', { 
          failedCount: failed.length,
          totalCount: documents.length,
          failures: failed.map((f: any) => f.key)
        } as any);
        throw new Error(`Failed to update ${failed.length} documents`);
      }

      logger.info('Documents updated successfully', { 
        count: documents.length 
      } as any);
    } catch (error) {
      logger.error('Failed to update documents in search index', { error } as any);
      throw error;
    }
  }

  // Delete documents from the search index
  async deleteDocuments(documentIds: string[]): Promise<void> {
    try {
      const documents = documentIds.map(id => ({ id }));
      const result = await this.searchClient.deleteDocuments(documents as any);
      
      const failed = (result as any).filter((r: any) => !r.succeeded);
      if (failed.length > 0) {
        logger.error('Some documents failed to delete', { 
          failedCount: failed.length,
          totalCount: documentIds.length,
          failures: failed.map((f: any) => f.key)
        } as any);
        throw new Error(`Failed to delete ${failed.length} documents`);
      }

      logger.info('Documents deleted successfully', { 
        count: documentIds.length 
      } as any);
    } catch (error) {
      logger.error('Failed to delete documents from search index', { error } as any);
      throw error;
    }
  }

  // Semantic search with tenant filtering
  async search(
    query: string,
    tenantId: string,
    k: number = 10,
    useSemantic: boolean = true
  ): Promise<SearchResult[]> {
    try {
      const searchOptions: any = {
        filter: `tenant_id eq '${tenantId}'`,
        top: k,
        select: ['document_id', 'chunk_index', 'content', 'filename'],
        highlightFields: ['content'],
        highlightPreTag: '<mark>',
        highlightPostTag: '</mark>',
      };

      if (useSemantic) {
        searchOptions.semanticSearch = {
          configurationName: 'default',
        };
      }

      const searchResults = await this.searchClient.search(query, searchOptions);
      const results: SearchResult[] = [];

      for await (const result of searchResults.results) {
        results.push({
          documentId: result.document.document_id,
          chunkIndex: result.document.chunk_index,
          score: result.score || 0,
          highlight: result.highlights?.content?.join(' ... ') || '',
          content: result.document.content,
          filename: result.document.filename,
        });
      }

      logger.debug('Search completed', {
        query: query.substring(0, 100),
        tenantId,
        k,
        resultCount: results.length,
        useSemantic,
      } as any);

      return results;
    } catch (error) {
      logger.error('Search failed', { query, tenantId, k, error } as any);
      throw error;
    }
  }

  // Vector search using embeddings
  async vectorSearch(
    embedding: number[],
    tenantId: string,
    k: number = 10
  ): Promise<SearchResult[]> {
    try {
      const searchOptions: any = {
        vectorSearchOptions: {
          queries: [
            {
              vector: embedding,
              kNearestNeighborsCount: k,
              fields: 'embedding',
            },
          ],
        },
        filter: `tenant_id eq '${tenantId}'`,
        select: ['document_id', 'chunk_index', 'content', 'filename'],
      };

      const searchResults = await this.searchClient.search('*', searchOptions);
      const results: SearchResult[] = [];

      for await (const result of searchResults.results) {
        results.push({
          documentId: result.document.document_id,
          chunkIndex: result.document.chunk_index,
          score: result.score || 0,
          highlight: '',
          content: result.document.content,
          filename: result.document.filename,
        });
      }

      logger.debug('Vector search completed', {
        tenantId,
        k,
        resultCount: results.length,
      } as any);

      return results;
    } catch (error) {
      logger.error('Vector search failed', { tenantId, k, error } as any);
      throw error;
    }
  }

  // Hybrid search (semantic + vector)
  async hybridSearch(
    query: string,
    embedding: number[],
    tenantId: string,
    k: number = 10
  ): Promise<SearchResult[]> {
    try {
      const searchOptions: any = {
        vectorSearchOptions: {
          queries: [
            {
              vector: embedding,
              kNearestNeighborsCount: k,
              fields: 'embedding',
            },
          ],
        },
        filter: `tenant_id eq '${tenantId}'`,
        top: k,
        select: ['document_id', 'chunk_index', 'content', 'filename'],
        highlightFields: ['content'],
        highlightPreTag: '<mark>',
        highlightPostTag: '</mark>',
        semanticSearch: {
          configurationName: 'default',
        },
      };

      const searchResults = await this.searchClient.search(query, searchOptions);
      const results: SearchResult[] = [];

      for await (const result of searchResults.results) {
        results.push({
          documentId: result.document.document_id,
          chunkIndex: result.document.chunk_index,
          score: result.score || 0,
          highlight: result.highlights?.content?.join(' ... ') || '',
          content: result.document.content,
          filename: result.document.filename,
        });
      }

      logger.debug('Hybrid search completed', {
        query: query.substring(0, 100),
        tenantId,
        k,
        resultCount: results.length,
      } as any);

      return results;
    } catch (error) {
      logger.error('Hybrid search failed', { query, tenantId, k, error } as any);
      throw error;
    }
  }
}

// Global instance
let aiSearchService: AISearchService | null = null;

export function getAISearchService(): AISearchService {
  if (!aiSearchService) {
    const config: AISearchConfig = {
      endpoint: process.env.AZURE_SEARCH_ENDPOINT || '',
      apiKey: process.env.AZURE_SEARCH_API_KEY || '',
      indexName: process.env.AZURE_SEARCH_INDEX_NAME || 'documents',
    };
    aiSearchService = new AISearchService(config);
  }
  return aiSearchService;
}

export async function initializeAISearch(): Promise<void> {
  const service = getAISearchService();
  await service.initialize();
}
