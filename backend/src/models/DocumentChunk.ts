import { z } from "zod";

export const DocumentChunkSchema = z.object({
  id: z.string().uuid(),
  document_id: z.string().uuid(),
  chunk_index: z.number().int().nonnegative(),
  text: z.string(),
  embedding: z.array(z.number()).length(1536),
  created_at: z.string().datetime(),
});

export type DocumentChunk = z.infer<typeof DocumentChunkSchema>;


