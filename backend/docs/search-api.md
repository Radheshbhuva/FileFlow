# Search API Specifications

All endpoints require a valid JWT passed in the `Authorization: Bearer <token>` header and return standardized response envelopes.

## 1. Global Workspace Search
* **Endpoint**: `GET /api/v1/search`
* **Query Parameters**:
  - `query` (string, optional)
  - `page` (number, default: 1)
  - `limit` (number, default: 10)
  - Filters (see Advanced File Search)
* **Response**:
```json
{
  "success": true,
  "message": "Global workspace search completed",
  "data": {
    "files": [ ... ],
    "total": 12,
    "page": 1,
    "limit": 10,
    "collections": [
      {
        "id": "large-files",
        "name": "Large Files",
        "description": "Files consuming a significant portion of storage (>= 100 MB)",
        "endpoint": "/api/v1/collections/large-files",
        "count": 1
      }
    ]
  }
}
```

## 2. Advanced File Search
* **Endpoint**: `GET /api/v1/search/files`
* **Query Parameters**:
  - `query`: Text to search filenames.
  - `fileType`: Filter by file extension (e.g. `pdf`).
  - `startDate` / `endDate`: Date range filter.
  - `minSize` / `maxSize`: File size range filter in bytes.
  - `favorite`: Filter by favorite status (`true` / `false`).
  - `shareStatus`: Filter by share status (`PRIVATE` / `SHARED`).
  - `minSecurityScore` / `maxSecurityScore`: Security score range (0-100).
  - `collectionType`: Search within smart collection (`recently-modified`, `shared-recently`, `favorites`, `large-files`, `needs-attention`).
  - `sortBy`: Sorting field (`relevance`, `recently_modified`, `recently_uploaded`, `file_size`, `most_shared`, `most_downloaded`, `alphabetical`).
  - `sortOrder`: `'asc' | 'desc'`.
  - `page` / `limit`: Pagination parameters.
* **Response**:
```json
{
  "success": true,
  "message": "Files searched successfully",
  "data": {
    "files": [ ... ],
    "total": 5,
    "page": 1,
    "limit": 10
  }
}
```

## 3. Suggestions
* **Endpoint**: `GET /api/v1/search/suggestions`
* **Query Parameters**:
  - `query` (string, optional)
* **Response**:
```json
{
  "success": true,
  "message": "Search suggestions retrieved successfully",
  "data": {
    "recentSearches": ["pdf", "report"],
    "popularSearches": [
      { "query": "document", "frequency": 4 }
    ],
    "suggestedFiles": [ ... ],
    "suggestedCollections": [ ... ]
  }
}
```

## 4. Recent Searches
* **Endpoint**: `GET /api/v1/search/recent`
* **Response**:
```json
{
  "success": true,
  "message": "Recent searches retrieved successfully",
  "data": {
    "recent": ["pdf", "report", "document"]
  }
}
```

## 5. Discovery Command Center Feed
* **Endpoint**: `GET /api/v1/search/discover`
* **Response**:
```json
{
  "success": true,
  "message": "Discovery workspace feed retrieved successfully",
  "data": {
    "recentlyModified": [ ... ],
    "frequentlyAccessed": [ ... ],
    "recentlyShared": [ ... ],
    "favorites": [ ... ],
    "largeFiles": [ ... ],
    "needsAttention": [ ... ]
  }
}
```

## 6. Trending Files Feed
* **Endpoint**: `GET /api/v1/search/trending`
* **Response**:
```json
{
  "success": true,
  "message": "Trending files retrieved successfully",
  "data": {
    "mostAccessed": [ ... ],
    "mostShared": [ ... ],
    "mostDownloaded": [ ... ],
    "mostFavorited": [ ... ]
  }
}
```
