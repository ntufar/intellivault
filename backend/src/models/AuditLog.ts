import { z } from "zod";

export const AuditLogSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  actor_id: z.string().uuid(),
  action: z.string().min(1),
  resource: z.string().min(1),
  result: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()),
  created_at: z.string().datetime(),
});

export type AuditLog = z.infer<typeof AuditLogSchema>;


