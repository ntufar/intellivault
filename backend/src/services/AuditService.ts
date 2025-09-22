import { randomUUID } from 'crypto';
import { logger } from '../lib/logger';
import { getCosmosRepository } from '../lib/cosmos';

export type AuditEvent = {
  tenantId: string;
  actorId: string;
  action: string;
  resource: string;
  result: string;
  metadata?: Record<string, unknown> | undefined;
};

export type AuditLog = {
  id: string;
  tenant_id: string;
  actor_id: string;
  action: string;
  resource: string;
  result: string;
  metadata?: string | undefined; // JSON string
  created_at: string;
};

export class AuditService {
  private cosmosRepo = getCosmosRepository();

  public async log(event: AuditEvent): Promise<void> {
    try {
      const auditLog: AuditLog = {
        id: randomUUID(),
        tenant_id: event.tenantId,
        actor_id: event.actorId,
        action: event.action,
        resource: event.resource,
        result: event.result,
        metadata: event.metadata ? JSON.stringify(event.metadata) : undefined,
        created_at: new Date().toISOString(),
      };

      // Store in Cosmos DB
      await this.cosmosRepo.createDocument('audit_logs', auditLog);

      // Also log to structured logger
      logger.info('Audit event', {
        auditId: auditLog.id,
        tenantId: event.tenantId,
        actorId: event.actorId,
        action: event.action,
        resource: event.resource,
        result: event.result,
        metadata: event.metadata,
      } as any);
    } catch (error) {
      logger.error('Failed to log audit event', {
        event,
        error: error instanceof Error ? error.message : 'Unknown error',
      } as any);
      // Don't throw - audit logging should not break the main flow
    }
  }

  // Convenience methods for common audit events
  public async logDocumentUpload(
    tenantId: string,
    actorId: string,
    documentId: string,
    filename: string,
    result: 'success' | 'failure',
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      tenantId,
      actorId,
      action: 'document.upload',
      resource: `document:${documentId}`,
      result,
      metadata: {
        filename,
        documentId,
        ...metadata,
      },
    });
  }

  public async logDocumentSearch(
    tenantId: string,
    actorId: string,
    query: string,
    result: 'success' | 'failure',
    resultCount?: number,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      tenantId,
      actorId,
      action: 'document.search',
      resource: 'search',
      result,
      metadata: {
        query: query.substring(0, 100), // Truncate for storage
        resultCount,
        ...metadata,
      },
    });
  }

  public async logQASession(
    tenantId: string,
    actorId: string,
    question: string,
    result: 'success' | 'failure',
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      tenantId,
      actorId,
      action: 'qa.ask',
      resource: 'qa',
      result,
      metadata: {
        question: question.substring(0, 100), // Truncate for storage
        ...metadata,
      },
    });
  }

  public async logDocumentAccess(
    tenantId: string,
    actorId: string,
    documentId: string,
    action: 'view' | 'download' | 'delete',
    result: 'success' | 'failure',
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      tenantId,
      actorId,
      action: `document.${action}`,
      resource: `document:${documentId}`,
      result,
      metadata: {
        documentId,
        ...metadata,
      },
    });
  }

  public async logUserAction(
    tenantId: string,
    actorId: string,
    action: 'login' | 'logout' | 'password_change' | 'role_change',
    targetUserId?: string,
    result: 'success' | 'failure' = 'success',
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      tenantId,
      actorId,
      action: `user.${action}`,
      resource: targetUserId ? `user:${targetUserId}` : 'user',
      result,
      metadata: {
        targetUserId,
        ...metadata,
      },
    });
  }

  public async logSystemAction(
    tenantId: string,
    action: string,
    resource: string,
    result: 'success' | 'failure',
      metadata?: Record<string, unknown> | undefined
    ): Promise<void> {
      await this.log({
        tenantId,
        actorId: 'system',
        action,
        resource,
        result,
        metadata,
      });
    }

  // Query audit logs
  public async getAuditLogs(
    tenantId: string,
    filters?: {
      actorId?: string;
      action?: string;
      resource?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
    }
  ): Promise<AuditLog[]> {
    try {
      let query = 'SELECT * FROM c WHERE c.tenant_id = @tenantId';
      const parameters: Array<{ name: string; value: any }> = [
        { name: '@tenantId', value: tenantId }
      ];

      if (filters?.actorId) {
        query += ' AND c.actor_id = @actorId';
        parameters.push({ name: '@actorId', value: filters.actorId });
      }

      if (filters?.action) {
        query += ' AND c.action = @action';
        parameters.push({ name: '@action', value: filters.action });
      }

      if (filters?.resource) {
        query += ' AND c.resource = @resource';
        parameters.push({ name: '@resource', value: filters.resource });
      }

      if (filters?.startDate) {
        query += ' AND c.created_at >= @startDate';
        parameters.push({ name: '@startDate', value: filters.startDate });
      }

      if (filters?.endDate) {
        query += ' AND c.created_at <= @endDate';
        parameters.push({ name: '@endDate', value: filters.endDate });
      }

      query += ' ORDER BY c.created_at DESC';

      if (filters?.limit) {
        query += ` TOP ${filters.limit}`;
      }

      const logs = await this.cosmosRepo.queryDocuments<AuditLog>('audit_logs', query, parameters);
      
      // Parse metadata back to objects
      return logs.map(log => ({
        ...log,
        metadata: log.metadata ? JSON.parse(log.metadata) : undefined,
      }));
    } catch (error) {
      logger.error('Failed to query audit logs', {
        tenantId,
        filters,
        error: error instanceof Error ? error.message : 'Unknown error',
      } as any);
      throw error;
    }
  }
}


