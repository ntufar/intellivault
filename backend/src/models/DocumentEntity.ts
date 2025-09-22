import { z } from "zod";

export const DocumentEntitySchema = z.object({
  document_id: z.string().uuid(),
  entity_id: z.string().uuid(),
  offsets: z.record(z.string(), z.unknown()),
});

export type DocumentEntity = z.infer<typeof DocumentEntitySchema>;


