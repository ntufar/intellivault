# Phase 0 Research: IntelliVault AI-Powered Document Intelligence

## Unknowns Resolved

- Processing time targets (FR-021)
  - Decision: Ingestion SLA targets by size class
  - Rationale: Aligns user expectations and capacity planning
  - Resolution:
    - Small (<= 10 MB): 2 minutes p95
    - Medium (<= 100 MB): 10 minutes p95
    - Large (<= 1 GB): 45 minutes p95
    - Very Large (> 1 GB): Asynchronous, chunked, best-effort with progress events

- Concurrent users (FR-022)
  - Decision: Support 250 concurrent interactive users (p95 < 1s for cached queries)
  - Rationale: Typical mid-sized org initial rollout; scalable via stateless services

- Collection scale limits (FR-023)
  - Decision: Initial limit 100M chunks (~10M docs average), soft cap; storage quota per tenant configurable
  - Rationale: Fits pgvector + sharding roadmap; avoids premature distributed complexity

- Compliance scope (FR-024)
  - Decision: GDPR baseline + SOC 2 readiness; HIPAA optional add-on (de-identification + BAA)
  - Rationale: Broadest applicability; phased compliance maturity

- Data retention (FR-025)
  - Decision: Configurable retention per tenant; default 365 days, legal hold exempt. Right to erasure honored within 30 days.
  - Rationale: Meets GDPR expectations while balancing cost

## Technology Selections

- Vector/semantic search: Azure AI Search with vector and semantic ranking; per-tenant indexes
- Embeddings and LLM: Azure OpenAI (text-embedding-3-large/small; gpt-4o/gpt-4.1 as applicable)
- Operational data: Azure Cosmos DB (SQL API); partition by tenant_id
- Document storage: Azure Blob Storage; private containers; SAS/Managed Identity for access
- Orchestration: BullMQ for ingestion pipelines; idempotent jobs, retries, dead-letter queues
- Contracts: OpenAPI v3.1, JSON Schema via zod for validation
- Observability: Structured JSON logs; request IDs; audit events for sensitive actions; Azure Monitor integration

## Alternatives Considered

- Self-managed PostgreSQL + pgvector
  - Rejected initially for simplicity, cost, and operational overhead

- Polyglot microservices
  - Rejected; start with monorepo web structure to reduce complexity

## Performance Strategy

- Embed chunks (1-2k tokens) with batching; cache embeddings for duplicates
- ANN indexing with HNSW via pgvector; periodic index maintenance
- Async enrichment post-ingest; UI shows processing status and partial availability

## Security & Privacy Considerations

- RBAC with least privilege; default deny
- Secrets via environment and external vault refs; never logged
- PII minimization; configurable redaction and de-identification for HIPAA mode

## Acceptance Alignment

- Semantic search returns top-k with highlighted spans and citations
- Summarization uses map-reduce over chunks; quality guardrails and source attributions
- Knowledge graph derived from entity co-occurrence and document links

---
All [NEEDS CLARIFICATION] items in the feature spec are resolved above.

