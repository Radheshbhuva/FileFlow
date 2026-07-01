# Team Workspace Module

The **Team Workspace Module** is the core multi-tenant framework of FileFlow. It enables users to group together, share storage resources, define access permissions, and collaborate on documents.

---

## 1. Directory Structure

All components are organized under `src/modules/workspaces/` inside a self-contained module block:

```text
src/modules/workspaces/
├── controllers/
│   └── workspace.controller.ts   # Maps HTTP payloads to services
├── services/
│   └── workspace.service.ts      # Performs invitations, acceptances, and metrics
├── routes/
│   └── workspace.routes.ts       # Declares endpoints and RBAC guards
├── validators/
│   └── workspace.validators.ts   # Validates incoming parameters using Zod
└── interfaces/ (Extended dynamically in database module interfaces)
```

---

## 2. API Endpoints

All endpoints are mounted under `/api/v1/workspaces`:

### Workspace Management
*   `POST /`: Creates a workspace, provisions basic configurations, and adds creator as `OWNER`.
*   `GET /`: Fetches all workspaces where the user is an active member.
*   `GET /:id`: Retrieves metadata for a single workspace.
*   `PATCH /:id`: Updates settings (name, slug, description).
*   `DELETE /:id`: Deletes workspace and cascades all memberships.

### Member Management
*   `POST /:id/invite`: Initiates invitation to email.
*   `GET /:id/members`: Lists all members.
*   `PATCH /:id/members/:memberId`: Updates role for a member.
*   `DELETE /:id/members/:memberId`: Removes a member from the workspace.

### Accept Invitation
*   `POST /accept`: Validates invite token and adds the target user to the workspace.

### Metrics & Analytics
*   `GET /:id/dashboard`: Dashboard totals (storage limit, usage, member count, and security health score).
*   `GET /:id/analytics`: Workspace collaborations metrics.

---

## 3. Workflow Lifecycles

### Invitation Acceptance Flow
```
User A (Admin)                  Backend API                  User B (Invitee)
    │                                │                               │
    │ 1. Invite User B (email)       │                               │
    ├───────────────────────────────>│                               │
    │                                │ 2. Create Invite Token        │
    │                                │ 3. Store Pending Invite       │
    │                                │                               │
    │                                │ 4. Fetch Token                │
    │                                │<──────────────────────────────┤
    │                                │                               │
    │                                │ 5. Accept Invite (Token)      │
    │                                │<──────────────────────────────┤
    │                                │ 6. Create WorkspaceMember     │
    │                                │ 7. Update status to ACCEPTED  │
    │                                │ 8. Log Event (MEMBER_JOINED)  │
    │                                │                               │
```
