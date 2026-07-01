# Real-Time Events Layer Architecture

This document describes the high-level design, routing workflows, and scaling mechanisms of FileFlow's Real-Time Events Layer.

---

## 1. Design Overview

To keep real-time operations decoupled from core business systems, FileFlow introduces a centralized **Event Bus** design. Business services and domain event listeners do not manage direct WebSocket sockets or SSE connection streams; instead, they publish events as standardized entity frames to a central broker.

```
       Business Services (Files, Uploads, Shares, Notifications, etc.)
                      │
                      ▼ (Emits local event)
            RealtimeListener Bridge
                      │
                      ▼ (Calls publishEvent)
                EventBusService (Central coordinator)
                      │
            ┌─────────┴─────────┐
            ▼                   ▼
    WebSocketProvider       SSEProvider
    (RealtimeProvider)   (RealtimeProvider)
```

---

## 2. Key Architecture Components

### A. RealtimeProvider Abstraction
An interface establishing standard connection lifecycle and publishing operations, ensuring that the underlying transport (WebSockets, SSE, or future Redis/EventBridge layers) can be swapped or scaled with minimal refactoring.

### B. WebSocket Provider (`ws`)
Attaches to the main HTTP Server. Automatically handles handshake authorizations using JWT verification, manages user channel mapping, and routes broadcasts to specific workspace clients.

### C. Server-Sent Events (SSE) Provider
Exposes standard HTTP stream responses for clients connecting over EventSource protocols. Manages keepalive heartbeats and broadcasts events using structured text streams.

### D. Central Event Bus
The single routing engine. Emits events locally to internal listeners and pushes events to active transport providers for delivery to browsers.

---

## 3. Horizontal Scaling and Scalability Roadmap

For multi-instance deployments where servers run in a load-balanced cluster, the local `eventBus` memory state must be linked via a broker:

1. **Redis Pub/Sub (Recommended)**:
   - When `EventBusService.publishEvent()` is triggered on Node A, it pushes the serialized event to Redis.
   - All server nodes subscribe to Redis channels and forward received events to their locally connected WebSocket and SSE clients.
2. **AWS EventBridge & API Gateway WebSockets**:
   - For serverless AWS migrations, the WebSocket state is managed by AWS API Gateway WebSockets, routing messages through AWS Lambda and AWS EventBridge to handle subscriber state at massive scale.
