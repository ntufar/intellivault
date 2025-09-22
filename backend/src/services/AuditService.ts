export type AuditEvent = {
  tenantId: string;
  actorId: string;
  action: string;
  resource: string;
  result: string;
  metadata?: Record<string, unknown>;
};

export class AuditService {
  public async log(event: AuditEvent): Promise<void> {
    // Stub: route to logger or DB in Integration phase
    void event;
  }
}


