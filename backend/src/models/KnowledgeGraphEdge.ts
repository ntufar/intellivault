import { z } from "zod";

export const KnowledgeGraphEdgeSchema = z.object({
  id: z.string().uuid(),
  source_id: z.string().uuid(),
  target_id: z.string().uuid(),
  relation: z.string().min(1),
});

export type KnowledgeGraphEdge = z.infer<typeof KnowledgeGraphEdgeSchema>;


