# FileFlow Download Tracking & Analytics Spec

FileFlow logs and tracks download events to provide users and workspace administrators with comprehensive audit records.

---

## 1. Tracking Parameters

When a download is processed via `POST /public/:token/download`, the controller extracts and records client request details:

```typescript
const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
const userAgent = req.headers['user-agent'];
```

The service processes this information and emits the `shareDownloaded` event:

```json
{
  "shareId": "share-uuid",
  "fileId": "file-uuid",
  "downloadedAt": "2026-06-19T20:25:00.000Z",
  "clientIp": "192.168.1.1",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit..."
}
```

---

## 2. Infrastructure Extensions

1. **Geolocation Mapping**:
   - Geolocation (country, city, ISP) can be extracted from the `clientIp` using MaxMind GeoIP or an external geolocation API in future sprints.
   
2. **Device Detection**:
   - The `userAgent` string is mapped to detect whether the downloader accessed the file via:
     - **Desktop** (Mac, Windows, Linux, Chrome OS)
     - **Mobile** (iOS, Android)
     - **API/Script Client** (curl, wget, python-requests)

3. **Audit and Compliance Trails**:
   - Download events are designed to write logs directly to a central audit trail database (e.g. AWS CloudWatch Logs or Elasticsearch), aiding enterprise security reviews and threat pattern detection (e.g. bulk downloads from unauthorized IPs).
