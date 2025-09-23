# Quickstart: IntelliVault Feature Validation

## Prerequisites
- Docker + docker-compose
- Azure subscription with Azure OpenAI, AI Search, Cosmos DB, Blob Storage provisioned (or emulator/local fallbacks)

## Steps
1. Start services
   - `./iv cli up` (CLI-first wrapper; outputs JSON status; deploys containers; config points to Azure services)
   Example output:
   ```json
   { "services": ["api", "workers"], "status": "ok" }
   ```
2. Upload documents
   - `./iv cli upload --path ./samples --tenant t1 --format json`
   Example output:
   ```json
   { "uploaded": [ { "id": "doc_123", "filename": "sample.txt", "path": "./samples" } ] }
   ```
3. Semantic search
   - `./iv cli search --q "contracts with termination clauses" --k 10 --tenant t1 --format json` (uses Azure AI Search index)
   Example output:
   ```json
   {
     "results": [
       { "documentId": "doc_123", "chunkIndex": 0, "score": 0.87, "highlight": "... termination clause ..." }
     ]
   }
   ```
4. Summarize a document
   - `./iv cli summarize --doc-id <id> --format json`
   Example output:
   ```json
   { "summary": "This document outlines key terms including payment and termination provisions." }
   ```
5. Q&A with citations
   - `./iv cli ask --q "What are the payment terms?" --tenant t1 --format json --with-sources`
   Example output:
   ```json
   {
     "answer": "Payment is net 30 days.",
     "sources": [ { "documentId": "doc_123", "chunkIndex": 3, "score": 0.82, "highlight": "Payment terms are net 30 days" } ]
   }
   ```
6. Knowledge graph explore
   - `./iv cli graph --entity "Acme Corp" --format json`
   Example output:
   ```json
   {
     "nodes": [ { "id": "n1", "label": "Acme Corp", "type": "entity" } ],
     "edges": []
   }
   ```

## Expected Results
- Search returns top-k results with highlights and source ids
- Summaries include key points and entities
- Q&A responses include citations
- Graph exploration returns connected nodes and relations

