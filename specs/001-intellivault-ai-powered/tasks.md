# Tasks: IntelliVault AI-Powered Document Intelligence

**Input**: Design documents from `specs/001-intellivault-ai-powered/`
**Prerequisites**: `plan.md` (required), `research.md`, `data-model.md`, `contracts/openapi.yaml`, `quickstart.md`

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Extract: tech stack, libraries, structure (web app: backend + frontend)
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
   → quickstart.md: Extract scenarios → integration tests
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract + integration tests (fail first)
   → Core: models, services, CLI, endpoints
   → Integration: DB, queues, middleware, logging
   → Deployment: Kubernetes manifests/Helm, AKS provisioning, CI/CD
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Add dependency notes and parallel examples
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include repository-relative file paths in descriptions

## Path Conventions (from plan.md)
- Web application structure
  - Backend code: `backend/src/`
  - Backend tests: `backend/tests/`
  - Frontend code: `frontend/src/`
  - Frontend tests: `frontend/tests/`
  - CLI: `backend/src/cli/`
  - Kubernetes/Helm: `deploy/k8s/`, `deploy/helm/intellivault/`
  - CI/CD: `.github/workflows/`
  - Infra-as-Code (optional): `infra/azure/`

## Phase 3.1: Setup
- [X] T001 Create project structure per implementation plan (backend/, frontend/)
  - Paths: `backend/`, `frontend/`
- [X] T002 Initialize backend TypeScript Node project with dependencies
  - Path: `backend/`
  - Add: Express, zod, Vitest, ts-node, tsx, supertest, swagger-parser, openapi-types, Azure SDKs (ai-search-documents, openai, cosmos, storage-blob), bullmq, ioredis, pino, pino-pretty, dotenv, jsonschema-to-zod (as needed)
- [X] T003 Initialize frontend React 18 + TypeScript (Vite) with Playwright tests
  - Path: `frontend/`
- [X] T004 [P] Configure linting/formatting for backend (ESLint + Prettier + TypeScript config)
  - Paths: `backend/.eslintrc.cjs`, `backend/.prettierrc`, `backend/tsconfig.json`
- [X] T005 [P] Configure linting/formatting for frontend (ESLint + Prettier + TypeScript config)
  - Paths: `frontend/.eslintrc.cjs`, `frontend/.prettierrc`, `frontend/tsconfig.json`
- [X] T006 Configure workspace scripts and Docker dev setup
  - Paths: `package.json`, `docker-compose.yml`, `.env.example`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation

From contracts (`specs/001-intellivault-ai-powered/contracts/openapi.yaml`):
- [X] T007 [P] Contract test for `openapi.yaml` (validate schema + endpoint shapes)
  - Path: `backend/tests/contract/openapi.v1.contract.test.ts`
  - Assert: paths `/v1/documents` (GET, POST), `/v1/search` (GET), `/v1/qa` (POST) request/response schemas

From quickstart scenarios (`quickstart.md`):
- [X] T008 [P] Integration test: CLI `iv up` starts services and outputs JSON status
  - Path: `backend/tests/integration/cli.up.test.ts`
- [X] T009 [P] Integration test: CLI `iv upload --path ./samples --tenant t1`
  - Path: `backend/tests/integration/cli.upload.test.ts`
- [X] T010 [P] Integration test: CLI `iv search --q "..." --k 10 --tenant t1`
  - Path: `backend/tests/integration/cli.search.test.ts`
- [X] T011 [P] Integration test: CLI `iv summarize --doc-id <id>`
  - Path: `backend/tests/integration/cli.summarize.test.ts`
- [X] T012 [P] Integration test: CLI `iv ask --q "..." --with-sources`
  - Path: `backend/tests/integration/cli.ask.test.ts`
