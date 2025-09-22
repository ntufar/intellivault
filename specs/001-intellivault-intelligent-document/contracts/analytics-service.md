# Analytics Service API Contract

## Get Document Analytics
```http
GET /api/v1/analytics/documents/{id}
Authorization: Bearer {token}

# Query Parameters
startDate: string (ISO date)
endDate: string (ISO date)
metrics: string[] (default: ["views", "downloads", "searches"])

# Response 200 OK
{
  "id": string,
  "metrics": {
    "views": number,
    "downloads": number,
    "searches": number,
    "uniqueUsers": number
  },
  "timeline": [
    {
      "date": string,
      "metrics": {
        "views": number,
        "downloads": number,
        "searches": number
      }
    }
  ],
  "topQueries": [
    {
      "query": string,
      "count": number,
      "avgPosition": number
    }
  ]
}

# Error Responses
401 Unauthorized - Missing or invalid token
403 Forbidden - Insufficient permissions
404 Not Found - Document not found
```

## Get Search Analytics
```http
GET /api/v1/analytics/search
Authorization: Bearer {token}

# Query Parameters
startDate: string (ISO date)
endDate: string (ISO date)
groupBy: "query" | "user" | "document" | "date"

# Response 200 OK
{
  "summary": {
    "totalQueries": number,
    "uniqueQueries": number,
    "avgResponseTime": number,
    "successRate": number
  },
  "topQueries": [
    {
      "query": string,
      "count": number,
      "avgResults": number,
      "avgResponseTime": number
    }
  ],
  "distribution": {
    "byHour": [
      {
        "hour": number,
        "count": number
      }
    ],
    "byDay": [
      {
        "date": string,
        "count": number
      }
    ]
  }
}

# Error Responses
401 Unauthorized - Missing or invalid token
403 Forbidden - Insufficient permissions
```

## Get System Metrics
```http
GET /api/v1/analytics/system
Authorization: Bearer {token}

# Query Parameters
metrics: string[] (required)
interval: "1m" | "5m" | "1h" | "1d"
startTime: string (ISO date)
endTime: string (ISO date)

# Response 200 OK
{
  "metrics": [
    {
      "name": string,
      "dataPoints": [
        {
          "timestamp": string,
          "value": number,
          "metadata": object
        }
      ],
      "statistics": {
        "min": number,
        "max": number,
        "avg": number,
        "p95": number,
        "p99": number
      }
    }
  ]
}

# Error Responses
401 Unauthorized - Missing or invalid token
403 Forbidden - Insufficient permissions
422 Unprocessable Entity - Invalid metrics requested
```

## Export Analytics Data
```http
POST /api/v1/analytics/export
Content-Type: application/json
Authorization: Bearer {token}

# Request
{
  "type": "search" | "document" | "system",
  "format": "csv" | "json",
  "filters": {
    "startDate": string,
    "endDate": string,
    "metrics": string[],
    "dimensions": string[]
  }
}

# Response 202 Accepted
{
  "id": string,
  "status": "processing",
  "estimatedSize": number,
  "expiresAt": string
}

# Error Responses
400 Bad Request - Invalid export configuration
401 Unauthorized - Missing or invalid token
403 Forbidden - Insufficient permissions
413 Payload Too Large - Export size exceeds limits
```