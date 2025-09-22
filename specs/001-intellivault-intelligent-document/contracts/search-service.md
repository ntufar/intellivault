# Search Service API Contract

## Semantic Search
```http
POST /api/v1/search
Content-Type: application/json
Authorization: Bearer {token}

# Request
{
  "query": string,
  "filters": [
    {
      "field": string,
      "operator": "eq" | "ne" | "gt" | "lt" | "in" | "between",
      "value": any
    }
  ],
  "facets": string[],
  "sort": [
    {
      "field": string,
      "order": "asc" | "desc"
    }
  ],
  "page": number,
  "pageSize": number,
  "searchType": "semantic" | "keyword" | "hybrid",
  "minScore": number?
}

# Response 200 OK
{
  "results": [
    {
      "id": string,
      "score": number,
      "document": {
        "title": string,
        "summary": string,
        "metadata": object
      },
      "highlights": [
        {
          "field": string,
          "fragments": string[]
        }
      ],
      "vectors": {
        "similarity": number,
        "model": string
      }
    }
  ],
  "facets": [
    {
      "field": string,
      "values": [
        {
          "value": string,
          "count": number
        }
      ]
    }
  ],
  "total": number,
  "page": number,
  "pageSize": number,
  "timing": {
    "total": number,
    "search": number,
    "rank": number
  }
}

# Error Responses
400 Bad Request - Invalid query format
401 Unauthorized - Missing or invalid token
422 Unprocessable Entity - Invalid search parameters
429 Too Many Requests - Rate limit exceeded
```

## Similar Documents
```http
GET /api/v1/documents/{id}/similar
Authorization: Bearer {token}

# Query Parameters
limit: number (default: 10)
minScore: number (default: 0.7)
includeContent: boolean (default: false)

# Response 200 OK
{
  "results": [
    {
      "id": string,
      "similarity": number,
      "document": {
        "title": string,
        "summary": string,
        "metadata": object
      }
    }
  ],
  "timing": {
    "total": number
  }
}

# Error Responses
401 Unauthorized - Missing or invalid token
404 Not Found - Document not found
```

## Suggest Queries
```http
GET /api/v1/search/suggest
Authorization: Bearer {token}

# Query Parameters
q: string (required)
limit: number (default: 5)

# Response 200 OK
{
  "suggestions": [
    {
      "text": string,
      "score": number,
      "highlightedText": string
    }
  ]
}

# Error Responses
400 Bad Request - Missing or invalid query
401 Unauthorized - Missing or invalid token
429 Too Many Requests - Rate limit exceeded
```

## Search Analytics
```http
POST /api/v1/search/analytics
Content-Type: application/json
Authorization: Bearer {token}

# Request
{
  "queryId": string,
  "documentId": string,
  "action": "click" | "view" | "download",
  "position": number?,
  "duration": number?
}

# Response 202 Accepted

# Error Responses
400 Bad Request - Invalid analytics data
401 Unauthorized - Missing or invalid token
404 Not Found - Query or document not found
```