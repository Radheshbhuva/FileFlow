# Authentication Provider Pattern

This document details the interface-driven, swappable authentication design implemented inside FileFlow. By decoupling core business modules from concrete identity providers (like AWS Cognito, Auth0, Clerk, or local auth), the system achieves modularity, offline testability, and future-proof flexibility.

---

## 1. Architectural Concept

Instead of calling specific authentication SDK libraries (such as AWS SDK `@aws-sdk/client-cognito-identity-provider`) within routers, middlewares, or application services, the backend interacts exclusively with the `AuthProvider` interface. 

The active provider implementation is resolved dynamically at runtime by the `AuthProviderFactory` based on configuration parameters:

```
          Express Controllers / Middleware
                         │
                         ▼
                 AuthService Layer
                         │
                         ▼
                AuthProvider Factory
                         │
         ┌───────────────┴───────────────┐
         ▼                               ▼
  CognitoAuthProvider             MockAuthProvider
   (AWS SDK v3 Client)          (Offline / Test DB)
```

---

## 2. Component Design

### A. The `AuthProvider` Interface
Located at [auth-provider.interface.ts](file:///c:/House_of_Growth/Zero-Cost_AWS_Projects/aws-file-sharing-system-1/backend/src/modules/auth/interfaces/auth-provider.interface.ts), it defines the complete interface contract for authentication operations:

```typescript
export interface AuthProvider {
  register(dto: { email: string; password?: string; fullName: string }): Promise<{ sub: string; email: string }>;
  authenticate(dto: { email: string; password?: string }): Promise<AuthResponse>;
  confirmSignUp(email: string): Promise<void>;
  setUserPassword(email: string, passwordHash: string): Promise<void>;
  refreshSession(refreshToken: string, email: string): Promise<Partial<AuthResponse>>;
  getUser(accessToken: string): Promise<AuthUserPayload>;
  deleteUser(email: string): Promise<void>;

  // Spec-Compliant Aliases & Extensions
  login(dto: { email: string; password?: string }): Promise<AuthResponse>;
  logout(accessToken: string): Promise<void>;
  verifyEmail(email: string): Promise<void>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(email: string, code: string, passwordHashOrPlain: string): Promise<void>;
}
```

### B. The Providers

1.  **`CognitoAuthProvider`**:
    *   Implements calls to AWS Cognito User Pools using the AWS SDK v3 `CognitoIdentityProviderClient`.
    *   Calculates the required SHA256 `SecretHash` when a client secret is configured.
    *   Maps standard and custom user pool attributes (`custom:role`, `custom:planType`, `custom:workspaceId`).
2.  **`MockAuthProvider`**:
    *   A local, database-driven mock that runs without network access.
    *   Supports offline-mode, seeding mock users in the local memory database, and signing mock tokens using local HS256 encryption.
    *   Enables lightning-fast unit tests and offline-first developer workflows.

### C. The Provider Factory
The `AuthProviderFactory` evaluates environment variables to yield the single active `AuthProvider` instance. It checks `process.env.AUTH_PROVIDER`. If set to `'cognito'` and configured with pool and client IDs, it yields a `CognitoAuthProvider`, otherwise falling back to `MockAuthProvider`.

---

## 3. Decoupled Workflows

Because business modules do not directly depend on Cognito:
*   **Swapping Providers**: If the system moves from Amazon Cognito to Clerk, Auth0, or Firebase in the future, only a new `ClerkAuthProvider` class needs to be implemented. Core routes, controllers, and database schemas remain completely untouched.
*   **Offline Testability**: Jest tests run the entire authentication and authorization flow locally using the `MockAuthProvider` without needing internet access, sandbox user pools, or local mock S3 servers.
