# FileFlow Upload Analytics Specification

FileFlow computes comprehensive upload metrics per user to power the administrator and developer dashboards. 

---

## 1. Analytics Schema

The `/api/v1/uploads/analytics` endpoint returns:

```json
{
  "success": true,
  "message": "Upload analytics retrieved successfully",
  "data": {
    "analytics": {
      "totalUploads": 150,
      "successRate": 92.5,
      "failureRate": 4.0,
      "averageUploadSize": 10485760,
      "largestUpload": 1073741824,
      "recentUploadCount": 12
    }
  }
}
```

### Metrics Definitions

1. **Total Uploads (`totalUploads`)**:
   - The total count of all upload transactions initialized by the current user across all history.
   
2. **Success Rate (`successRate`)**:
   - The percentage of upload transactions that have reached the `COMPLETED` state.
   - Formula:
     $$\text{Success Rate} = \frac{\text{Completed Uploads}}{\text{Total Uploads}} \times 100$$
     *(Rounded to 2 decimal places)*

3. **Failure Rate (`failureRate`)**:
   - The percentage of upload transactions that transitioned to the `FAILED` state.
   - Formula:
     $$\text{Failure Rate} = \frac{\text{Failed Uploads}}{\text{Total Uploads}} \times 100$$
     *(Rounded to 2 decimal places)*

4. **Average Upload Size (`averageUploadSize`)**:
   - The average file size in bytes for all uploads initiated by the user.
   - Formula:
     $$\text{Average Upload Size} = \frac{\sum \text{fileSize}}{\text{Total Uploads}}$$
     *(Rounded to the nearest integer)*

5. **Largest Upload (`largestUpload`)**:
   - The maximum size in bytes of a single uploaded file.
   - Formula:
     $$\text{Largest Upload} = \max(\text{fileSize}_i)$$

6. **Recent Upload Count (`recentUploadCount`)**:
   - The number of uploads initialized in the last 7 days.
   - Formula:
     $$\text{Count}(t \ge \text{Now} - 7\text{ days})$$

---

## 2. Real-time Ingestion Graphs

The UI maps these analytics parameters to feed visual dashboards:
- **Upload Ingestion Velocity**: Uses the historical start timestamps to plot ingestion byte throughput over time.
- **Success vs. Failure Ratio**: Visualized using a doughnut chart representing `successRate`, `failureRate`, and remaining active/cancelled states.
