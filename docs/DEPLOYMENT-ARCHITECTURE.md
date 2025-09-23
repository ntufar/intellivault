# IntelliVault Deployment Architecture

## Overview

IntelliVault is designed for cloud-native deployment on Azure Kubernetes Service (AKS) with a focus on scalability, reliability, and maintainability. The deployment architecture supports multiple environments, automated CI/CD pipelines, and infrastructure as code practices.

## Deployment Environments

### 1. Development Environment
- **Purpose**: Local development and testing
- **Infrastructure**: Docker Compose with local services
- **Resources**: Minimal resource allocation
- **Access**: Internal development team only

### 2. Staging Environment
- **Purpose**: Pre-production testing and validation
- **Infrastructure**: AKS cluster with production-like configuration
- **Resources**: Scaled-down production resources
- **Access**: QA team and stakeholders

### 3. Production Environment
- **Purpose**: Live production workloads
- **Infrastructure**: Multi-region AKS deployment
- **Resources**: Full production resource allocation
- **Access**: End users and administrators

## Infrastructure Components

### Azure Resources

#### Compute Infrastructure
```yaml
# AKS Cluster Configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: aks-config
data:
  cluster_name: "intellivault-aks"
  node_count: "5"
  node_vm_size: "Standard_D4s_v3"
  enable_auto_scaling: "true"
  min_nodes: "3"
  max_nodes: "20"
  kubernetes_version: "1.28"
```

#### Storage Infrastructure
```yaml
# Azure Storage Configuration
storage:
  cosmos_db:
    api: "sql"
    consistency_level: "Session"
    throughput: 4000
    partitions: 10
  
  blob_storage:
    tier: "Hot"
    replication: "LRS"
    hierarchical_namespace: true
  
  ai_search:
    tier: "Standard"
    replicas: 3
    partitions: 3
```

#### Network Infrastructure
```yaml
# Network Configuration
network:
  vnet:
    address_space: "10.0.0.0/16"
    subnets:
      - name: "aks-subnet"
        address_prefix: "10.0.1.0/24"
      - name: "app-gateway-subnet"
        address_prefix: "10.0.2.0/24"
  
  private_endpoints:
    - cosmos_db
    - blob_storage
    - ai_search
    - openai
```

## Kubernetes Deployment

### Namespace Structure
```yaml
# Production Namespaces
apiVersion: v1
kind: Namespace
metadata:
  name: intellivault-prod
  labels:
    environment: production
    app: intellivault
---
apiVersion: v1
kind: Namespace
metadata:
  name: intellivault-staging
  labels:
    environment: staging
    app: intellivault
---
apiVersion: v1
kind: Namespace
metadata:
  name: intellivault-dev
  labels:
    environment: development
    app: intellivault
```

### Backend Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: intellivault-backend
  namespace: intellivault-prod
spec:
  replicas: 5
  selector:
    matchLabels:
      app: intellivault-backend
  template:
    metadata:
      labels:
        app: intellivault-backend
    spec:
      containers:
      - name: backend
        image: intellivault/backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Frontend Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: intellivault-frontend
  namespace: intellivault-prod
spec:
  replicas: 3
  selector:
    matchLabels:
      app: intellivault-frontend
  template:
    metadata:
      labels:
        app: intellivault-frontend
    spec:
      containers:
      - name: frontend
        image: intellivault/frontend:latest
        ports:
        - containerPort: 80
        env:
        - name: REACT_APP_API_URL
          value: "https://api.intellivault.example.com"
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
```

### Worker Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: intellivault-workers
  namespace: intellivault-prod
spec:
  replicas: 3
  selector:
    matchLabels:
      app: intellivault-workers
  template:
    metadata:
      labels:
        app: intellivault-workers
    spec:
      containers:
      - name: worker
        image: intellivault/worker:latest
        env:
        - name: NODE_ENV
          value: "production"
        - name: WORKER_TYPE
          value: "document-processor"
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
```

## Helm Chart Structure

### Chart Configuration
```yaml
# Chart.yaml
apiVersion: v2
name: intellivault
description: IntelliVault AI-Powered Document Intelligence Platform
type: application
version: 0.1.0
appVersion: "1.0.0"
dependencies:
  - name: redis
    version: "17.3.7"
    repository: "https://charts.bitnami.com/bitnami"
    condition: redis.enabled
```

