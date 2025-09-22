#!/bin/bash

# Script to deploy services to AKS
# Usage: ./deploy-to-aks.sh [environment]

set -e

ENVIRONMENT=${1:-production}
NAMESPACE="intellivault"
SERVICES=("document-service" "search-service" "analytics-service")

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "kubectl is not installed"
    exit 1
fi

# Check if connected to the right cluster
CLUSTER_INFO=$(kubectl config current-context)
echo "Connected to cluster: $CLUSTER_INFO"

# Create namespace if it doesn't exist
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Apply ConfigMaps for the environment
kubectl apply -f "config/$ENVIRONMENT/configmap.yaml" -n $NAMESPACE

# Apply secrets (should be managed by Azure Key Vault)
kubectl apply -f "config/$ENVIRONMENT/secrets.yaml" -n $NAMESPACE

# Deploy each service
for service in "${SERVICES[@]}"; do
    echo "Deploying $service..."
    kubectl apply -f "$service.yaml" -n $NAMESPACE
    
    # Wait for deployment to complete
    kubectl rollout status deployment/$service -n $NAMESPACE
done

echo "All services deployed successfully!"