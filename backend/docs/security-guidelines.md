# Authentication Security Guidelines

This document outlines key security guidelines, patterns, and enforcement rules integrated into FileFlow's authentication module.

---

## 1. Password Protection Standards

- **Hashing Algorithm**: Passwords are hashed using **bcrypt** with `12` rounds of salt calculation. This work factor balances computational security against latency.
- **Never Expose Hashes**: Database models containing password hashes must be stripped immediately before returning user structures to controllers.
  - Done programmatically in `AuthService` by destructuring `{ passwordHash, ...user }` and returning the clean profile.
- **Strict Strength Checks**: Zod validation filters out common and weak passwords.
  - Rules: At least 8 characters, maximum 100 characters.
  - Regex requirement: `(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])`.

---

## 2. JWT and Session Defense

- **State Isolation**: Tokens are signed and verified in memory. The backend stores no session state, preparing it for serverless scaling.
- **Bearer Tokens**: Access tokens must be passed in the `Authorization: Bearer <token>` header on all requests to protected routes.
- **Short Token Lifespans**: Access tokens expire in `1d` (or `15m` once refresh token rotation is deployed).

---

## 3. Route Access Guards

- **Authentication Guard (`protect`)**:
  - Restricts endpoint usage to authenticated callers.
  - Instantiated as standard middleware.
- **Role Filtering Guard (`restrictTo`)**:
  - Enforces Role-Based Access Control (RBAC).
  - Example setup securing endpoints to administrators:
    ```typescript
    router.delete('/files/:id', protect, restrictTo('ADMIN', 'OWNER'), deleteFileController);
    ```

---

## 4. Mitigation of Common Exploits

- **Email Enumeration Mitigation**:
  - The `/auth/forgot-password` endpoint returns a generic success message ("If an account matches this email, a reset link will be sent") rather than confirming whether the email exists.
- **Brute Force Defense**:
  - Integrated via `express-rate-limit` middleware (`src/middleware/rate-limit.middleware.ts`) capping request frequencies to 100 requests per 15 minutes.
- **CORS Constraints**:
  - Limits resource extraction strictly to the browser origin defined in the `CLIENT_URL` environment parameter.
