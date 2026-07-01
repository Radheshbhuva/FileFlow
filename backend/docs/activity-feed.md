# FileFlow Activity Feed API Reference

All activity endpoints are mounted under `/api/v1/activity` and require a valid Bearer JWT token in the `Authorization` header.

---

## Endpoint Index

| Method | Path | Description | Access |
|---|---|---|---|
| **GET** | `/` | Retrieve paginated activity feed with filters | Owner Only |
| **GET** | `/recent` | Fetch recent activity feed (default top 10) | Owner Only |
| **GET** | `/summary` | Retrieve aggregated dashboard counts | Owner Only |
| **GET** | `/user/:userId` | Get activity feed of a specific user | Owner/Admin Only |
| **GET** | `/:id` | Get details of a single activity log | Owner Only |

---

## Route Schema Details

### 1. Paginated Activity Feed
Load logs for the authenticated user, supporting rolling filters.

- **URL**: `GET /`
- **Query Parameters**:
  - `page`: default `1` (positive integer)
  - `limit`: default `10` (max `100`)
  - `activityType`: filter by exact event enum (e.g. `FILE_UPLOADED`)
  - `severity`: filter by `INFO`, `WARNING`, or `CRITICAL`
  - `resourceType`: filter by `FILE`, `SHARE`, `USER`, or `UPLOAD`
  - `startDate`: filter logs created after this ISO date (e.g. `2026-06-19T00:00:00.000Z`)
  - `endDate`: filter logs created before this ISO date
  - `search`: search query matches case-insensitively against `description` and `resourceName`

- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Activity feed loaded successfully",
    "data": {
      "activities": [
        {
          "id": "activity-uuid-1",
          "userId": "user-uuid-123",
          "activityType": "FILE_UPLOADED",
          "resourceType": "FILE",
          "resourceId": "file-uuid-abc",
          "resourceName": "quarterly-report.xlsx",
          "description": "File created: quarterly-report.xlsx",
          "severity": "INFO",
          "createdAt": "2026-06-19T20:30:00.000Z"
        }
      ],
      "total": 1,
      "page": 1,
      "limit": 10
    }
  }
  ```

---

### 2. Activity Metrics Summary
Load rolling aggregate numbers for the user's dashboard widgets.

- **URL**: `GET /summary`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Activity metrics summary retrieved successfully",
    "data": {
      "summary": {
        "totalActivities": 140,
        "uploads": 80,
        "shares": 35,
        "downloads": 220,
        "profileChanges": 3,
        "recentActivityCount": 18
      }
    }
  }
  ```
