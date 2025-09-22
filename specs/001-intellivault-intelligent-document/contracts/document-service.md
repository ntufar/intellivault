# Document Service API Contract

## Upload Document
```http
POST /api/v1/documents
Content-Type: multipart/form-data
Authorization: Bearer {token}

# Request
- file: File (required)
- metadata: JSON object (optional)
  {
    "title": string,
    "author": string[],
    "keywords": string[],
    "classification": string,
    "confidentiality": string
  }

# Response 201 Created
{
  "id": string,
  "status": "processing",
  "uploadUrl": string,
  "metadata": {
    "title": string,
    "size": number,
    "contentType": string,
    "uploadedAt": string
  }
}

# Error Responses
400 Bad Request - Invalid request format
401 Unauthorized - Missing or invalid token
413 Payload Too Large - File size exceeds limit
415 Unsupported Media Type - File format not supported
```

## Get Document Status
```http
GET /api/v1/documents/{id}/status
Authorization: Bearer {token}

# Response 200 OK
{
  "id": string,
  "status": "processing" | "completed" | "failed",
  "progress": number,
  "stage": string,
  "error": string?,
  "lastUpdated": string
}

# Error Responses
401 Unauthorized - Missing or invalid token
403 Forbidden - Insufficient permissions
404 Not Found - Document not found
```

## Get Document Content
```http
GET /api/v1/documents/{id}
Authorization: Bearer {token}

# Response 200 OK
{
  "id": string,
  "content": {
    "text": string,
    "entities": [
      {
        "text": string,
        "type": string,
        "confidence": number,
        "offset": number
      }
    ],
    "summary": string,
    "topics": string[],
    "sentiment": number
  },
  "metadata": {
    "title": string,
    "author": string[],
    "createdDate": string,
    "modifiedDate": string,
    "contentType": string,
    "size": number,
    "language": string,
    "classification": string,
    "confidentiality": string
  },
  "vectors": {
    "model": string,
    "version": string,
    "dimensions": number
  }
}

# Error Responses
401 Unauthorized - Missing or invalid token
403 Forbidden - Insufficient permissions
404 Not Found - Document not found
```

## Update Document Metadata
```http
PATCH /api/v1/documents/{id}/metadata
Content-Type: application/json
Authorization: Bearer {token}

# Request
{
  "title": string?,
  "author": string[]?,
  "keywords": string[]?,
  "classification": string?,
  "confidentiality": string?
}

# Response 200 OK
{
  "id": string,
  "metadata": {
    "title": string,
    "author": string[],
    "keywords": string[],
    "classification": string,
    "confidentiality": string,
    "updatedAt": string
  }
}

# Error Responses
400 Bad Request - Invalid metadata format
401 Unauthorized - Missing or invalid token
403 Forbidden - Insufficient permissions
404 Not Found - Document not found
```

## Delete Document
```http
DELETE /api/v1/documents/{id}
Authorization: Bearer {token}

# Response 204 No Content

# Error Responses
401 Unauthorized - Missing or invalid token
403 Forbidden - Insufficient permissions
404 Not Found - Document not found
409 Conflict - Document in use
```