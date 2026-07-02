# FileFlow Smart Collections API Specification

The Smart Collections Module acts as a dynamic classification layer that automatically categorizes user files based on updates, usage, sharing metadata, security scores, and file sizes.

---

## Endpoint Map

All collection endpoints are prefix-mounted under `/api/v1/collections` and require JWT protection headers.

### 1. GET `/api/v1/collections`
- **Description**: Lists metadata summaries and counts for all primary collections.
- **Envelope**:
  ```json
  {
    "success": true,
    "message": "Smart collections metadata loaded successfully",
    "data": {
      "collections": [
        {
          "id": "recently-modified",
          "name": "Recently Modified",
          "description": "Files updated or modified within the last 7 days",
          "endpoint": "/api/v1/collections/recently-modified",
          "count": 5
        },
        ...
      ]
    }
  }
  ```

### 2. GET `/api/v1/collections/recently-modified`
- **Description**: Returns user files updated within a queryable threshold of days.
- **Queries**:
  - `days` (Optional, integer, default: `7`): The historical window in days.
- **Envelope**:
  ```json
  {
    "success": true,
    "message": "Recently modified files retrieved successfully",
    "data": {
      "files": [...],
      "days": 7
    }
  }
  ```

### 3. GET `/api/v1/collections/shared-recently`
- **Description**: Returns user files shared within a queryable threshold of days, compiling metadata such as total download spikes and share count ratios.
- **Queries**:
  - `days` (Optional, integer, default: `30`): The historical window in days.
- **Envelope**:
  ```json
  {
    "success": true,
    "message": "Recently shared files retrieved successfully",
    "data": {
      "files": [
        {
          "id": "file-123",
          "fileName": "report.pdf",
          "fileSize": 102400,
          "fileType": "pdf",
          "securityScore": 85,
          "shareCount": 2,
          "lastSharedDate": "2026-06-19T10:00:00.000Z",
          "downloadCount": 42,
          "createdAt": "2026-06-19T08:00:00.000Z",
          "updatedAt": "2026-06-19T09:00:00.000Z"
        }
      ],
      "days": 30
    }
  }
  ```

### 4. GET `/api/v1/collections/favorites`
- **Description**: Lists favorited files, providing totals and extracting the user's latest 10 favorite logs.
- **Envelope**:
  ```json
  {
    "success": true,
    "message": "Favorited files retrieved successfully",
    "data": {
      "files": [...],
      "favoriteCount": 12,
      "recentFavoriteActivity": [...]
    }
  }
  ```

### 5. GET `/api/v1/collections/large-files`
- **Description**: Returns files exceeding a configurable size threshold in MB.
- **Queries**:
  - `thresholdMb` (Optional, number, default: `100`): The size threshold in MB.
- **Envelope**:
  ```json
  {
    "success": true,
    "message": "Large files retrieved successfully",
    "data": {
      "files": [
        {
          "id": "file-abc",
          "fileName": "video.mp4",
          "fileSize": 1048576000,
          "fileType": "mp4",
          "securityScore": 90,
          "storageImpact": 20.0,
          "createdAt": "2026-06-19T00:00:00.000Z",
          "updatedAt": "2026-06-19T00:00:00.000Z"
        }
      ],
      "totalLargeFilesCount": 1,
      "totalLargeFilesSize": 1048576000,
      "userStorageUsed": 1048576000,
      "userStorageLimit": 5242880000,
      "thresholdMb": 100
    }
  }
  ```

### 6. GET `/api/v1/collections/needs-attention`
- **Description**: Lists vulnerable and inactive files flagged with reasons, sorted by risk severity (`HIGH` -> `MEDIUM` -> `LOW`).
- **Envelope**:
  ```json
  {
    "success": true,
    "message": "Vulnerable and inactive files requiring attention compiled successfully",
    "data": {
      "files": [
        {
          "file": {
            "id": "file-vulnerable",
            "fileName": "exploit.exe",
            "fileSize": 4194304,
            "fileType": "exe",
            "securityScore": 40,
            "createdAt": "2026-06-19T00:00:00.000Z",
            "updatedAt": "2026-06-19T00:00:00.000Z"
          },
          "reasons": ["LOW_SECURITY_SCORE", "EXECUTABLE_RISK"],
          "riskLevel": "HIGH"
        }
      ]
    }
  }
  ```

### 7. GET `/api/v1/collections/summary`
- **Description**: Gathers aggregate counts, storage footprints, ratio metrics, and indicators.
- **Envelope**:
  ```json
  {
    "success": true,
    "message": "Collections metrics summary retrieved successfully",
    "data": {
      "summary": {
        "collectionCounts": {
          "recentlyModified": 3,
          "sharedRecently": 1,
          "favorites": 5,
          "largeFiles": 1,
          "needsAttention": 2
        },
        "storageConsumption": {
          "recentlyModifiedBytes": 1048576,
          "sharedRecentlyBytes": 2048576,
          "favoritesBytes": 5048576,
          "largeFilesBytes": 1048576000,
          "needsAttentionBytes": 4194304
        },
        "collectionMetrics": {
          "totalFiles": 12,
          "totalStorageUsed": 1058291200,
          "largeFilesRatio": 0.9908,
          "needsAttentionRatio": 0.1667
        },
        "healthIndicators": {
          "averageSecurityScore": 81,
          "unsecuredShareCount": 1,
          "cleanFilesCount": 10
        }
      }
    }
  }
  ```
