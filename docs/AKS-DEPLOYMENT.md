# IntelliVault AKS Deployment Guide

This document provides comprehensive instructions for deploying IntelliVault to Azure Kubernetes Service (AKS) using Helm charts and GitHub Actions CI/CD.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Azure Resources Setup](#azure-resources-setup)
- [GitHub Secrets Configuration](#github-secrets-configuration)
- [Deployment Methods](#deployment-methods)
- [Environment-Specific Deployments](#environment-specific-deployments)
- [Monitoring and Troubleshooting](#monitoring-and-troubleshooting)
- [Rollback Procedures](#rollback-procedures)
- [Security Considerations](#security-considerations)

## Prerequisites

### Required Tools
- Azure CLI (`az`)
- kubectl
- Helm 3.12+
- Docker
- Git

### Azure Resources
- Azure subscription with appropriate permissions
- AKS cluster (1.24+)
- Azure Container Registry (ACR) or GitHub Container Registry
- Azure Cosmos DB
- Azure Blob Storage
- Azure AI Search
- Azure OpenAI Service

## Azure Resources Setup

### 1. Create AKS Cluster

```bash
# Create resource group
az group create --name intellivault-rg --location eastus

# Create AKS cluster
az aks create \
  --resource-group intellivault-rg \
  --name intellivault-aks \
  --node-count 3 \
  --node-vm-size Standard_D2s_v3 \
  --enable-addons monitoring \
  --enable-managed-identity \
  --generate-ssh-keys

# Get credentials
az aks get-credentials --resource-group intellivault-rg --name intellivault-aks
```

### 2. Install Required Add-ons

```bash
# Install NGINX Ingress Controller
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace

# Install cert-manager for SSL certificates
helm repo add jetstack https://charts.jetstack.io
helm repo update
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --version v1.13.0 \
  --set installCRDs=true
```

### 3. Create Azure Resources

```bash
# Create Cosmos DB
az cosmosdb create \
  --resource-group intellivault-rg \
  --name intellivault-cosmos \
  --kind GlobalDocumentDB \
  --locations regionName=eastus failoverPriority=0 isZoneRedundant=False

# Create Storage Account
az storage account create \
  --resource-group intellivault-rg \
  --name intellivaultstorage \
  --location eastus \
  --sku Standard_LRS

# Create AI Search
az search service create \
  --resource-group intellivault-rg \
  --name intellivault-search \
  --sku standard \
  --location eastus

# Create OpenAI Service
az cognitiveservices account create \
  --resource-group intellivault-rg \
  --name intellivault-openai \
  --kind OpenAI \
  --sku S0 \
  --location eastus
```

## GitHub Secrets Configuration

Configure the following secrets in your GitHub repository:

### Required Secrets

```yaml
# Azure Authentication
AZURE_CREDENTIALS: |
  {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "subscriptionId": "your-subscription-id",
    "tenantId": "your-tenant-id"
  }

# Azure Resource Information
AZURE_RESOURCE_GROUP: "intellivault-rg"
AZURE_AKS_CLUSTER_NAME: "intellivault-aks"

# Azure Service Keys
AZURE_COSMOS_KEY: "your-cosmos-db-key"
AZURE_STORAGE_KEY: "your-storage-account-key"
AZURE_SEARCH_KEY: "your-search-api-key"
AZURE_OPENAI_KEY: "your-openai-api-key"

# Application Secrets
JWT_SECRET: "your-jwt-secret-key"

# Optional: Slack Notifications
SLACK_WEBHOOK: "your-slack-webhook-url"
```

### How to Get Azure Credentials

```bash
# Create service principal
az ad sp create-for-rbac --name "intellivault-github-actions" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/intellivault-rg \
  --sdk-auth
```

## Deployment Methods

### 1. Automated Deployment (Recommended)

The GitHub Actions workflow automatically deploys based on branch:

- **Develop branch** → Deploys to `dev` environment
- **Main branch** → Deploys to `prod` environment
- **Manual trigger** → Choose environment via workflow_dispatch

### 2. Manual Deployment

#### Using Helm Directly

```bash
# Deploy to dev
helm upgrade --install intellivault-dev ./deploy/helm/intellivault \
  --namespace intellivault-dev \
  --create-namespace \
  --values ./deploy/helm/intellivault/values-dev.yaml \
  --set secrets.cosmosKey="your-cosmos-key" \
  --set secrets.storageAccountKey="your-storage-key" \
  --set secrets.searchApiKey="your-search-key" \
  --set secrets.openaiApiKey="your-openai-key" \
  --set secrets.jwtSecret="your-jwt-secret"

# Deploy to prod
helm upgrade --install intellivault-prod ./deploy/helm/intellivault \
  --namespace intellivault-prod \
  --create-namespace \
  --values ./deploy/helm/intellivault/values-prod.yaml
```

#### Using kubectl with Raw Manifests

```bash
# Apply all manifests
kubectl apply -f deploy/k8s/

# Create secrets manually
kubectl create secret generic intellivault-secrets \
  --from-literal=cosmos-key="your-cosmos-key" \
  --from-literal=storage-account-key="your-storage-key" \
  --from-literal=search-api-key="your-search-key" \
  --from-literal=openai-api-key="your-openai-key" \
  --from-literal=jwt-secret="your-jwt-secret"
```

## Environment-Specific Deployments

### Development Environment

- **Namespace**: `intellivault-dev`
- **Replicas**: 1 backend, 1 frontend
- **Resources**: Reduced limits for cost optimization
- **Storage**: Local Redis, Azure emulators
- **Logging**: Debug level
- **SSL**: Disabled (HTTP only)

### Production Environment

- **Namespace**: `intellivault-prod`
- **Replicas**: 5 backend, 3 frontend
- **Resources**: Full production limits
- **Storage**: Managed Redis, Azure services
- **Logging**: Info level
- **SSL**: Enabled with Let's Encrypt certificates
- **Monitoring**: Prometheus metrics enabled
- **Autoscaling**: HPA configured

## Monitoring and Troubleshooting

### Health Checks

```bash
# Check pod status
kubectl get pods -n intellivault-dev
kubectl get pods -n intellivault-prod

# Check service status
kubectl get svc -n intellivault-dev
kubectl get svc -n intellivault-prod

# Check ingress status
kubectl get ingress -n intellivault-dev
kubectl get ingress -n intellivault-prod
```

### Logs

```bash
# Backend logs
kubectl logs -f deployment/intellivault-dev-backend -n intellivault-dev

# Frontend logs
kubectl logs -f deployment/intellivault-dev-frontend -n intellivault-dev

# All logs in namespace
kubectl logs -f -l app=intellivault -n intellivault-dev
```

### Common Issues

1. **Image Pull Errors**
   ```bash
   # Check image pull secrets
   kubectl get secrets -n intellivault-dev
   kubectl describe secret intellivault-registry-secret -n intellivault-dev
   ```

2. **Resource Quotas**
   ```bash
   # Check resource quotas
   kubectl describe quota -n intellivault-dev
   ```

3. **Ingress Issues**
   ```bash
   # Check ingress controller
   kubectl get pods -n ingress-nginx
   kubectl describe ingress intellivault-ingress -n intellivault-dev
   ```

## Rollback Procedures

### 1. Helm Rollback

```bash
# Check release history
helm history intellivault-dev -n intellivault-dev

# Rollback to previous version
helm rollback intellivault-dev -n intellivault-dev

# Rollback to specific revision
helm rollback intellivault-dev 2 -n intellivault-dev
```

### 2. Emergency Rollback

```bash
# Scale down current deployment
kubectl scale deployment intellivault-dev-backend --replicas=0 -n intellivault-dev

# Deploy previous version
helm upgrade intellivault-dev ./deploy/helm/intellivault \
  --namespace intellivault-dev \
  --values ./deploy/helm/intellivault/values-dev.yaml \
  --set image.tag=previous-tag
```

### 3. Database Rollback

```bash
# Restore from backup (if available)
az cosmosdb sql database restore \
  --resource-group intellivault-rg \
  --account-name intellivault-cosmos \
  --database-name intellivault \
  --restore-timestamp 2024-01-01T00:00:00Z
```

## Security Considerations

### 1. Secrets Management

- Use Azure Key Vault for production secrets
- Rotate secrets regularly
- Never commit secrets to version control
- Use external secret operators for automatic secret injection

### 2. Network Security

- Configure network policies
- Use private clusters when possible
- Implement proper RBAC
- Enable audit logging

### 3. Container Security

- Scan images for vulnerabilities
- Use non-root containers
- Implement resource limits
- Regular security updates

### 4. Data Protection

- Enable encryption at rest
- Use managed identities
- Implement proper backup strategies
- Comply with data retention policies

## Maintenance

### Regular Tasks

1. **Update Dependencies**
   ```bash
   # Update Helm dependencies
   helm dependency update ./deploy/helm/intellivault
   ```

2. **Monitor Resource Usage**
   ```bash
   # Check resource usage
   kubectl top nodes
   kubectl top pods -n intellivault-prod
   ```

3. **Backup Configuration**
   ```bash
   # Backup Helm releases
   helm get all intellivault-prod -n intellivault-prod > backup-prod.yaml
   ```

### Scaling

```bash
# Scale backend horizontally
kubectl scale deployment intellivault-prod-backend --replicas=10 -n intellivault-prod

# Scale frontend horizontally
kubectl scale deployment intellivault-prod-frontend --replicas=5 -n intellivault-prod
```

## Support

For issues and questions:
- Check the troubleshooting section above
- Review application logs
- Contact the platform team
- Create an issue in the repository

---

**Last Updated**: 2024-01-01
**Version**: 1.0.0