### Values Configuration
```yaml
# values.yaml
global:
  imageRegistry: "intellivault.azurecr.io"
  imagePullSecrets:
    - name: intellivault-registry-secret

image:
  repository: backend
  tag: latest
  pullPolicy: IfNotPresent

frontendImage:
  repository: frontend
  tag: latest
  pullPolicy: IfNotPresent

backend:
  replicaCount: 3
  resources:
    limits:
      cpu: 500m
      memory: 1Gi
    requests:
      cpu: 250m
      memory: 512Mi

frontend:
  replicaCount: 2
  resources:
    limits:
      cpu: 200m
      memory: 256Mi
    requests:
      cpu: 100m
      memory: 128Mi

workers:
  replicaCount: 2
  resources:
    limits:
      cpu: 1000m
      memory: 2Gi
    requests:
      cpu: 500m
      memory: 1Gi

redis:
  enabled: true
  auth:
    enabled: false
  master:
    resources:
      limits:
        memory: 512Mi
        cpu: 250m
      requests:
        memory: 256Mi
        cpu: 100m

ingress:
  enabled: true
  className: "nginx"
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
  hosts:
    - host: api.intellivault.example.com
      paths:
        - path: /
          pathType: Prefix
    - host: app.intellivault.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: intellivault-tls
      hosts:
        - api.intellivault.example.com
        - app.intellivault.example.com
```

### Environment-Specific Values

#### Development Values
```yaml
# values-dev.yaml
backend:
  replicaCount: 1
  resources:
    limits:
      cpu: 250m
      memory: 512Mi
    requests:
      cpu: 100m
      memory: 256Mi

frontend:
  replicaCount: 1
  resources:
    limits:
      cpu: 100m
      memory: 128Mi
    requests:
      cpu: 50m
      memory: 64Mi

workers:
  replicaCount: 1
  resources:
    limits:
      cpu: 500m
      memory: 1Gi
    requests:
      cpu: 250m
      memory: 512Mi

ingress:
  hosts:
    - host: dev-api.intellivault.example.com
      paths:
        - path: /
          pathType: Prefix
    - host: dev-app.intellivault.example.com
      paths:
        - path: /
          pathType: Prefix
```

#### Production Values
```yaml
# values-prod.yaml
backend:
  replicaCount: 10
  resources:
    limits:
      cpu: 1000m
      memory: 2Gi
    requests:
      cpu: 500m
      memory: 1Gi

frontend:
  replicaCount: 5
  resources:
    limits:
      cpu: 500m
      memory: 512Mi
    requests:
      cpu: 250m
      memory: 256Mi

workers:
  replicaCount: 8
  resources:
    limits:
      cpu: 2000m
      memory: 4Gi
    requests:
      cpu: 1000m
      memory: 2Gi

ingress:
  annotations:
    nginx.ingress.kubernetes.io/rate-limit: "1000"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
    nginx.ingress.kubernetes.io/client-max-body-size: "100m"
```

## CI/CD Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy IntelliVault

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  AZURE_CONTAINER_REGISTRY: intellivault.azurecr.io
  CONTAINER_NAME_BACKEND: backend
  CONTAINER_NAME_FRONTEND: frontend
  CONTAINER_NAME_WORKER: worker

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: |
        cd backend && npm ci
        cd ../frontend && npm ci
    
    - name: Run tests
      run: |
        cd backend && npm test
        cd ../frontend && npm test
    
    - name: Run linting
      run: |
        cd backend && npm run lint
        cd ../frontend && npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Login to Azure
      uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}
    
    - name: Login to ACR
      run: az acr login --name ${{ env.AZURE_CONTAINER_REGISTRY }}
    
    - name: Build and push backend
      run: |
        cd backend
        docker build -t ${{ env.AZURE_CONTAINER_REGISTRY }}/${{ env.CONTAINER_NAME_BACKEND }}:${{ github.sha }} .
        docker push ${{ env.AZURE_CONTAINER_REGISTRY }}/${{ env.CONTAINER_NAME_BACKEND }}:${{ github.sha }}
    
    - name: Build and push frontend
      run: |
        cd frontend
        docker build -t ${{ env.AZURE_CONTAINER_REGISTRY }}/${{ env.CONTAINER_NAME_FRONTEND }}:${{ github.sha }} .
        docker push ${{ env.AZURE_CONTAINER_REGISTRY }}/${{ env.CONTAINER_NAME_FRONTEND }}:${{ github.sha }}
    
    - name: Build and push worker
      run: |
        cd backend
        docker build -f Dockerfile.worker -t ${{ env.AZURE_CONTAINER_REGISTRY }}/${{ env.CONTAINER_NAME_WORKER }}:${{ github.sha }} .
        docker push ${{ env.AZURE_CONTAINER_REGISTRY }}/${{ env.CONTAINER_NAME_WORKER }}:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Login to Azure
      uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}
    
    - name: Get AKS credentials
      run: |
        az aks get-credentials --resource-group intellivault-rg --name intellivault-aks
    
    - name: Deploy to staging
      if: github.ref == 'refs/heads/develop'
      run: |
        helm upgrade --install intellivault-staging ./deploy/helm/intellivault \
          --namespace intellivault-staging \
          --create-namespace \
          --values ./deploy/helm/intellivault/values-staging.yaml \
          --set image.tag=${{ github.sha }}
    
    - name: Deploy to production
      if: github.ref == 'refs/heads/main'
      run: |
        helm upgrade --install intellivault-prod ./deploy/helm/intellivault \
          --namespace intellivault-prod \
          --create-namespace \
          --values ./deploy/helm/intellivault/values-prod.yaml \
          --set image.tag=${{ github.sha }}
