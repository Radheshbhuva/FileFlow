# Role-Based Access Control (RBAC) Design

FileFlow implements an enterprise-grade Role-Based Access Control (RBAC) system to authorize operations inside a workspace.

---

## 1. Roles & Permissions Matrix

Each user membership carries a specific role, mapped to a list of allowed permissions:

| Permission | OWNER | ADMIN | MANAGER | EDITOR | MEMBER | VIEWER | Description |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `workspace.manage` | ✔ | ❌ | ❌ | ❌ | ❌ | ❌ | Delete workspace, change plans. |
| `workspace.invite` | ✔ | ✔ | ✔ | ❌ | ❌ | ❌ | Send new member invitations. |
| `workspace.remove` | ✔ | ✔ | ✔ | ❌ | ❌ | ❌ | Remove members from workspace. |
| `workspace.settings` | ✔ | ✔ | ❌ | ❌ | ❌ | ❌ | Update workspace details (name, slug). |
| `files.upload` | ✔ | ✔ | ✔ | ✔ | ✔ | ❌ | Upload new files. |
| `files.delete` | ✔ | ✔ | ✔ | ✔ | ❌ | ❌ | Delete files. |
| `files.share` | ✔ | ✔ | ✔ | ✔ | ✔ | ❌ | Generate share links. |
| `files.download` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Retrieve file buffers. |
| `files.manage` | ✔ | ✔ | ✔ | ✔ | ❌ | ❌ | Favorite, tag, or catalog files. |
| `members.manage` | ✔ | ✔ | ✔ | ❌ | ❌ | ❌ | Modify member roles. |
| `analytics.view` | ✔ | ✔ | ✔ | ❌ | ❌ | ❌ | Access dashboard metrics & activities. |

---

## 2. Express Middleware Authorization

The middleware `requireWorkspacePermission(permission: string)` secures the routes:

1.  **Extract Workspace ID**: Resolves `workspaceId` from `req.params.workspaceId`, `req.params.id`, `req.body.workspaceId`, or query parameters.
2.  **Verify Membership**: Fetches the user's workspace membership from `WorkspaceRepository.findMember(workspaceId, userId)`.
3.  **Validate Active Status**: Rejects suspended memberships with `403 Forbidden`.
4.  **Enforce Permissions**: Asserts that the member's role contains the required permission scope. Rejects with `403 Forbidden` if missing.
5.  **Context Injection**: Attaches the validated `req.workspace` and `req.membership` objects for use by controller handlers.

---

## 3. Configuration Sample

The mapping is declared programmatically in `src/middleware/rbac.middleware.ts`:

```typescript
export const ROLE_PERMISSIONS: Record<WorkspaceRole, string[]> = {
  OWNER: [...allPermissions],
  ADMIN: [...allExceptManage],
  MANAGER: ['workspace.invite', 'workspace.remove', 'files.upload', 'files.delete', 'files.share', 'files.download', 'files.manage', 'members.manage', 'analytics.view'],
  EDITOR: ['files.upload', 'files.delete', 'files.share', 'files.download', 'files.manage'],
  MEMBER: ['files.upload', 'files.share', 'files.download'],
  VIEWER: ['files.download'],
};
```
