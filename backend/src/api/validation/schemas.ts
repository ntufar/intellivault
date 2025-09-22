import { z } from "zod";

// GET /v1/documents
export const ListDocumentsResponseSchema = z.object({
  documents: z.array(z.record(z.string(), z.unknown())),
});

// POST /v1/documents
export const UploadDocumentRequestSchema = z.object({
  // For JSON uploads; for multipart, validation handled via middleware in Integration phase
  tenant_id: z.string().uuid().optional(),
  filename: z.string().min(1).optional(),
  mime_type: z.string().min(1).optional(),
});

export const UploadDocumentResponseSchema = z.object({
  job: z.object({ id: z.string().min(1) }),
});

// GET /v1/search
export const SearchRequestQuerySchema = z.object({
  q: z.string().min(1),
  k: z.coerce.number().int().positive().default(10),
});

export const SearchResponseSchema = z.object({
  results: z.array(
    z.object({
      documentId: z.string().optional(),
      chunkIndex: z.number().int().nonnegative().optional(),
      score: z.number().optional(),
      text: z.string().optional(),
      source: z
        .object({ documentId: z.string(), chunkIndex: z.number().int().nonnegative() })
        .optional(),
    })
  ),
});

// POST /v1/qa
export const QARequestBodySchema = z.object({
  question: z.string().min(1),
});

export const QAResponseSchema = z.object({
  answer: z.string(),
  citations: z.array(
    z.object({ documentId: z.string(), chunkIndex: z.number().int().nonnegative(), snippet: z.string() })
  ),
});

export type ListDocumentsResponse = z.infer<typeof ListDocumentsResponseSchema>;
export type UploadDocumentResponse = z.infer<typeof UploadDocumentResponseSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;
export type QAResponse = z.infer<typeof QAResponseSchema>;