```

## Service Configuration

### ConfigMaps
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: intellivault-config
  namespace: intellivault-prod
data:
  AZURE_COSMOS_DB_ENDPOINT: "https://intellivault-cosmos.documents.azure.com:443/"
  AZURE_STORAGE_ACCOUNT_NAME: "intellivaultstorage"
  AZURE_SEARCH_ENDPOINT: "https://intellivault-search.search.windows.net"
  AZURE_OPENAI_ENDPOINT: "https://intellivault-openai.openai.azure.com/"
  REDIS_URL: "redis://intellivault-redis:6379"
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  MAX_FILE_SIZE: "104857600"
  ALLOWED_MIME_TYPES: "application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
```

### Secrets
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: intellivault-secrets
  namespace: intellivault-prod
type: Opaque
data:
  AZURE_COSMOS_DB_KEY: <base64-encoded-key>
  AZURE_STORAGE_ACCOUNT_KEY: <base64-encoded-key>
  AZURE_SEARCH_API_KEY: <base64-encoded-key>
  AZURE_OPENAI_API_KEY: <base64-encoded-key>
  JWT_SECRET: <base64-encoded-secret>
  REDIS_PASSWORD: <base64-encoded-password>
```

## Auto-scaling Configuration

### Horizontal Pod Autoscaler
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: intellivault-backend-hpa
  namespace: intellivault-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: intellivault-backend
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: queue_depth
      target:
        type: AverageValue
        averageValue: "5"
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
```

### Cluster Autoscaler
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cluster-autoscaler
  namespace: kube-system
spec:
  template:
    spec:
      containers:
      - name: cluster-autoscaler
        image: k8s.gcr.io/autoscaling/cluster-autoscaler:v1.28.0
        command:
        - ./cluster-autoscaler
        - --v=4
        - --stderrthreshold=info
        - --cloud-provider=azure
        - --skip-nodes-with-local-storage=false
        - --expander=least-waste
        - --node-group-auto-discovery=mig:name=intellivault-node-pool
        - --balance-similar-node-groups
        - --scale-down-enabled=true
        - --scale-down-delay-after-add=10m
        - --scale-down-unneeded-time=10m
```

## Monitoring & Observability

### Prometheus Configuration
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
    scrape_configs:
    - job_name: 'intellivault-backend'
      static_configs:
      - targets: ['intellivault-backend:3000']
      metrics_path: '/metrics'
    - job_name: 'intellivault-workers'
      static_configs:
      - targets: ['intellivault-workers:3001']
      metrics_path: '/metrics'
```

### Grafana Dashboard
```json
{
  "dashboard": {
    "title": "IntelliVault Monitoring",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{instance}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      }
    ]
  }
}
```

## Backup & Recovery

### Backup Strategy
```yaml
# Backup CronJob
apiVersion: batch/v1
kind: CronJob
metadata:
  name: intellivault-backup
  namespace: intellivault-prod
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: mcr.microsoft.com/azure-cli:latest
            command:
            - /bin/bash
            - -c
            - |
              # Backup Cosmos DB
              az cosmosdb sql database backup \
                --resource-group intellivault-rg \
                --account-name intellivault-cosmos \
                --database-name intellivault
              
              # Backup Blob Storage
              az storage blob copy start \
                --source-container documents \
                --destination-container backup-$(date +%Y%m%d) \
                --account-name intellivaultstorage
            env:
            - name: AZURE_CLIENT_ID
              valueFrom:
                secretKeyRef:
                  name: azure-credentials
                  key: clientId
            - name: AZURE_CLIENT_SECRET
              valueFrom:
                secretKeyRef:
                  name: azure-credentials
                  key: clientSecret
            - name: AZURE_TENANT_ID
              valueFrom:
                secretKeyRef:
                  name: azure-credentials
                  key: tenantId
          restartPolicy: OnFailure
```

## Security Configuration

### Network Policies
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: intellivault-network-policy
  namespace: intellivault-prod
spec:
  podSelector:
    matchLabels:
      app: intellivault-backend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: intellivault-prod
    ports:
    - protocol: TCP
      port: 6379  # Redis
  - to: []
    ports:
    - protocol: TCP
      port: 443   # HTTPS
      port: 53    # DNS
```

### Pod Security Policy
```yaml
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: intellivault-psp
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  volumes:
    - 'configMap'
    - 'emptyDir'
    - 'projected'
    - 'secret'
    - 'downwardAPI'
    - 'persistentVolumeClaim'
  runAsUser:
    rule: 'MustRunAsNonRoot'
  seLinux:
    rule: 'RunAsAny'
  fsGroup:
    rule: 'RunAsAny'
```

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Next Review**: March 2025
