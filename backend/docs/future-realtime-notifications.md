# Real-Time & Email Notifications Delivery Roadmap

This document outlines the interfaces, queue integrations, and delivery provider structures prepared in FileFlow V1 to support future WebSockets, push notifications, and email delivery.

---

## 1. Real-Time WebSocket Channel Specification

To support live, real-time in-app alerts, a WebSocket Gateway will be introduced in the next phase. The `RealTimeChannel` signature is predefined as follows:

```typescript
export interface RealTimeChannel {
  /**
   * Broadcasts a live notification to a specific connected user
   */
  send(userId: string, notification: Notification): Promise<void>;

  /**
   * Broadcasts system-wide notifications to all connected clients
   */
  broadcast(notification: Notification): Promise<void>;

  /**
   * Registers a socket connection mapping
   */
  connect(userId: string, socketId: string): void;

  /**
   * Removes a socket connection mapping
   */
  disconnect(userId: string, socketId: string): void;
}
```

### Integration Checkpoints
1. When a notification is successfully saved via `NotificationService.createNotification()`, the server checks active connections in the WebSocket manager.
2. If the user has an active connection, the server emits a `notification:received` event via Socket.io or native WebSockets containing the notification body.
3. The frontend intercepts the socket message and immediately triggers a toast alert and increments the unread notification badge count in the header.

---

## 2. Push & Email Notifications Engine

### 1. Delivery Preferences (`NotificationPreferences`)
Users can configure their communications preferences in their Account Settings. The data contract supports:
- `emailEnabled`: Deliver security/activity reports to email.
- `pushEnabled`: Deliver real-time push alerts to desktop/mobile devices.
- `inAppEnabled`: Deliver standard in-app notifications.

### 2. Provider Integration
For dispatching emails (e.g. Password Changed Alerts, Storage Quota Exhausted Warnings), delivery engines will implement:

```typescript
export interface EmailDeliveryProvider {
  sendEmail(
    to: string,
    subject: string,
    templateName: string,
    context: Record<string, any>
  ): Promise<{ success: boolean; messageId?: string }>;
}
```

SES (Amazon Simple Email Service) or SendGrid can be injected under this provider layer in the next iteration.
