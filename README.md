# IntelliVault - Intelligent Document Management System

## Overview
IntelliVault is a sophisticated document management system leveraging Azure's AI and cloud services to provide intelligent document processing, semantic search, and analytics capabilities. Built with scalability and security in mind, it employs a microservices architecture running on Azure Kubernetes Service.

## Features
- 📄 **Intelligent Document Processing**
  - Automated content extraction and analysis
  - Named entity recognition
  - Document classification
  - Sentiment analysis
  - AI-powered summarization

- 🔍 **Advanced Search Capabilities**
  - Semantic search using vector embeddings
  - Similar document discovery
  - Faceted search and filtering
  - Real-time search analytics

- 📊 **Analytics and Insights**
  - Document usage analytics
  - Search pattern analysis
  - System performance metrics
  - Custom reporting capabilities

- 🔐 **Enterprise-Grade Security**
  - Role-based access control (RBAC)
  - Document-level permissions
  - Encryption at rest and in transit
  - Comprehensive audit logging

## Architecture

### Microservices
- **Document Service**: Handles document upload, processing, and storage
- **Search Service**: Manages semantic search and document discovery
- **Analytics Service**: Provides insights and reporting capabilities

### Technology Stack
- **Backend**: Node.js 18+ with TypeScript
- **Cloud Platform**: Microsoft Azure
- **Database**: Azure Cosmos DB
- **Storage**: Azure Blob Storage
- **Search**: Azure AI Search
- **AI/ML**: Azure OpenAI Service, Azure AI Services
- **Orchestration**: Azure Kubernetes Service (AKS)
- **Monitoring**: Azure Monitor, Application Insights

## Prerequisites
- Azure Subscription with required services enabled
- Node.js 18 or later
- npm package manager
- Azure CLI
- Kubernetes CLI (kubectl)

## Getting Started

### Installation
1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/ntufar/intellivault.git
   cd intellivault
   \`\`\`

2. Run the setup script:
   \`\`\`bash
   ./scripts/setup/setup-dev-env.sh
   \`\`\`
   This script will:
   - Check prerequisites
   - Set up environment variables
   - Install dependencies
   - Initialize Azure Storage Emulator
   - Create necessary project directories

3. Configure environment variables:
   - Copy .env.example to .env
   - Update the .env file with your Azure credentials and configuration

### Development
1. Start the development servers:
   \`\`\`bash
   npm run dev
   \`\`\`
   This will start all microservices in development mode.

2. Run tests:
   \`\`\`bash
   npm test         # Run all tests
   npm test:watch   # Run tests in watch mode
   \`\`\`

### Building
\`\`\`bash
npm run build      # Build all services
npm run build:document  # Build document service only
npm run build:search   # Build search service only
npm run build:analytics # Build analytics service only
\`\`\`

## API Documentation

### Document Service
- **Upload Document**
  \`\`\`http
  POST /api/v1/documents
  Content-Type: multipart/form-data
  \`\`\`

- **Get Document Status**
  \`\`\`http
  GET /api/v1/documents/{id}/status
  \`\`\`

- **Get Document Content**
  \`\`\`http
  GET /api/v1/documents/{id}
  \`\`\`

### Search Service
- **Semantic Search**
  \`\`\`http
  POST /api/v1/search
  Content-Type: application/json
  \`\`\`

Full API documentation is available in the `/docs` directory.

## Deployment

### Prerequisites
- Azure Kubernetes Service (AKS) cluster
- Azure Container Registry (ACR)
- Required Azure services configured

### Deployment Steps
1. Build and push Docker images:
   \`\`\`bash
   ./scripts/deploy/build-images.sh
   \`\`\`

2. Deploy to AKS:
   \`\`\`bash
   ./scripts/deploy/deploy-to-aks.sh
   \`\`\`

3. Verify deployment:
   \`\`\`bash
   kubectl get pods -n intellivault
   \`\`\`

## Performance
- Search latency < 2s for 95th percentile
- Document processing < 5 minutes for standard documents
- Support for 1000+ concurrent users
- 10,000 documents/hour processing throughput

## Security Features
- Azure AD integration
- Role-based access control (RBAC)
- AES-256 encryption at rest
- TLS 1.3 for data in transit
- Private endpoints for Azure services
- Comprehensive audit logging

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License
[License Type] - see the [LICENSE](LICENSE) file for details

## Support
For support and questions, please [open an issue](https://github.com/ntufar/intellivault/issues) on GitHub.