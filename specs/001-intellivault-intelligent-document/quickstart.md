# Quick Start Guide

## Prerequisites
- Azure Subscription with required services enabled
- Node.js 18+ and npm
- Docker Desktop
- Azure CLI
- Kubernetes CLI (kubectl)

## Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/intellivault.git
cd intellivault
```

2. Install dependencies:
```bash
npm install
```

3. Configure Azure credentials:
```bash
az login
az account set --subscription <subscription-id>
```

4. Create required Azure resources:
```bash
./scripts/setup/create-azure-resources.sh
```

5. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your Azure resource details
```

## Local Development

1. Start development environment:
```bash
npm run dev
```

2. Run tests:
```bash
npm test
```

3. Build containers:
```bash
npm run docker:build
```

## Deployment

1. Deploy to AKS:
```bash
./scripts/deploy/deploy-to-aks.sh
```

2. Verify deployment:
```bash
kubectl get pods -n intellivault
```

## API Documentation

### Document Upload
```typescript
POST /api/v1/documents
Content-Type: multipart/form-data

Request:
- file: File
- metadata: DocumentMetadata

Response:
{
  "id": string,
  "status": "processing",
  "uploadedAt": string
}
```

### Search
```typescript
POST /api/v1/search
Content-Type: application/json

Request:
{
  "query": string,
  "filters": Filter[],
  "page": number,
  "pageSize": number
}

Response:
{
  "results": SearchResult[],
  "facets": Facet[],
  "total": number
}
```

### Document Analysis
```typescript
GET /api/v1/documents/{id}/analysis
Content-Type: application/json

Response:
{
  "summary": string,
  "entities": Entity[],
  "topics": string[],
  "sentiment": number
}
```

## Monitoring

1. View application metrics:
```bash
az monitor metrics list ...
```

2. Check container logs:
```bash
kubectl logs -f deployment/intellivault -n intellivault
```

3. Access dashboards:
```
https://portal.azure.com/...
```

## Troubleshooting

1. Check system status:
```bash
./scripts/diagnostic/system-check.sh
```

2. View error logs:
```bash
./scripts/diagnostic/fetch-logs.sh
```

3. Common issues:
- Document processing timeout: Increase worker count
- Search latency: Check index optimization
- Authentication errors: Verify Azure AD configuration

## Security

1. Update SSL certificates:
```bash
./scripts/security/update-certs.sh
```

2. Rotate encryption keys:
```bash
./scripts/security/rotate-keys.sh
```

## Support
- Documentation: `/docs`
- Issues: GitHub Issues
- Wiki: Internal development wiki