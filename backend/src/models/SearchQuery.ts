import { z } from "zod";

export const SearchQuerySchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  query_text: z.string().min(1),
  filters: z.record(z.string(), z.unknown()),
  created_by: z.string().uuid(),
  created_at: z.string().datetime(),
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;


