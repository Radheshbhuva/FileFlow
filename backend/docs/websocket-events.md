# WebSocket Real-Time Events Protocol Specification

This document details the handshake handshake protocols, subscription formats, and message shapes utilized in FileFlow's WebSocket integration.

---

## 1. Handshake & Authentication

To connect to the WebSocket server, clients must pass an active authentication JWT token via URL query parameter.

- **Connection URL**:
  `ws://localhost:8085?token=<JWT_ACCESS_TOKEN>`

If the token is missing or invalid, the socket server rejects the connection immediately, closing the socket with close code `4001` or `4002`.

---

## 2. Default Room Actions

Upon successful connection, the server registers the client and automatically joins them to:
1. **User Channel (`user:<userId>`)**: Receives user-specific notifications and security warnings.
2. **Workspace Channel (`workspace:<workspaceId>`)**: Receives events relating to file updates, shares, and activity generated within their primary workspace.

---

## 3. Client Actions Protocol (Messages to Server)

All client actions are sent as JSON text strings.

### A. Subscribe to Workspace Channel
```json
{
  "action": "subscribe",
  "channel": "workspace:workspace-uuid-123"
}
```

### B. Unsubscribe from Channel
```json
{
  "action": "unsubscribe",
  "channel": "workspace:workspace-uuid-123"
}
```

### C. Ping Connection
```json
{
  "action": "ping"
}
```
*Response from Server:*
```json
{ "type": "pong" }
```

---

## 4. Server Broadcast Frames (Messages to Client)

The server sends events to authorized client listeners in the format:

```json
{
  "channel": "workspace:workspace-uuid-123",
  "data": {
    "id": "event-uuid-456",
    "eventType": "FILE_UPLOADED",
    "workspaceId": "workspace-uuid-123",
    "userId": "user-uuid-789",
    "payload": {
      "fileId": "file-uuid-999",
      "fileName": "report.pdf"
    },
    "timestamp": "2026-06-20T20:10:00.000Z"
  }
}
```
