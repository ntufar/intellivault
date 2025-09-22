# Quickstart: IntelliVault Feature Validation

## Prerequisites
- Docker + docker-compose
- Azure subscription with Azure OpenAI, AI Search, Cosmos DB, Blob Storage provisioned (or emulator/local fallbacks)

## Steps
1. Start services
   - `./iv cli up` (CLI-first wrapper; outputs JSON status; deploys containers; config points to Azure services)
2. Upload documents
   - `./iv cli upload --path ./samples --tenant t1 --format json`
3. Semantic search
   - `./iv cli search --q "contracts with termination clauses" --k 10 --tenant t1 --format json` (uses Azure AI Search index)
4. Summarize a document
   - `./iv cli summarize --doc-id <id> --format json`
5. Q&A with citations
   - `./iv cli ask --q "What are the payment terms?" --tenant t1 --format json --with-sources`
6. Knowledge graph explore
   - `./iv cli graph --entity "Acme Corp" --format json`

## Expected Results
- Search returns top-k results with highlights and source ids
- Summaries include key points and entities
- Q&A responses include citations
- Graph exploration returns connected nodes and relations

