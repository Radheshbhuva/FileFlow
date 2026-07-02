# Authentication Provider Architecture

This document describes the design of FileFlow's authentication abstraction layer.

---

## Architecture Class Design

The system decouples the core authentication services from AWS Cognito SDK dependencies using an interface-driven design.

```
       Express Routes / Controllers
                  │
                  ▼
          AuthService Layer
                  │
                  ▼
         AuthProvider Factory
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
CognitoAuthProvider    MockAuthProvider (Local Offline)
 (AWS SDK v3)
```

### Components

1. **`AuthProvider` (Interface)**:
   Specifies abstract authentication capabilities (signup, verify email, log in, password management) that are independent of any specific provider.
2. **`CognitoAuthProvider`**:
   The production driver, implementing custom attributes (`custom:planType`), client secret verification hash calculation (`SecretHash`), and admin session controls.
3. **`MockAuthProvider`**:
   The local driver, bypassing network layers to perform local registration and session simulation against database repositories, supporting offline development.
4. **`AuthProviderFactory`**:
   Evaluates system environment variables (`AUTH_PROVIDER` and client details) to yield the configured `AuthProvider` instance.
5. **`UserSyncService`**:
   Translates external claims (Cognito Subject, Emails) into user records in DynamoDB, auto-provisioning default workspaces for new users.
