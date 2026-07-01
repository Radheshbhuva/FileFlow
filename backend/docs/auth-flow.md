# FileFlow Authentication Flow

This document details the step-by-step logic, validation loops, and sequence of actions for FileFlow's authentication operations.

---

## 1. Registration Flow (`POST /api/v1/auth/register`)

```mermaid
sequenceDiagram
    autonumber
    Client->>+API Gateway/Express: POST /auth/register { fullName, email, password, confirmPassword }
    API Gateway/Express->>+Validation Middleware: Validate schema rules (Zod)
    
    alt Schema check fails
        Validation Middleware-->>Client: 400 Bad Request { success: false, errors }
    else Schema check passes
        Validation Middleware->>+AuthService: register(dto)
        AuthService->>+UserRepository: findByEmail(email)
        UserRepository-->>-AuthService: User | null
        
        alt Email already exists
            AuthService-->>Validation Middleware: Throw ConflictError (409)
            Validation Middleware-->>Client: 409 Conflict { success: false, message }
        else Email is unique
            AuthService->>+PasswordService: hash(password)
            PasswordService-->>-AuthService: bcryptHashString
            AuthService->>+UserRepository: create({ ..., passwordHash, verificationToken })
            UserRepository-->>-AuthService: User
            AuthService-->>-Validation Middleware: User (without passwordHash)
            Validation Middleware-->>-Client: 201 Created { success: true, user }
        end
    end
```

### Key Rules
- **Strong Passwords**: Must contain at least 8 characters, 1 uppercase, 1 lowercase, 1 digit, and 1 special symbol.
- **Verification Token**: A secure random hex string is generated (`crypto.randomBytes(32)`).
- **Initial Account Status**: Created with `PENDING_VERIFICATION` status and `emailVerified: false`.

---

## 2. Login Flow (`POST /api/v1/auth/login`)

```mermaid
sequenceDiagram
    autonumber
    Client->>+API Gateway/Express: POST /auth/login { email, password }
    API Gateway/Express->>+Validation Middleware: Validate schema rules (Zod)
    
    alt Schema check fails
        Validation Middleware-->>Client: 400 Bad Request { success: false, errors }
    else Schema check passes
        Validation Middleware->>+AuthService: login(dto)
        AuthService->>+UserRepository: findByEmail(email)
        UserRepository-->>-AuthService: User | null
        
        alt User not found OR password comparison fails
            AuthService-->>Validation Middleware: Throw UnauthorizedError (401)
            Validation Middleware-->>Client: 401 Unauthorized { success: false, message: 'Invalid credentials' }
        else User is Suspended
            AuthService-->>Validation Middleware: Throw ForbiddenError (403)
            Validation Middleware-->>Client: 403 Forbidden { success: false, message: 'Account suspended' }
        else Auth succeeds
            AuthService->>+UserRepository: update(id, { lastLogin: Date.now() })
            UserRepository-->>-AuthService: UpdatedUser
            AuthService->>+TokenService: generateAccessToken(payload)
            TokenService-->>-AuthService: accessToken (JWT)
            AuthService-->>-Validation Middleware: { token, user }
            Validation Middleware-->>-Client: 200 OK { success: true, data: { token, user } }
        end
    end
```

---

## 3. Email Verification Flow (`GET /api/v1/auth/verify-email?token=...`)

1. User clicks the link containing the `token` parameter.
2. Client queries `GET /api/v1/auth/verify-email?token=...`.
3. Validation middleware verifies the presence of the query parameter.
4. **AuthService** finds the user matching `verificationToken`:
   - Checks if the token has expired (expires 24 hours after creation).
   - If valid, updates user's attributes: `emailVerified: true`, `accountStatus: ACTIVE`, and clears out the temporary token and expiration dates.
5. Returns the updated User profile payload with code `200 OK`.

---

## 4. Password Recovery Flows

### A. Forgot Password (`POST /api/v1/auth/forgot-password`)
- Request requires `{ email }`.
- Generates a secure token (`crypto.randomBytes(32)`), setting expiration to 1 hour.
- Stores token hashes on the target user record.
- **Security Check**: Returns `200 OK` indicating a reset link will be sent if an account matches the email, preventing user scanning attacks.

### B. Reset Password (`POST /api/v1/auth/reset-password`)
- Requires `{ token, password, confirmPassword }`.
- Verifies token validity and expiration.
- Hashes the new password using `PasswordService` and updates database credentials, clearing reset fields.

---

## 5. Cognito AWS Integration Readiness

When migrating authentication to AWS Cognito:
- **Registration**: Express delegates user registration to Cognito `signUp` API, which natively handles hashing and confirmation delivery.
- **Login**: Auth requests are sent to Cognito `initiateAuth`. Cognito returns JWT ID, access, and refresh tokens.
- **Route Guard**: The `protect` middleware is updated to fetch Cognito's JWKS public keys and decode ID tokens instead of checking our local database.
