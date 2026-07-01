# Single Table Design Schema Blueprint

This document details the visual key mappings and item schemas representing all FileFlow SaaS entities inside the single table model.

---

## 1. Single Table Visual Index Mappings

The table uses generic Partition Keys (`PK`), Sort Keys (`SK`), and generic GSI attributes (`GSI1PK`, `GSI1SK`, etc.) to support multiple item types:

| Item Type | Partition Key (PK) | Sort Key (SK) | GSI1PK | GSI1SK | GSI2PK | GSI2SK | GSI3PK | GSI3SK | GSI4PK | GSI4SK | GSI5PK | GSI5SK |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **User** | `USER#id` | `PROFILE` | `USER_EMAIL#email` | `PROFILE` | - | - | - | - | - | - | - | - |
| **Workspace** | `WORKSPACE#id` | `METADATA` | - | - | `OWNER#ownerId` | `WORKSPACE#id` | - | - | - | - | - | - |
| **File** | `WORKSPACE#workspaceId` | `FILE#id` | - | - | `OWNER#ownerId` | `FILE#id` | `FILE#id` | `WORKSPACE#workspaceId` | - | - | - | - |
| **Share** | `FILE#id` | `SHARE#id` | `SHARE_TOKEN#token` | `SHARE#id` | `OWNER#ownerId` | `SHARE#id` | `SHARE#id` | `FILE#id` | - | - | - | - |
| **Activity** | `USER#userId` | `ACTIVITY#timestamp#id` | - | - | - | - | `ACTIVITY#id` | `USER#userId` | `ACTIVITY` | `timestamp` | - | - |
| **Notification** | `USER#userId` | `NOTIFICATION#timestamp#id` | - | - | - | - | `NOTIFICATION#id` | `USER#userId` | - | - | `USER#userId` | `status#timestamp` |
| **Upload** | `USER#userId` | `UPLOAD#id` | - | - | - | - | `UPLOAD#id` | `USER#userId` | - | - | - | - |
| **SearchHistory** | `USER#userId` | `SEARCH#query` | - | - | - | - | - | - | - | - | - | - |

---

## 2. Entity Attribute Definitions

### 1. User
- **PK**: `USER#${id}`
- **SK**: `PROFILE`
- **GSI1PK**: `USER_EMAIL#${email}` (for login query verification)
- **GSI1SK**: `PROFILE`
- **Attributes**:
  - `id`: string (UUID)
  - `fullName`: string
  - `email`: string
  - `passwordHash`: string
  - `role`: `'USER' | 'ADMIN' | 'OWNER'`
  - `planType`: `'FREE' | 'PRO' | 'ENTERPRISE'`
  - `emailVerified`: boolean
  - `accountStatus`: string
  - `storageUsed`: number (in bytes)
  - `storageLimit`: number (in bytes)
  - `avatar`: string (optional)
  - `timezone`: string
  - `company`: string
  - `jobTitle`: string
  - `createdAt`: ISO String
  - `updatedAt`: ISO String

### 2. Workspace
- **PK**: `WORKSPACE#${id}`
- **SK**: `METADATA`
- **GSI2PK**: `OWNER#${ownerId}`
- **GSI2SK**: `WORKSPACE#${id}`
- **Attributes**:
  - `id`: string (UUID)
  - `name`: string
  - `ownerId`: string
  - `createdAt`: ISO String
  - `updatedAt`: ISO String

### 3. File
- **PK**: `WORKSPACE#${workspaceId}` (defaults to user's `ownerId`)
- **SK**: `FILE#${id}`
- **GSI3PK**: `FILE#${id}` (for direct lookup by ID)
- **GSI3SK**: `WORKSPACE#${workspaceId}`
- **Attributes**:
  - `id`: string (UUID)
  - `ownerId`: string
  - `fileName`: string
  - `originalName`: string
  - `fileType`: string
  - `mimeType`: string
  - `fileSize`: number
  - `storagePath`: string
  - `securityScore`: number
  - `favorite`: boolean
  - `status`: `'ACTIVE' | 'ARCHIVED' | 'DELETED'`
  - `shareStatus`: `'PRIVATE' | 'SHARED'`
  - `createdAt`: ISO String
  - `updatedAt`: ISO String

### 4. Share
- **PK**: `FILE#${fileId}`
- **SK**: `SHARE#${id}`
- **GSI1PK**: `SHARE_TOKEN#${shareToken}` (for link access validation)
- **GSI1SK**: `SHARE#${id}`
- **GSI2PK**: `OWNER#${ownerId}` (for owner analytics aggregations)
- **GSI2SK**: `SHARE#${id}`
- **GSI3PK**: `SHARE#${id}` (for direct ID check updates)
- **GSI3SK**: `FILE#${fileId}`
- **Attributes**:
  - `id`: string
  - `fileId`: string
  - `ownerId`: string
  - `shareLink`: string
  - `shareToken`: string
  - `accessLevel`: string
  - `shareStatus`: `'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'DISABLED'`
  - `downloadCount`: number
  - `maxDownloads`: number (optional)
  - `expiryDate`: ISO String (optional)
  - `passwordProtected`: boolean
  - `passwordHash`: string (optional)
  - `createdAt`: ISO String
  - `updatedAt`: ISO String

### 5. Activity
- **PK**: `USER#${userId}`
- **SK**: `ACTIVITY#${timestamp}#${id}`
- **GSI3PK**: `ACTIVITY#${id}`
- **GSI3SK**: `USER#${userId}`
- **GSI4PK**: `'ACTIVITY'` (global index selector partition constant)
- **GSI4SK**: `${timestamp}` (for global feed ordering)
- **Attributes**:
  - `id`: string
  - `userId`: string
  - `activityType`: string
  - `resourceType`: string
  - `resourceId`: string
  - `resourceName`: string
  - `description`: string
  - `severity`: `'INFO' | 'WARNING' | 'CRITICAL'`
  - `metadata`: nested map
  - `createdAt`: ISO String

### 6. Notification
- **PK**: `USER#${userId}`
- **SK**: `NOTIFICATION#${timestamp}#${id}`
- **GSI3PK**: `NOTIFICATION#${id}`
- **GSI3SK**: `USER#${userId}`
- **GSI5PK**: `USER#${userId}`
- **GSI5SK**: `${status}#${timestamp}` (e.g. `UNREAD#2026-06-20T19:00:00.000Z` - for unread feeds queries)
- **Attributes**:
  - `id`: string
  - `userId`: string
  - `notificationType`: string
  - `title`: string
  - `message`: string
  - `severity`: `'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL'`
  - `status`: `'UNREAD' | 'READ' | 'ARCHIVED'`
  - `metadata`: nested map
  - `createdAt`: ISO String
  - `readAt`: ISO String (optional)
