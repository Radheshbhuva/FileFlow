# FileFlow Enterprise Notification Module Specification

The Notification Module serves as the platform-wide awareness and communication layer, dynamically generating alerts for security reviews, storage warnings, uploads, and collaborative sharing actions.

---

## 1. Notification Entity Schema

All notification records follow this JSON model:

```json
{
  "id": "e30b42f1-c0a9-4753-a05e-ebac9444cf7f",
  "userId": "user-123",
  "notificationType": "FILE_UPLOADED",
  "title": "File Uploaded",
  "message": "File \"presentation.key\" has been uploaded successfully.",
  "severity": "SUCCESS",
  "status": "UNREAD",
  "metadata": { "fileId": "file-123" },
  "createdAt": "2026-06-19T20:39:37Z",
  "readAt": null
}
```

---

## 2. API Endpoint Specification

### 1. GET `/api/v1/notifications`
- **Description**: Returns all notifications for the authenticated user, supporting optional filters.
- **Queries**:
  - `status` (Optional, `'UNREAD' | 'READ' | 'ARCHIVED'`)
  - `severity` (Optional, `'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL'`)
- **Envelope**:
  ```json
  {
    "success": true,
    "message": "Notifications retrieved successfully",
    "data": { "notifications": [...] }
  }
  ```

### 2. GET `/api/v1/notifications/unread`
- **Description**: Helper endpoint returning only unread notifications (`status === 'UNREAD'`).
- **Envelope**:
  ```json
  {
    "success": true,
    "message": "Unread notifications retrieved successfully",
    "data": { "notifications": [...] }
  }
  ```

### 3. GET `/api/v1/notifications/:id`
- **Description**: Returns details of a specific notification, verifying user ownership.
- **Envelope**:
  ```json
  {
    "success": true,
    "message": "Notification details loaded successfully",
    "data": { "notification": {...} }
  }
  ```

### 4. PATCH `/api/v1/notifications/:id/read`
- **Description**: Marks a specific unread notification as read, updating `readAt` and `status` to `READ`.
- **Envelope**:
  ```json
  {
    "success": true,
    "message": "Notification marked as read successfully",
    "data": { "notification": {...} }
  }
  ```

### 5. PATCH `/api/v1/notifications/read-all`
- **Description**: Bulk updates all unread notifications of the user to `READ`.
- **Envelope**:
  ```json
  {
    "success": true,
    "message": "All notifications marked as read successfully",
    "data": { "count": 5 }
  }
  ```

### 6. PATCH `/api/v1/notifications/:id/archive`
- **Description**: Updates the notification status to `ARCHIVED`, hiding it from primary unread timelines.
- **Envelope**:
  ```json
  {
    "success": true,
    "message": "Notification archived successfully",
    "data": { "notification": {...} }
  }
  ```

### 7. GET `/api/v1/notifications/summary`
- **Description**: Gathers unread counts, total notifications, critical alerts, and the latest 5 feed items.
- **Envelope**:
  ```json
  {
    "success": true,
    "message": "Notification metrics summary resolved successfully",
    "data": {
      "summary": {
        "totalNotifications": 12,
        "unreadCount": 3,
        "criticalAlertsCount": 1,
        "recentNotifications": [...]
      }
    }
  }
  ```