- [X] T013 [P] Integration test: CLI `iv graph --entity "Acme Corp"`
  - Path: `backend/tests/integration/cli.graph.test.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)
Models from `data-model.md` (each model task is independent → [P]):
- [X] T014 [P] Create `Document` model
  - Path: `backend/src/models/Document.ts`
- [X] T015 [P] Create `DocumentChunk` model
  - Path: `backend/src/models/DocumentChunk.ts`
- [X] T016 [P] Create `Entity` model
  - Path: `backend/src/models/Entity.ts`
- [X] T017 [P] Create `DocumentEntity` join model
  - Path: `backend/src/models/DocumentEntity.ts`
- [X] T018 [P] Create `KnowledgeGraphNode` model
  - Path: `backend/src/models/KnowledgeGraphNode.ts`
- [X] T019 [P] Create `KnowledgeGraphEdge` model
  - Path: `backend/src/models/KnowledgeGraphEdge.ts`
- [X] T020 [P] Create `User` model with role enum
  - Path: `backend/src/models/User.ts`
- [X] T021 [P] Create `SearchQuery` model
  - Path: `backend/src/models/SearchQuery.ts`
- [X] T022 [P] Create `AuditLog` model
  - Path: `backend/src/models/AuditLog.ts`

Core services (depend on models):
- [X] T023 Implement `DocumentService` (upload orchestration, checksum, status transitions)
  - Path: `backend/src/services/DocumentService.ts`
- [X] T024 Implement `ChunkingService` + `EmbeddingService` (batching, caching)
  - Path: `backend/src/services/EmbeddingService.ts`
- [ ] T025 Implement `SearchService` (Azure AI Search client + queries)
  - Path: `backend/src/services/SearchService.ts`
- [ ] T026 Implement `QAService` (retrieve-then-read; citations)
  - Path: `backend/src/services/QAService.ts`
- [ ] T027 Implement `GraphService` (build/explore knowledge graph)
  - Path: `backend/src/services/GraphService.ts`
- [ ] T028 Implement `EntityService` (NER extraction + linking, stub to start)
  - Path: `backend/src/services/EntityService.ts`
- [ ] T029 Implement `AuditService` (structured audit logging)
  - Path: `backend/src/services/AuditService.ts`
- [ ] T030 Implement `AuthService` (JWT parsing, roles, RBAC checks)
  - Path: `backend/src/services/AuthService.ts`

CLI-first commands (depend on services):
- [X] T031 Implement CLI entrypoint `iv` and subcommands: `up`, `upload`, `search`, `summarize`, `ask`, `graph`
  - Path: `backend/src/cli/index.ts`

API endpoints (Express; depend on services):
- [X] T032 Implement GET `/v1/documents` (list documents)
  - Path: `backend/src/api/routes/documents.get.ts`
- [X] T033 Implement POST `/v1/documents` (upload; returns `ProcessingJob`)
  - Path: `backend/src/api/routes/documents.post.ts`
- [X] T034 Implement GET `/v1/search` (semantic search)
  - Path: `backend/src/api/routes/search.get.ts`
- [X] T035 Implement POST `/v1/qa` (Q&A with citations)
  - Path: `backend/src/api/routes/qa.post.ts`
- [X] T036 Add zod request/response validation aligned with OpenAPI
  - Path: `backend/src/api/validation/schemas.ts`

Frontend scaffolding (minimal; depends on endpoints):
- [X] T037 Create basic React app shell with auth and API client
  - Path: `frontend/src/`

## Phase 3.4: Integration
Platform integrations (depend on services/endpoints):
- [X] T038 Configure Azure Cosmos DB client and repositories (partition by `tenant_id`)
  - Path: `backend/src/lib/cosmos.ts`
- [X] T039 Configure Azure Blob Storage client and upload helper
  - Path: `backend/src/lib/blob.ts`
- [X] T040 Configure Azure AI Search client and index helpers
  - Path: `backend/src/lib/ai-search.ts`
- [X] T041 Configure Azure OpenAI client
  - Path: `backend/src/lib/openai.ts`
- [X] T042 Setup BullMQ queues and workers for ingestion pipeline
  - Path: `backend/src/workers/ingestion.worker.ts`
- [X] T043 Implement Express middleware: auth, request logging, error handler, CORS, security headers
  - Path: `backend/src/api/middleware/`
- [X] T044 Add structured logging (pino) and request IDs throughout
  - Path: `backend/src/lib/logger.ts`
- [X] T045 Add audit events for sensitive actions (upload, search, qa)
  - Path: `backend/src/services/AuditService.ts`

## Phase 3.5: Deployment (Kubernetes + AKS)
- [X] T046 Create Kubernetes manifests for backend API and frontend
  - Paths: `deploy/k8s/backend-deployment.yaml`, `deploy/k8s/backend-service.yaml`, `deploy/k8s/frontend-deployment.yaml`, `deploy/k8s/frontend-service.yaml`, `deploy/k8s/ingress.yaml`
- [X] T047 Create ConfigMaps/Secrets templates for Azure credentials and config
  - Paths: `deploy/k8s/configmap.yaml`, `deploy/k8s/secrets.example.yaml`
- [X] T048 Create Helm chart for IntelliVault (values for dev/prod)
  - Path: `deploy/helm/intellivault/`
- [ ] T049 Provision AKS and Azure dependencies via IaC (Bicep/Terraform) (optional)
  - Path: `infra/azure/`
- [X] T050 Setup GitHub Actions workflow: build, push images, deploy to AKS
  - Path: `.github/workflows/deploy-aks.yml`
- [X] T051 Document AKS deployment steps and rollback procedures
  - Path: `docs/AKS-DEPLOYMENT.md`

## Phase 3.6: Polish
- [ ] T052 [P] Unit tests for services (Document, Search, QA)
  - Path: `backend/tests/unit/`
- [ ] T053 Performance test: search p95 < 500ms at k=10 (mock index)
  - Path: `backend/tests/perf/search.perf.test.ts`
- [ ] T054 [P] Update docs: API usage and CLI quickstart
  - Paths: `docs/PRD.md`, `specs/001-intellivault-ai-powered/quickstart.md`
- [ ] T055 Security review: secrets handling, roles, and logs (no secrets)
  - Path: `SECURITY.md`
- [ ] T056 Cleanup duplication and run linters/formatters
  - Paths: backend + frontend repos

## Dependencies
- Setup (T001–T006) before all tests and implementation
- Contract + integration tests (T007–T013) before any implementation (T014+)
- Models (T014–T022) before services (T023–T030)
- Services before CLI and endpoints (T031–T036)
- Endpoints before frontend scaffold (T037)
- Core before platform integrations (T038–T045)
- Container images available before K8s manifests are applied (T031, T032–T036 before T046)
- Deployment (T046–T051) before final polish (T052–T056)

## Parallel Execution Guidance
Mark [P] tasks can run concurrently. Suggested batches:

```
# Batch A (Setup Parallel)
T004, T005

