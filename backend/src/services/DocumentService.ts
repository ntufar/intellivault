import crypto from "node:crypto";
import { z } from "zod";
import { DocumentSchema, DocumentStatus, type Document } from "../models/Document";

export const UploadRequestSchema = z.object({
  tenant_id: z.string().uuid(),
  filename: z.string().min(1),
  mime_type: z.string().min(1),
  content: z.instanceof(Buffer),
  language: z.string().min(1).default("en"),
});

export type UploadRequest = z.infer<typeof UploadRequestSchema>;

export const ProcessingJobSchema = z.object({
  job_id: z.string().uuid(),
  document_id: z.string().uuid(),
  status: z.enum(["queued", "running", "completed", "failed"]),
});

export type ProcessingJob = z.infer<typeof ProcessingJobSchema>;

export class DocumentService {
  public computeChecksumSha256(content: Buffer): string {
    return crypto.createHash("sha256").update(content).digest("hex");
  }

  public buildUploadedDocument(input: UploadRequest, sizeBytes: number, checksumSha256: string): Document {
    const nowIso = new Date().toISOString();
    const doc: Document = {
      id: crypto.randomUUID(),
      tenant_id: input.tenant_id,
      filename: input.filename,
      mime_type: input.mime_type,
      size_bytes: sizeBytes,
      checksum_sha256: checksumSha256,
      status: DocumentStatus.Uploaded,
      language: input.language,
      created_at: nowIso,
      updated_at: nowIso,
    };
    DocumentSchema.parse(doc);
    return doc;
  }

  public enqueueProcessing(document: Document): ProcessingJob {
    const job: ProcessingJob = {
      job_id: crypto.randomUUID(),
      document_id: document.id,
      status: "queued",
    };
    ProcessingJobSchema.parse(job);
    return job;
  }
}


