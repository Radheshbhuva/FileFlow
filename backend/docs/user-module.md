# FileFlow Enterprise User Module

This document outlines the design patterns, storage limits, and integration mapping guidelines for FileFlow's user account management.

---

## 1. Workspace Plan Tiers

The user record defines the maximum storage capacity available based on their active subscription plan:

| Plan Type | Storage Limit (Bytes) | Human-Readable Limit | Description |
| :--- | :--- | :--- | :--- |
| `FREE` | `5,368,709,120` | 5 GB | Default plan assigned during registration. |
| `PRO` | `53,687,091,200` | 50 GB | Power-user workspace for creators and developers. |
| `ENTERPRISE` | `1,099,511,627,776` | 1 TB | Team-level plan with shared limits and auditing. |

---

## 2. Cognito Migration claim translation

To enable a seamless transition to AWS Cognito User Pools, our local User schema fields map to standard and custom OpenID Connect (OIDC) Cognito claims:

| Local Profile Attribute | Cognito Attribute Name | Custom Attribute Mapping |
| :--- | :--- | :--- |
| `id` | `sub` (Subject ID) | - |
| `fullName` | `name` | - |
| `email` | `email` | - |
| `emailVerified` | `email_verified` | - |
| `avatar` | `picture` | - |
| `timezone` | `zoneinfo` | - |
| `role` | - | `custom:role` (String) |
| `planType` | - | `custom:plan_type` (String) |
| `company` | - | `custom:company` (String) |
| `jobTitle` | - | `custom:job_title` (String) |

When executing Cognito JWT validation, our authentication boundary reads these custom claims from the decoded access token directly to attach the role and workspace configuration to the Request state.
