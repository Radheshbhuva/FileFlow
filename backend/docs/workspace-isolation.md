# Workspace Isolation Strategy

To ensure enterprise-grade security, FileFlow guarantees strict logical separation of all customer data. A user or member in Workspace A must never be able to access files, shares, activities, notifications, or metrics belonging to Workspace B.

---

## 1. Single-Table Key Isolation (DynamoDB)

DynamoDB uses the partition key (`PK`) to group and locate items physically. FileFlow indexes workspace items under strict partition prefixes:

*   **Workspace Metadata**:
    *   PK: `WORKSPACE#<workspaceId>`
    *   SK: `METADATA`
*   **Workspace Memberships**:
    *   PK: `WORKSPACE#<workspaceId>`
    *   SK: `MEMBER#<userId>`
*   **Workspace Files**:
    *   PK: `WORKSPACE#<workspaceId>`
    *   SK: `FILE#<fileId>`
*   **Workspace Invitations**:
    *   PK: `WORKSPACE#<workspaceId>`
    *   SK: `INVITE#<email>`

### Query Execution Boundaries
Every repository read query must explicitly specify the `PK` condition (e.g. `KeyConditionExpression: 'PK = :pk'`).
Because `PK` includes `WORKSPACE#<workspaceId>`, queries are structurally bounded to a single tenant partition. A scan is never performed across workspace boundaries.

---

## 2. Authorization Guards

1.  **Route Parameters Protection**: All endpoints modify state or fetch data by specifying a workspace parameter (e.g., `:id`).
2.  **RBAC Check**: The router passes the request through the `requireWorkspacePermission` guard. This checks that:
    - The active authenticated user `req.user.id` has a registered membership record (`WorkspaceMember`) inside the targeted workspace.
    - The membership status is active.
3.  **Scope Verification**: The request is rejected immediately if the user is not a verified active member, preventing enumeration or ID harvesting of files.

---

## 3. GSI Projections Security

Global Secondary Indexes (GSIs) project attributes to allow cross-partition lookups. We protect GSI boundaries:

*   **GSI1 (User Membership Lookup)**:
    *   PK: `USER#<userId>`
    *   SK: `WORKSPACE#<workspaceId>`
    *   Allows fetching all memberships for a user. Bounded securely because only the authenticated user can query their own `USER#<userId>`.
*   **GSI2 (Workspace Owner Lookup)**:
    *   PK: `OWNER#<ownerId>`
    *   SK: `WORKSPACE#<workspaceId>`
    *   Allows retrieving owned workspaces.
