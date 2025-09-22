# IntelliVault AI-Powered Document Intelligence Platform

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Azure](https://img.shields.io/badge/Azure-Enabled-0078D4.svg)](https://azure.microsoft.com/)

IntelliVault is an AI-powered document intelligence platform that enables organizations to ingest, process, search, and analyze documents at scale. Built with modern web technologies and deployed on Microsoft Azure, it provides semantic search, document summarization, knowledge graph exploration, and Q&A capabilities with citations.

## 🚀 Features

### Core Capabilities
- **Multi-format Document Ingestion**: Support for PDF, DOCX, TXT, and more
- **Semantic Search**: AI-powered search across document collections using Azure AI Search
- **Document Summarization**: Automated summarization with key points and entity extraction
- **Q&A with Citations**: Ask questions and get answers with source attribution
- **Knowledge Graph**: Explore entity relationships and document connections
- **Entity Extraction**: Named Entity Recognition (NER) for persons, organizations, locations, dates, and more
- **RBAC Security**: Role-based access control with audit logging

### Technical Highlights
- **CLI-First Design**: All operations accessible via command-line interface
- **Azure-Native**: Leverages Azure AI Search, OpenAI, Cosmos DB, and Blob Storage
- **Kubernetes Ready**: Deployable on Azure Kubernetes Service (AKS)
- **TypeScript**: Full type safety across backend and frontend
- **Test-Driven Development**: Comprehensive test coverage with Vitest and Playwright

## 🏗️ Architecture

### Technology Stack
- **Backend**: Node.js 20 + TypeScript + Express
- **Frontend**: React 18 + TypeScript + Vite
- **Database**: Azure Cosmos DB (operational data)
- **Storage**: Azure Blob Storage (documents)
- **Search**: Azure AI Search (vector/semantic search)
- **AI/ML**: Azure OpenAI (GPT-4, embeddings)
- **Queue**: BullMQ + Redis (ingestion pipeline)
- **Deployment**: Kubernetes + Docker + AKS

### Project Structure
```
intellivault/
├── backend/                 # Node.js + TypeScript API
│   ├── src/
│   │   ├── api/            # REST endpoints
│   │   ├── cli/            # Command-line interface
│   │   ├── lib/            # Azure service clients
│   │   ├── models/         # Data models
│   │   ├── services/       # Business logic
│   │   └── workers/        # Background jobs
│   └── tests/              # Backend tests
├── frontend/               # React + TypeScript UI
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Application pages
│   │   └── services/       # API client
│   └── tests/              # Frontend tests
├── deploy/                 # Kubernetes manifests
│   ├── k8s/               # K8s resources
│   └── helm/              # Helm charts
└── specs/                 # Design documents
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Azure subscription with:
  - Azure OpenAI
  - Azure AI Search
  - Azure Cosmos DB
  - Azure Blob Storage

### Local Development Setup

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd intellivault
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Azure credentials
   ```

3. **Start Development Environment**
   ```bash
   # Start all services (backend, frontend, Redis)
   npm run docker:dev
   
   # Or start individually
   npm run dev          # Both frontend and backend
   npm run dev:backend  # Backend only (port 3001)
   npm run dev:frontend # Frontend only (port 3000)
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

### CLI Usage

The CLI provides access to all core functionality:

```bash
# Start services
./iv up

# Upload documents
./iv upload --path ./samples --tenant t1 --format json

# Semantic search
./iv search --q "contracts with termination clauses" --k 10 --tenant t1

# Document summarization
./iv summarize --doc-id <document-id> --format json

# Q&A with citations
./iv ask --q "What are the payment terms?" --tenant t1 --with-sources

# Knowledge graph exploration
./iv graph --entity "Acme Corp" --format json
```

## 📚 API Documentation

### REST Endpoints

#### Documents
- `GET /v1/documents?tenantId={id}` - List documents
- `POST /v1/documents?tenantId={id}` - Upload document

#### Search
- `GET /v1/search?tenantId={id}&q={query}&k={limit}` - Semantic search

#### Q&A
- `POST /v1/qa` - Ask questions with citations

### OpenAPI Specification
The complete API specification is available at `/specs/001-intellivault-ai-powered/contracts/openapi.yaml`.

## 🧪 Testing

### Running Tests
```bash
# All tests
npm test

# Backend tests
npm run test:backend

# Frontend tests
npm run test:frontend

# Contract tests
npm run test:backend -- tests/contract/

# Integration tests
npm run test:backend -- tests/integration/

# E2E tests
npm run test:frontend
```

### Test Coverage
- **Contract Tests**: Validate API schemas and endpoints
- **Integration Tests**: Test CLI workflows and service integrations
- **Unit Tests**: Test individual services and components
- **E2E Tests**: Full user workflows with Playwright

## 🚀 Deployment

### Kubernetes Deployment

1. **Build Images**
   ```bash
   npm run build
   docker build -t intellivault-backend ./backend
   docker build -t intellivault-frontend ./frontend
   ```

2. **Deploy to AKS**
   ```bash
   # Apply Kubernetes manifests
   kubectl apply -f deploy/k8s/
   
   # Or use Helm
   helm install intellivault ./deploy/helm/intellivault/
   ```

3. **Configure Secrets**
   ```bash
   kubectl apply -f deploy/k8s/secrets.yaml
   ```

### CI/CD Pipeline
GitHub Actions workflow automatically builds, tests, and deploys to AKS on push to main branch.

## 🔧 Development

### Code Quality
```bash
# Linting
npm run lint

# Formatting
npm run format

# Type checking
npm run build
```

### Adding New Features
1. Write failing tests first (TDD)
2. Implement the feature
3. Ensure all tests pass
4. Update documentation

### Project Conventions
- **TypeScript**: Strict mode enabled
- **ESLint**: Enforced code style
- **Prettier**: Consistent formatting
- **Conventional Commits**: Structured commit messages
- **Semantic Versioning**: Version management

## 📊 Performance Targets

- **Search Latency**: p95 < 500ms for top-k=10 queries
- **Ingestion Throughput**: ≥ 100 documents/minute
- **Concurrent Users**: 250+ interactive users
- **Document Scale**: 100M+ chunks (~10M documents)

## 🔒 Security

- **RBAC**: Role-based access control (admin, analyst, viewer)
- **Audit Logging**: All sensitive actions logged
- **Secrets Management**: Environment-based configuration
- **Data Privacy**: GDPR compliance with configurable retention
- **Network Security**: CORS, security headers, input validation

## 📈 Monitoring & Observability

- **Structured Logging**: JSON logs with request IDs
- **Azure Monitor**: Application insights and metrics
- **Health Checks**: Kubernetes readiness/liveness probes
- **Error Tracking**: Comprehensive error handling and reporting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for your changes
4. Ensure all tests pass
5. Submit a pull request

### Development Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and test
npm test
npm run lint
npm run format

# Commit with conventional format
git commit -m "feat: add new search capability"

# Push and create PR
git push origin feature/your-feature
```

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check `/docs/` directory
- **Issues**: GitHub Issues for bug reports
- **Discussions**: GitHub Discussions for questions

## 🗺️ Roadmap

### Phase 1: Core Platform ✅
- [x] Project setup and infrastructure
- [x] Basic document ingestion
- [x] Semantic search
- [x] CLI interface

### Phase 2: Advanced Features 🚧
- [ ] Knowledge graph visualization
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Custom entity types

### Phase 3: Enterprise Features 📋
- [ ] SSO integration
- [ ] Advanced RBAC
- [ ] Data export/import
- [ ] API rate limiting

### Phase 4: Scale & Performance 📋
- [ ] Horizontal scaling
- [ ] Caching layer
- [ ] Performance optimization
- [ ] Global deployment

---

**Built with ❤️ using TypeScript, React, and Microsoft Azure**
