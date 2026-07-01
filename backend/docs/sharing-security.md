# FileFlow Sharing Security Protocols

FileFlow implements multiple layered security gates to safeguard assets shared beyond workspace boundaries.

---

## 1. Password Protection Mechanics

1. **Bcrypt Salt Hashing**:
   - Share passwords are never stored in plain text.
   - When a password is set, the service hashes it using `bcrypt` with 10 salt rounds.
   
2. **Stateless Password Verification Token**:
   - When a client enters the password, the server validates it and returns a stateless, cryptographically signed JWT.
   - The token contains: `{ shareId, token, verified: true }` signed with `env.JWT_SECRET`.
   - The token is short-lived (expires in 15 minutes).
   - This prevents brute-forcing the download link directly, as downloading requires presenting the token in the `x-share-token` header.

---

## 2. Expiration and Limit Gates

Every public request (`GET /public/:token`, `POST /public/:token/download`) traverses standard verification filters:

1. **Link Revocation Check**:
   - Status must equal `ACTIVE`. If status is `REVOKED` or `DISABLED`, access is instantly blocked.
   
2. **Expiry Date Validation**:
   - If `expiryDate` is specified, the system checks: `expiryDate < current_time`.
   - If expired, the status is automatically transitioned to `EXPIRED` in the database, and access is refused.

3. **Download Limit Checks**:
   - If `maxDownloads` is set, the system checks: `downloadCount >= maxDownloads`.
   - If limit has been reached, the link transitions to `EXPIRED` (or disabled) status.

---

## 3. Future Enterprise Audits Roadmap

The sharing architecture is structured to facilitate these expansions:
- **Domain Restrictions**: Schema validation can easily verify if a recipient email belongs to a designated company domain list before generating password tokens.
- **MFA Share Locks**: Integrating Cognito SMS/TOTP challenge requirements on the `/verify` route before issuing the verification JWT token.
- **Access Level Enforcement**: Ensuring `accessLevel === 'EDIT'` maps directly to S3 PUT permissions rather than just GET permissions.
