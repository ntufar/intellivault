import { CosmosClient, Container, Database, type ItemDefinition } from '@azure/cosmos';
import { logger } from './logger';

export interface CosmosConfig {
  endpoint: string;
  key: string;
  databaseId: string;
}

export class CosmosRepository {
  private client: CosmosClient;
  private database: Database;
  private containers: Map<string, Container> = new Map();

  constructor(config: CosmosConfig) {
    this.client = new CosmosClient({
      endpoint: config.endpoint,
      key: config.key,
    });
    this.database = this.client.database(config.databaseId);
  }

  async initialize(): Promise<void> {
    try {
      // Create database if it doesn't exist
      await this.database.read();
      logger.info('Cosmos DB database connected successfully');
    } catch (error) {
      logger.error('Failed to connect to Cosmos DB', { error });
      throw error;
    }
  }

  getContainer(containerId: string): Container {
    if (!this.containers.has(containerId)) {
      const container = this.database.container(containerId);
      this.containers.set(containerId, container);
    }
    return this.containers.get(containerId)!;
  }

  async createContainerIfNotExists(
    containerId: string,
    partitionKey: string
  ): Promise<Container> {
    try {
      const { container } = await this.database.containers.createIfNotExists({
        id: containerId,
        partitionKey: `/${partitionKey}`,
      });
      this.containers.set(containerId, container);
      logger.info(`Container ${containerId} ready`, { partitionKey });
      return container;
    } catch (error) {
      logger.error(`Failed to create container ${containerId}`, { error });
      throw error;
    }
  }

  // Document operations with tenant partitioning
  async createDocument<T extends { id: string; tenant_id: string }>(
    containerId: string,
    document: T
  ): Promise<T> {
    const container = this.getContainer(containerId);
    const { resource } = await container.items.create(document as any);
    logger.debug(`Created document in ${containerId}`, { 
      id: document.id, 
      tenant_id: document.tenant_id 
    });
    return (resource as unknown as T) || document;
  }

  async getDocument<T>(
    containerId: string,
    id: string,
    tenantId: string
  ): Promise<T | null> {
    const container = this.getContainer(containerId);
    try {
      const { resource } = await container.item(id, tenantId).read();
      return (resource as unknown as T) || null;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  async updateDocument<T extends { id: string; tenant_id: string }>(
    containerId: string,
    document: T
  ): Promise<T> {
    const container = this.getContainer(containerId);
    const { resource } = await container.items.upsert(document as any);
    logger.debug(`Updated document in ${containerId}`, { 
      id: document.id, 
      tenant_id: document.tenant_id 
    });
    return (resource as unknown as T) || document;
  }

  async deleteDocument(
    containerId: string,
    id: string,
    tenantId: string
  ): Promise<void> {
    const container = this.getContainer(containerId);
    await container.item(id, tenantId).delete();
    logger.debug(`Deleted document from ${containerId}`, { id, tenant_id: tenantId });
  }

  async queryDocuments<T>(
    containerId: string,
    query: string,
    parameters: Array<{ name: string; value: any }> = []
  ): Promise<T[]> {
    const container = this.getContainer(containerId);
    const { resources } = await container.items
      .query<T>({
        query,
        parameters,
      })
      .fetchAll();
    return resources;
  }

  // Query documents by tenant
  async queryDocumentsByTenant<T>(
    containerId: string,
    tenantId: string,
    additionalQuery?: string
  ): Promise<T[]> {
    const query = additionalQuery 
      ? `SELECT * FROM c WHERE c.tenant_id = @tenantId AND (${additionalQuery})`
      : 'SELECT * FROM c WHERE c.tenant_id = @tenantId';
    
    return this.queryDocuments<T>(containerId, query, [
      { name: '@tenantId', value: tenantId }
    ]);
  }

  async close(): Promise<void> {
    this.client.dispose();
  }
}

// Global instance
let cosmosRepository: CosmosRepository | null = null;

export function getCosmosRepository(): CosmosRepository {
  if (!cosmosRepository) {
    const config: CosmosConfig = {
      endpoint: process.env.AZURE_COSMOS_ENDPOINT || '',
      key: process.env.AZURE_COSMOS_KEY || '',
      databaseId: process.env.AZURE_COSMOS_DATABASE_ID || 'intellivault',
    };
    cosmosRepository = new CosmosRepository(config);
  }
  return cosmosRepository;
}

export async function initializeCosmos(): Promise<void> {
  const repo = getCosmosRepository();
  await repo.initialize();

  // Create containers for each model with tenant_id partitioning
  const containers = [
    { id: 'documents', partitionKey: 'tenant_id' },
    { id: 'document_chunks', partitionKey: 'document_id' },
    { id: 'entities', partitionKey: 'type' },
    { id: 'document_entities', partitionKey: 'document_id' },
    { id: 'knowledge_graph_nodes', partitionKey: 'type' },
    { id: 'knowledge_graph_edges', partitionKey: 'source_id' },
    { id: 'users', partitionKey: 'email' },
    { id: 'search_queries', partitionKey: 'tenant_id' },
    { id: 'audit_logs', partitionKey: 'tenant_id' },
  ];

  for (const container of containers) {
    await repo.createContainerIfNotExists(container.id, container.partitionKey);
  }
}
