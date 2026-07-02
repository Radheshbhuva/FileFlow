# FileFlow Automatic Notification Trigger Specifications

This document catalogs the event listener configurations that map domain triggers to user-facing notifications.

---

## 1. Notification Event Mapping

| Domain Event | Notification Type | Severity | Trigger Details |
|---|---|---|---|
| `file.created` | `FILE_UPLOADED` | `SUCCESS` | Generated immediately upon successful upload completion. |
| `file.created` (Vulnerability Check) | `SECURITY_ALERT` | `WARNING` or `CRITICAL` | Triggered if the file's security rating is $< 70$ (WARNING) or $< 50$ (CRITICAL). |
| `shareCreated` | `FILE_SHARED` | `INFO` | Triggered upon secure sharing link generation. |
| `shareCreated` (Unsecured link check) | `SECURITY_ALERT` | `WARNING` | Triggered if link has `passwordProtected === false` and no expiry date set. |
| `shareDownloaded` | `FILE_DOWNLOADED` | `INFO` | Notifies the owner when a recipient downloads their file. |
| `shareUpdated` (Expiration Check) | `SHARE_EXPIRED` | `WARNING` | Generated when a recipient accesses an expired link or the system flags expiration. |
| `shareRevoked` | `SHARE_REVOKED` | `WARNING` | Triggered when the owner revokes sharing privileges. |
| `user.password_changed` | `PASSWORD_CHANGED` | `CRITICAL` | High-priority security warning notifying the user of profile credential change. |
| `user.profile_updated` | `PROFILE_UPDATED` | `INFO` | Triggered upon user profile configuration adjustments. |

---

## 2. Storage Warning Thresholds
Whenever files are uploaded (`file.created`) or deleted (`file.deleted`), the listener calculates the user's storage quota consumption ratio.

- **Trigger Conditions**:
  - **Storage Full (100% capacity)**:
    - Type: `STORAGE_WARNING`
    - Severity: `CRITICAL`
    - Message: `"Your storage capacity has reached 100%..."`
  - **Storage Critical (>= 90% capacity)**:
    - Type: `STORAGE_WARNING`
    - Severity: `CRITICAL`
    - Message: `"Your storage capacity has reached X%..."`
  - **Storage Warning (>= 80% capacity)**:
    - Type: `STORAGE_WARNING`
    - Severity: `WARNING`
    - Message: `"Your storage capacity is at X%..."`

### Anti-Spam Throttling Logic
To avoid generating duplicate alerts, the listener will **skip** creating new storage warnings if the user already has an active, **unread** storage warning notification in their feed.