# Batch B (Tests Parallel)
T007, T008, T009, T010, T011, T012, T013

# Batch C (Models Parallel)
T014, T015, T016, T017, T018, T019, T020, T021, T022

# Batch D (Deployment Prep Parallel)
T046, T047, T048

# Batch E (Polish Parallel)
T052, T054
```

## Task Agent Commands (examples)
```
# Launch contract + integration tests together [P]
Task: "Write failing contract test in backend/tests/contract/openapi.v1.contract.test.ts"
Task: "Write failing CLI up test in backend/tests/integration/cli.up.test.ts"
Task: "Write failing CLI upload test in backend/tests/integration/cli.upload.test.ts"
Task: "Write failing CLI search test in backend/tests/integration/cli.search.test.ts"
Task: "Write failing CLI summarize test in backend/tests/integration/cli.summarize.test.ts"
Task: "Write failing CLI ask test in backend/tests/integration/cli.ask.test.ts"
Task: "Write failing CLI graph test in backend/tests/integration/cli.graph.test.ts"

# Generate K8s/Helm deployment assets [P]
Task: "Create backend/frontend Deployment/Service/Ingress in deploy/k8s/*.yaml"
Task: "Create Helm chart in deploy/helm/intellivault/ with values files"
Task: "Scaffold deploy-aks.yml GitHub Actions workflow"
```

## Validation Checklist
- [ ] All contracts have corresponding tests
- [ ] All entities have model tasks
- [ ] All tests come before implementation
- [ ] Parallel tasks truly independent
- [ ] Each task specifies exact file path
- [ ] No task modifies same file as another [P] task
- [ ] Kubernetes/AKS deployment assets present and CI/CD configured
