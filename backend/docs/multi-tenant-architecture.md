# Multi-Tenant SaaS Architecture

FileFlow utilizes a **Logical Multi-Tenancy** architecture using shared computing resources (compute, database, and storage) protected by application-level logical access controls.

---

## 1. Shared Database & Single-Table Partitioning

Unlike physical multi-tenancy (separate databases per client), FileFlow maps all tenants to a unified DynamoDB table:
- **Cost Efficiency**: Zero idle cost. Ideal for free tiers and startup scaling.
- **Unified Backups**: Simple AWS backup policies for the complete table.
- **Resource Limits**: Controlled via workspace metadata storage limits.

---

## 2. Shared S3 Storage Namespaces

All files uploaded to S3 are isolated using workspace ID prefix paths:

```text
s3://fileflow-bucket/workspaces/<workspaceId>/files/<fileId>/<fileName>
```

- **S3 IAM Policy Least Privilege**: The backend IAM credentials allow reading/writing to the S3 bucket.
- **Path Resolution**: S3 paths are constructed programmatically from the validated `req.workspace.id` to prevent cross-tenant key access or traversal attacks.

---

## 3. Limit Enforcement (Billing and Quotas)

Every workspace record maintains `storageUsed` and `storageLimit` counts:

1.  **Quota Verification**: Before generating a presigned S3 upload URL or accepting a direct file buffer, the backend validates that:
    ```text
    storageUsed + incomingFileSize <= storageLimit
    ```
2.  **Storage Update**: Upon successful upload completion, the file size is added to the workspace `storageUsed` count in database.
3.  **Plan Tiers**:
    - **Free Workspace Plan**: 5 GB storage limit, maximum 10 members.
    - **Enterprise Workspace Plan**: Unlimited members, customizable limits (scalable storage pools).

---

## 4. Collaborative Extensions Hook

The Team Workspace Module is structured as the foundational namespace for future collaboration additions:

*   **Shared Folders**: Mapped under the workspace directory tree.
*   **Comments and Mentions**: Linked to `fileId` and bounded within the active `workspaceId`.
*   **Collaborative Editing / Locks**: Bounded within workspace member sessions.
*   **AI Workspace Insights**: Aggregates metadata files from the targeted `WORKSPACE#<workspaceId>` partition to generate reports safely without cross-tenant leaks.
