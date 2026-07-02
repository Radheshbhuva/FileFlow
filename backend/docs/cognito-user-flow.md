# AWS Cognito Integration User Flows

This document details the step-by-step sequences and data mapping rules for all identity lifecycles integrated with AWS Cognito.

---

## 1. User Registration Flow

```mermaid
sequenceDiagram
    participant FE as Frontend Client
    participant API as Express Backend
    participant CP as CognitoAuthProvider
    participant COG as AWS Cognito Directory
    participant SY as UserSyncService
    participant DB as DynamoDB Single-Table
    
    FE->>API: POST /api/v1/auth/register { email, password, fullName }
    API->>CP: provider.register(...)
    CP->>CP: Calculate SHA256 SecretHash
    CP->>COG: SignUpCommand (UserAttributes)
    COG-->>CP: Returns UserSub UUID
    CP-->>API: Returns { sub: UserSub, email }
    API->>SY: syncUser(sub, email, fullName)
    SY->>DB: Check profile, insert PK=USER#<id> (Status: PENDING_VERIFICATION)
    SY->>DB: Provision default PK=WORKSPACE#<wsId>
    API-->>FE: HTTP 201 Created { success: true, user }
```

### Steps:
1.  The client sends a registration request containing the user's name, email, and password.
2.  The backend calls `provider.register()`.
3.  `CognitoAuthProvider` calculates the HMAC-SHA256 Client Secret Hash if a client secret is configured, and sends a `SignUpCommand` to Cognito.
4.  Cognito creates the user account in a `UNCONFIRMED` state and returns the unique `UserSub`.
5.  `UserSyncService` writes the local user profile and binds the `cognitoSub`.
6.  A default workspace is automatically provisioned for the new user profile.

---

## 2. User Authentication (Login) Flow

```mermaid
sequenceDiagram
    participant FE as Frontend Client
    participant API as Express Backend
    participant CP as CognitoAuthProvider
    participant COG as AWS Cognito Directory
    participant SY as UserSyncService
    participant DB as DynamoDB Single-Table
    
    FE->>API: POST /api/v1/auth/login { email, password }
    API->>CP: provider.login(...)
    CP->>COG: InitiateAuthCommand (USER_PASSWORD_AUTH)
    COG-->>CP: Returns AccessToken + IdToken + RefreshToken
    CP->>COG: GetUserCommand (resolve attributes)
    COG-->>CP: Returns Username (sub) & Attributes
    CP-->>API: Returns AuthResponse
    API->>SY: syncUser(sub, email)
    SY->>DB: Search profile, bind cognitoSub & verify workspace roles
    SY-->>API: Return local user profile
    API->>DB: Update lastLogin timestamp
    API-->>FE: HTTP 200 OK { token: AccessToken, user }
```

### Steps:
1.  The client submits email and password.
2.  `CognitoAuthProvider` sends an `InitiateAuthCommand` using flow type `USER_PASSWORD_AUTH`.
3.  Cognito validates credentials and returns session tokens.
4.  The provider retrieves user attributes using `GetUserCommand` to verify attributes like `custom:role` and `custom:planType`.
5.  The backend calls `UserSyncService.syncUser()` which looks up the user locally by `cognitoSub` (or email if linking a legacy user) and updates user claims.
6.  The backend updates the user's `lastLogin` timestamp and returns the token and profile.

---

## 3. Email Verification Flow

```mermaid
sequenceDiagram
    participant FE as Frontend Client
    participant API as Express Backend
    participant CP as CognitoAuthProvider
    participant COG as AWS Cognito Directory
    participant DB as DynamoDB Single-Table
    
    FE->>API: GET /api/v1/auth/verify-email?token=TOKEN
    API->>DB: Find user by verificationToken
    DB-->>API: Returns User Profile
    API->>CP: provider.verifyEmail(email)
    CP->>COG: AdminConfirmSignUpCommand
    COG-->>CP: Confirmed
    API->>DB: Update user: emailVerified=true, status=ACTIVE
    API-->>FE: HTTP 200 OK { success: true }
```

### Steps:
1.  The user clicks the verification link, forwarding the unique token query parameter to the backend.
2.  The backend looks up the profile matching the verification token and ensures it hasn't expired.
3.  The backend calls `provider.verifyEmail(email)`.
4.  `CognitoAuthProvider` uses `AdminConfirmSignUpCommand` to confirm the user within the user pool directory.
5.  The backend marks `emailVerified: true` and `accountStatus: 'ACTIVE'` locally.

---

## 4. Password Recovery / Reset Flow

```mermaid
sequenceDiagram
    participant FE as Frontend Client
    participant API as Express Backend
    participant CP as CognitoAuthProvider
    participant COG as AWS Cognito Directory
    participant DB as DynamoDB Single-Table
    
    FE->>API: POST /api/v1/auth/forgot-password { email }
    API->>DB: Save resetPasswordToken locally
    API->>CP: provider.forgotPassword(email)
    CP->>COG: ForgotPasswordCommand
    COG-->>CP: Code Sent to User Email
    API-->>FE: HTTP 200 OK
    
    Note over FE, COG: User receives verification code in email
    
    FE->>API: POST /api/v1/auth/reset-password { token, password }
    API->>DB: Verify resetPasswordToken
    DB-->>API: Returns User Profile
    API->>CP: provider.resetPassword(email, code, password)
    CP->>COG: ConfirmForgotPasswordCommand
    COG-->>CP: Password Updated
    API->>DB: Update passwordHash = 'COGNITO_MANAGED'
    API-->>FE: HTTP 200 OK
```

### Steps:
1.  The user requests a password reset by providing their email.
2.  The backend saves a reset token locally and calls `provider.forgotPassword()`.
3.  Cognito triggers a ForgotPassword code email directly to the user.
4.  The user enters the code and their new password on the frontend page.
5.  The backend verifies the local reset token and calls `provider.resetPassword()`.
6.  `CognitoAuthProvider` confirms the password reset in Cognito, and the backend updates the local password hash to `COGNITO_MANAGED`.
