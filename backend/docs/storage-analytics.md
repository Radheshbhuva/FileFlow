# Storage Analytics and Activity Metrics

This document details the calculations, formats, and structures of storage utilization metrics and the dashboard activity summaries.

---

## 1. Storage Analytics Calculation (`GET /api/v1/users/storage`)

Returns calculated parameters of user storage capacities. Used for drawing storage bars and warnings on the user dashboard.

### Calculated Outputs
- **`storageUsed`**: Raw bytes stored (e.g. `2147483648` for 2 GB).
- **`storageLimit`**: Raw maximum bytes capacity limit (defaults to 5 GB for free accounts).
- **`usagePercentage`**: Current consumption ratio calculation, formatted as a float rounded to 2 decimal places:
  $$\text{usagePercentage} = \text{round}\left( \frac{\text{storageUsed}}{\text{storageLimit}} \times 100, \, 2 \right)$$
- **`remainingStorage`**: Bytes capacity available before hitting quota bounds:
  $$\text{remainingStorage} = \max\left(0, \, \text{storageLimit} - \text{storageUsed}\right)$$

### JSON Output Schema
```json
{
  "success": true,
  "message": "Storage analytics retrieved successfully",
  "data": {
    "storage": {
      "storageUsed": 2147483648,
      "storageLimit": 5368709120,
      "usagePercentage": 40.00,
      "remainingStorage": 3221225472
    }
  }
}
```

---

## 2. Activity Dashboard Summaries (`GET /api/v1/users/activity-summary`)

Exposes metrics aggregating files, favorites, and recent activities.

### Fields
- **`filesUploaded`**: The total count of files uploaded by this account.
- **`filesShared`**: The count of file elements that have active shared links.
- **`favoritesCount`**: The number of folders or files tagged as "favorites" for quick access.
- **`recentActivityCount`**: The count of log/audit events recorded in the last 7 days.

### JSON Output Schema
```json
{
  "success": true,
  "message": "Activity summary retrieved successfully",
  "data": {
    "summary": {
      "filesUploaded": 14,
      "filesShared": 3,
      "favoritesCount": 5,
      "recentActivityCount": 18
    }
  }
}
```
