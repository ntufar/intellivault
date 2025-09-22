# Data Model: IntelliVault

## Entities

### Document
- id (UUID)
- tenant_id (UUID)
- filename (string)
- mime_type (string)
- size_bytes (int)
- checksum_sha256 (string)
- status (enum: uploaded, processing, ready, error)
- language (string)
- created_at, updated_at (timestamp)

### DocumentChunk
- id (UUID)
- document_id (UUID)
- chunk_index (int)
- text (text)
- embedding (vector[1536])
- created_at (timestamp)

### Entity
- id (UUID)
- type (enum: person, org, location, date, money, other)
- value (string)
- canonical_id (UUID|null)

### DocumentEntity
- document_id (UUID)
- entity_id (UUID)
- offsets (json)

### KnowledgeGraphNode
- id (UUID)
- label (string)
- type (enum: concept, entity, document)

### KnowledgeGraphEdge
- id (UUID)
- source_id (UUID)
- target_id (UUID)
- relation (string)

### User
- id (UUID)
- email (string)
- role (enum: admin, analyst, viewer)
- created_at (timestamp)

### SearchQuery
- id (UUID)
- tenant_id (UUID)
- query_text (string)
- filters (json)
- created_by (UUID)
- created_at (timestamp)

### AuditLog
- id (UUID)
- tenant_id (UUID)
- actor_id (UUID)
- action (string)
- resource (string)
- result (string)
- metadata (json)
- created_at (timestamp)

## Relationships
- Document 1—* DocumentChunk
- Document *—* Entity (via DocumentEntity)
- KnowledgeGraphNode *—* KnowledgeGraphNode (edges)

## Validation Rules
- `checksum_sha256` unique per tenant → duplicates detection (FR-010)
- `mime_type` must be one of supported formats (FR-001)
- `role` enforces RBAC (FR-015)

## Notes
- Embedding dimension depends on embedding model; placeholder 1536.

