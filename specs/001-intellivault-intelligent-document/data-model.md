# Data Model Design

## Core Entities

### Document
```typescript
interface Document {
  id: string;                    // Unique identifier
  title: string;                 // Document title
  contentType: string;           // MIME type
  size: number;                  // Size in bytes
  metadata: DocumentMetadata;    // Extracted metadata
  vectors: VectorEmbeddings;     // AI embeddings
  content: DocumentContent;      // Processed content
  status: ProcessingStatus;      // Current status
  permissions: AccessControl[];  // Access rules
  created: Date;                // Creation timestamp
  updated: Date;                // Last update timestamp
}

interface DocumentMetadata {
  author: string[];
  createdDate: Date;
  modifiedDate: Date;
  keywords: string[];
  language: string;
  classification: string[];
  confidentiality: string;
}

interface VectorEmbeddings {
  model: string;           // Model used for embedding
  version: string;         // Model version
  vectors: number[];       // Vector values
  dimensions: number;      // Vector dimensions
  generated: Date;        // Generation timestamp
}

interface DocumentContent {
  text: string;           // Extracted text
  entities: Entity[];     // Named entities
  summary: string;        // AI-generated summary
  sentiment: number;      // Sentiment score
  topics: string[];       // Detected topics
}

interface ProcessingStatus {
  stage: string;          // Current processing stage
  progress: number;       // Progress percentage
  error?: string;         // Error message if any
  lastUpdated: Date;      // Status update timestamp
}
```

### User
```typescript
interface User {
  id: string;                  // Unique identifier
  email: string;               // User email
  name: string;                // Full name
  roles: Role[];               // User roles
  preferences: UserPreferences;// User settings
  created: Date;              // Account creation date
  lastLogin: Date;            // Last login timestamp
}

interface Role {
  name: string;               // Role name
  permissions: Permission[];  // Role permissions
  scope: string[];           // Access scope
}

interface UserPreferences {
  defaultFilters: Filter[];   // Search filters
  uiSettings: UISettings;     // UI preferences
  notifications: NotificationSettings;
}
```

### Search
```typescript
interface SearchQuery {
  id: string;                // Query identifier
  text: string;              // Search text
  filters: Filter[];         // Applied filters
  vector?: number[];         // Vector representation
  created: Date;            // Query timestamp
  userId: string;           // User who searched
}

interface SearchResult {
  query: SearchQuery;        // Original query
  documents: DocumentScore[];// Matched documents
  facets: Facet[];          // Search facets
  timing: SearchTiming;      // Performance metrics
}

interface DocumentScore {
  documentId: string;        // Document reference
  score: number;            // Relevance score
  highlights: Highlight[];  // Text highlights
  vectors: VectorMatch[];   // Vector matches
}
```

### Analytics
```typescript
interface AnalyticsEvent {
  id: string;               // Event identifier
  type: string;             // Event type
  timestamp: Date;          // Event time
  userId: string;           // User reference
  data: any;                // Event data
  metadata: EventMetadata;  // Additional info
}

interface EventMetadata {
  source: string;           // Event source
  version: string;          // Schema version
  correlationId: string;    // Tracking ID
  region: string;           // Azure region
}
```

## Data Storage

### Document Storage
- Raw documents stored in Azure Blob Storage
- Content and metadata in Azure Cosmos DB
- Vector embeddings in Azure AI Search

### User Data
- User profiles in Azure Cosmos DB
- Authentication via Azure AD B2C
- Session data in Azure Cache for Redis

### Analytics Data
- Real-time events in Azure Event Hubs
- Processed data in Azure Synapse
- Dashboards in Power BI

## Data Flow

### Document Processing Pipeline
1. Upload to Blob Storage
2. Trigger processing workflow
3. Extract text and metadata
4. Generate AI embeddings
5. Store processed data
6. Update search index

### Search Flow
1. Receive search query
2. Generate query vectors
3. Perform hybrid search
4. Score and rank results
5. Apply security filters
6. Return results

### Analytics Pipeline
1. Capture events
2. Process in real-time
3. Store aggregated data
4. Generate insights
5. Update dashboards

## Data Security

### Encryption
- AES-256 for data at rest
- TLS 1.3 for data in transit
- Key management in Azure Key Vault

### Access Control
- Role-based access control
- Document-level permissions
- Audit logging for all operations

### Compliance
- Data residency controls
- Retention policies
- Privacy controls