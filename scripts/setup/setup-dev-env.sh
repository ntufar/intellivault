#!/bin/bash

# Set up colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Setting up IntelliVault development environment...${NC}"

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js 18 or later.${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed. Please install npm.${NC}"
    exit 1
fi

if ! command -v az &> /dev/null; then
    echo -e "${RED}Azure CLI is not installed. Please install Azure CLI.${NC}"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo -e "${GREEN}Created .env file. Please update with your configuration values.${NC}"
else
    echo -e "${YELLOW}.env file already exists. Skipping...${NC}"
fi

# Install dependencies
echo "Installing project dependencies..."
npm install

# Set up Azure Storage Emulator
echo "Checking Azure Storage Emulator..."
if [ "$(uname)" == "Darwin" ]; then
    # macOS - use Azurite
    if ! command -v azurite &> /dev/null; then
        echo "Installing Azurite (Azure Storage Emulator)..."
        npm install -g azurite
    fi
    
    # Start Azurite in the background
    echo "Starting Azurite..."
    mkdir -p .azurite
    azurite --silent --location .azurite &
    echo -e "${GREEN}Azurite started successfully.${NC}"
elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
    # Linux - use Azurite
    if ! command -v azurite &> /dev/null; then
        echo "Installing Azurite (Azure Storage Emulator)..."
        npm install -g azurite
    fi
    
    # Start Azurite in the background
    echo "Starting Azurite..."
    mkdir -p .azurite
    azurite --silent --location .azurite &
    echo -e "${GREEN}Azurite started successfully.${NC}"
else
    echo -e "${YELLOW}Unsupported operating system. Please install Azure Storage Emulator manually.${NC}"
fi

# Create necessary directories
echo "Creating project directories..."
mkdir -p services/document-service/src
mkdir -p services/search-service/src
mkdir -p services/analytics-service/src

# Add .gitignore entry for Azurite
if ! grep -q ".azurite" .gitignore 2>/dev/null; then
    echo ".azurite" >> .gitignore
    echo "Added .azurite to .gitignore"
fi

echo -e "${GREEN}Development environment setup completed!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Update the .env file with your Azure credentials"
echo "2. Run 'npm run dev' to start the development servers"
echo "3. Visit http://localhost:3000 to access the application"