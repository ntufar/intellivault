import { z } from "zod";

export enum KnowledgeGraphNodeType {
  Concept = "concept",
  Entity = "entity",
  Document = "document",
}

export const KnowledgeGraphNodeSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1),
  type: z.nativeEnum(KnowledgeGraphNodeType),
});

export type KnowledgeGraphNode = z.infer<typeof KnowledgeGraphNodeSchema>;


