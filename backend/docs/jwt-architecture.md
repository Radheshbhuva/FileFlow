# JWT Architecture

This document describes the structure, signing, and verification mechanisms of the JSON Web Token (JWT) system utilized in FileFlow.

---

## 1. Access Token Payload Structure

The access token is a standard cryptographically signed string containing the user's primary metadata and permission flags:

```json
{
  "sub": "a2b3c4d5-e6f7-8a9b-0c1d-2e3f4a5b6c7d", 
  "email": "user@fileflow.com",
  "role": "USER",
  "planType": "FREE",
  "iat": 1718817600,
  "exp": 1718904000
}
```

### Claim Meanings
- **`sub` (Subject)**: The unique identifier of the user (e.g. uuid). Maps to Cognito `sub` claim.
- **`email`**: The email address of the authenticated user.
- **`role`**: The Authorization role (`USER`, `ADMIN`, `OWNER`) checked by route guards.
- **`planType`**: The storage and features plan (`FREE`, `PRO`, `ENTERPRISE`).
- **`iat` (Issued At)**: Timestamp when the token was signed.
- **`exp` (Expiration Time)**: Timestamp when the token becomes invalid.

---

## 2. Signing and Verification System

Access tokens are signed using a symmetric key (`HMAC SHA256`) defined in `JWT_SECRET`.

- **Generation**: Signed in `TokenService.generateAccessToken` on login.
- **Verification**: Verified in `TokenService.verifyAccessToken` during request interception:
  - Verifies token signature.
  - Checks if current time is before `exp`.
  - Parses payload claims and extracts `sub` user ID.

---

## 3. Future Refresh Token Architecture

To enable persistent user sessions without compromising security, we plan to implement a Refresh Token flow:

```text
+--------+                                           +---------------+
|        |----(1) POST /auth/login with credentials->|               |
|        |<---(2) Return short-lived Access Token----|               |
|        |        and long-lived Refresh Token-------|               |
|        |                                           |               |
| Client |----(3) Request /files with Access Token-->|  Auth Server  |
|        |<---(4) Return File Data (200 OK)----------|               |
|        |                                           |               |
|        |----(5) Access Token Expires (401 error)-->|               |
|        |----(6) POST /auth/refresh with Refresh--->|               |
|        |<---(7) Return New Access Token------------|               |
+--------+                                           +---------------+
```

### Roadmap Specifications
1. **Refresh Token Storage**:
   - Refresh tokens are long-lived (e.g., 7–30 days).
   - Stored in a database repository matching the user ID (`userId`, `token`, `expiresAt`, `revoked`).
   - Delivered to the client in an `httpOnly`, secure, SameSite cookie, protecting it from cross-site scripting (XSS) extraction.
2. **Access Token Rotation**:
   - Access tokens have short lifetimes (e.g., 15 minutes).
   - When expired, the client automatically requests `/auth/refresh`, validates the refresh token, and receives a new short-lived access token.
3. **Cognito Delegation**:
   - In Cognito, this refresh cycle is handled natively by the Cognito SDK (exchanging the Cognito refresh token for a new Cognito ID/Access token).
