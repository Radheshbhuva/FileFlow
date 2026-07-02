# Server-Sent Events (SSE) Protocol Specification

This document details the HTTP streaming, parameters, and stream formats utilized in FileFlow's Server-Sent Events (SSE) integration.

---

## 1. Handshake & Endpoint

Server-Sent Events (SSE) provide a lightweight, unidirectional real-time data channel from the server to the client. This is ideal for environments where WebSocket ports are blocked or standard HTTP routing is preferred.

- **Connection Endpoint**:
  `GET /api/v1/realtime/stream?token=<JWT_ACCESS_TOKEN>`

---

## 2. Browser EventSource Initialization

Initialize connection in client browsers:

```javascript
const token = 'your-jwt-token';
const eventSource = new EventSource(`/api/v1/realtime/stream?token=${token}`);

eventSource.addEventListener('open', (event) => {
  console.log('SSE Stream established successfully');
});

eventSource.onmessage = (event) => {
  const payload = JSON.parse(event.data);
  console.log(`Received event on channel ${payload.channel}:`, payload.data);
};

eventSource.onerror = (error) => {
  console.error('SSE Stream error occurred:', error);
};
```

---

## 3. SSE Protocol Format (Raw Text Streams)

Messages are written to the HTTP response using standard Server-Sent Event boundary formats:

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

event: open
data: {"success":true,"message":"Connected to FileFlow SSE stream","data":{"userId":"user-123","workspaceId":"workspace-123"}}

data: {"channel":"workspace:workspace-123","data":{"id":"event-456","eventType":"FILE_SHARED","workspaceId":"workspace-123","userId":"user-123","payload":{"shareId":"share-999","fileId":"file-999"},"timestamp":"2026-06-20T20:10:00.000Z"}}

:keepalive

```
- **Heartbeats**: Every 30 seconds, a keep-alive line (`:\n\n`) is written to keep the connection warm and prevent middleware proxies (like Nginx or AWS load balancers) from dropping the stream.
- **Auto-Reconnect**: The client's browser `EventSource` object automatically attempts reconnection if the socket drops.
