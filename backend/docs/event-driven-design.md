# Event-Driven Design & Real-Time Event Mapping

This document specifies the exact mapping between FileFlow's local domain events and the corresponding real-time events published across the WebSocket and SSE transports.

---

## 1. Domain Event Sources & Mapping Rules

The `RealtimeListener` bridge acts as the central router translating localized process actions (emitted via `EventEmitter` modules) into serialized `RealtimeEvent` entities.

| Local Event Trigger | Source Emitter | Published EventType | Target Channel | Payload Fields |
|---|---|---|---|---|
| `uploadCompleted` | `uploadEventEmitter` | `FILE_UPLOADED` | `workspace:<wsId>` | `{ fileId, uploadId }` |
| `shareCreated` | `shareEventEmitter` | `FILE_SHARED` | `workspace:<wsId>` | `{ shareId, fileId }` |
| `shareRevoked` | `shareEventEmitter` | `SHARE_REVOKED` | `workspace:<wsId>` | `{ shareId, fileId }` |
| `shareDownloaded` | `shareEventEmitter` | `FILE_DOWNLOADED` | `workspace:<wsId>` | `{ shareId, fileId }` |
| `file.created` | `eventBus` | `FILE_UPLOADED` | `workspace:<wsId>` | `{ fileId, fileName }` |
| `file.updated` | `eventBus` | `FILE_UPDATED` | `workspace:<wsId>` | `{ fileId, fileName, updates }` |
| `file.deleted` | `eventBus` | `FILE_DELETED` | `workspace:<wsId>` | `{ fileId, fileName }` |
| `file.favorited` | `eventBus` | `FILE_UPDATED` | `workspace:<wsId>` | `{ fileId, fileName, favorite: true }` |
| `file.unfavorited` | `eventBus` | `FILE_UPDATED` | `workspace:<wsId>` | `{ fileId, fileName, favorite: false }` |
| `user.profile_updated` | `eventBus` | `WORKSPACE_UPDATED` | `workspace:<wsId>` | `{ userId }` |
| `notification.created` | `NotificationService` | `NOTIFICATION_CREATED` | `user:<userId>` | `{ id, title, severity, status }` |
| `activity.created` | `ActivityService` | `ACTIVITY_CREATED` | `workspace:<wsId>` | `{ id, activityType, description }` |

---

## 2. Automated Dashboard Updates Engine

To keep client dashboards automatically synchronized with the backend storage and security metrics, the Event Bus interceptor triggers a secondary event broadcast upon receiving specific actions.

When any of the following events are successfully published:
- `FILE_UPLOADED`
- `FILE_SHARED`
- `NOTIFICATION_CREATED`
- `ACTIVITY_CREATED`

The Event Bus service publishes a **`DASHBOARD_UPDATED`** event frame to the client's workspace channel automatically. The client-side dashboard receives this event and invalidates cached data (e.g. invalidating React Query states), triggering smooth updates for total usage metrics, security ratings, and feed lists.
