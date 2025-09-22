import { z } from "zod";

export enum DocumentStatus {
  Uploaded = "uploaded",
  Processing = "processing",
  Ready = "ready",
  Error = "error",
}

export const DocumentSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  filename: z.string().min(1),
  mime_type: z.string().min(1),
  size_bytes: z.number().int().nonnegative(),
  checksum_sha256: z.string().length(64),
  status: z.nativeEnum(DocumentStatus),
  language: z.string().min(1),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Document = z.infer<typeof DocumentSchema>;


