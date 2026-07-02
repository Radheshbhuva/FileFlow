# AWS Cognito Integration User Flows

This document details the step-by-step sequences for all user flows managed by the AWS Cognito Integration Layer.

---

## 1. User Registration Flow

```mermaid
sequenceDiagram
    participant FE as Frontend App
    participant API as Backend Express API
    participant CP as CognitoAuthProvider
    participant DB as DynamoDB / Repository
    
    FE->>API: POST /auth/register (email, fullName, password)
    API->>CP: provider.register()
    CP->>CP: Compute SecretHash (HMAC-SHA256)
    CP->>AWS Cognito: SignUpCommand
    AWS Cognito-->>CP: Returns UserSub
    CP-->>API: Returns { sub, email }
    API->>DB: userRepository.create() (status: PENDING_VERIFICATION)
    API->>DB: workspaceRepository.create() (provision default workspace)
    API-->>FE: HTTP 201 Success (User profile details)
```

---

## 2. User Authentication (Login) Flow

```mermaid
sequenceDiagram
    participant FE as Frontend App
    participant API as Backend Express API
    participant CP as CognitoAuthProvider
    participant SY as UserSyncService
    participant DB as DynamoDB / Repository
    
    FE->>API: POST /auth/login (email, password)
    API->>CP: provider.authenticate()
    CP->>AWS Cognito: InitiateAuthCommand (USER_PASSWORD_AUTH)
    AWS Cognito-->>CP: Returns AccessToken + IdToken + RefreshToken
    CP->>AWS Cognito: GetUserCommand (resolve attributes)
    AWS Cognito-->>CP: Returns Username (sub) & Attributes
    CP-->>API: Returns AuthResponse
    API->>SY: syncUser(sub, email)
    SY->>DB: Check by email, bind cognitoSub & verify default workspace
    SY-->>API: Returns User Profile
    API->>DB: Update lastLogin date
    API-->>FE: HTTP 200 Success (Tokens & User profile)
```

---

## 3. Email Verification Flow

```mermaid
sequenceDiagram
    participant FE as Frontend App
    participant API as Backend Express API
    participant CP as CognitoAuthProvider
    participant DB as DynamoDB / Repository
    
    FE->>API: GET /auth/verify-email?token=TOKEN
    API->>DB: Find user by verificationToken
    DB-->>API: Returns User Profile
    API->>CP: provider.confirmSignUp(email)
    CP->>AWS Cognito: AdminConfirmSignUpCommand
    AWS Cognito-->>CP: Sign-up Confirmed
    API->>DB: Update status to ACTIVE & emailVerified=true
    API-->>FE: HTTP 200 Success (Verified User profile)
```

---

## 4. Password Recovery Flow

```mermaid
sequenceDiagram
    participant FE as Frontend App
    participant API as Backend Express API
    participant CP as CognitoAuthProvider
    participant DB as DynamoDB / Repository
    
    FE->>API: POST /auth/forgot-password (email)
    API->>DB: Save resetPasswordToken locally
    API-->>FE: HTTP 200 Success (resetToken returned in non-prod)
    
    FE->>API: POST /auth/reset-password (token, password)
    API->>DB: Verify resetPasswordToken & expiration
    DB-->>API: Returns User Profile
    API->>CP: provider.setUserPassword(email, password)
    CP->>AWS Cognito: AdminSetUserPasswordCommand (Permanent: true)
    AWS Cognito-->>CP: Password Changed
    API->>DB: Update local passwordHash to COGNITO_MANAGED
    API-->>FE: HTTP 200 Success
```
