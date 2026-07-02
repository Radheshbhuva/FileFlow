# FileFlow Domain Events Reference

The system uses a unified domain event scheme on the central `eventBus` to coordinate observers like the `ActivityListener`.

---

## Event Schema Map

| Event Name | Mapped Activity Type | Description | Payload Structure |
|---|---|---|---|
| `user.registered` | `REGISTER` | User registers an account | `{ userId: string, email: string }` |
| `user.logged_in` | `LOGIN` | User completes login checks | `{ userId: string, email: string }` |
| `user.logged_out` | `LOGOUT` | User signs out | `{ userId: string }` |
| `user.profile_updated` | `PROFILE_UPDATED` | Profile parameters updated | `{ userId: string }` |
| `user.password_changed` | `PASSWORD_CHANGED` | Password hash changed | `{ userId: string }` |
| `file.created` | `FILE_UPLOADED` | File metadata created | `{ userId: string, fileId: string, fileName: string }` |
| `file.updated` | `FILE_UPDATED` | File metadata updated | `{ userId: string, fileId: string, fileName: string }` |
| `file.deleted` | `FILE_DELETED` | File soft deleted | `{ userId: string, fileId: string, fileName: string }` |
| `file.favorited` | `FILE_FAVORITED` | File added to favorites | `{ userId: string, fileId: string, fileName: string }` |
| `file.unfavorited` | `FILE_UNFAVORITED` | File removed from favorites | `{ userId: string, fileId: string, fileName: string }` |
| `file.archived` | `FILE_ARCHIVED` | File archived or restored | `{ userId: string, fileId: string, fileName: string, archive: boolean }` |
| `uploadStarted` | `UPLOAD_STARTED` | Ingestion stream initialized | `{ userId: string, uploadId: string }` |
| `uploadCompleted` | `UPLOAD_COMPLETED` | Ingestion stream success | `{ userId: string, uploadId: string }` |
| `uploadFailed` | `UPLOAD_FAILED` | Ingestion stream fail | `{ userId: string, uploadId: string, error: string }` |
| `shareCreated` | `SHARE_CREATED` | Secure link generated | `{ ownerId: string, shareId: string, fileId: string }` |
| `shareRevoked` | `SHARE_REVOKED` | Sharing access revoked | `{ ownerId: string, shareId: string, fileId: string }` |
| `shareDownloaded` | `SHARE_DOWNLOADED` | Shared file downloaded | `{ shareId: string, fileId: string }` *(userId is optional)* |

---

## Event Handlers (Activity Listener)

An observer instantiates subscriptions on start:

```typescript
import { eventBus } from '../../../shared/event-bus';

eventBus.on('user.password_changed', async (data) => {
  await activityService.createActivity({
    userId: data.userId,
    activityType: 'PASSWORD_CHANGED',
    description: 'User password changed successfully',
    severity: 'CRITICAL',
    resourceType: 'USER',
    resourceId: data.userId
  });
});
```
This architecture facilitates expanding logic later (e.g., triggering email alerts or real-time admin WebSocket notifications) by simply registering a new listener block.
