# FileFlow Backend Architecture

This document details the high-level architecture of the FileFlow backend, detailing design decisions, integration vectors, and production patterns.

---

## 1. Serverless Readiness & AWS Lambda Migration

To facilitate an eventual migration to AWS serverless hosting (e.g. AWS Lambda and Amazon API Gateway) without rewrites:

### App vs. Server Separation
- **`app.ts`** configures and sets up the entire Express application (Middlewares, CORS policies, parser limits, routes, error boundaries). It does NOT listen on ports.
- **`server.ts`** acts as the local environment loader and HTTP runner. It binds `app.ts` to `http.createServer` and launches listeners on `PORT`.
- **Lambda Adaptation**: When migrating to AWS Lambda, `app.ts` is imported directly into the Lambda execution context using `@vendia/serverless-express`:
  ```typescript
  import { app } from './app';
  import serverlessExpress from '@vendia/serverless-express';
  export const handler = serverlessExpress({ app });
  ```
  This eliminates cold-start overheads and keeps deployment packages decoupled from system port binders.

### Stateless Operations
- File operations must remain strictly stateless. No session state or upload binaries should be held in local runtime memory or filesystem storage.
- File uploads will use **S3 Presigned URLs** fetched via metadata queries, bypassing the Express compute layer and saving bandwidth/cost.

---

## 2. Security Integration Boundaries

Security policies are enforced using standard HTTP headers and access tokens:

### Helmet & CORS
- **Helmet** injects standard security headers to shield the API from common exploits (e.g. XSS, Clickjacking, MIME sniffing).
- **CORS** restricts resource requests exclusively to the validated `CLIENT_URL` environment variables.

### Cognito Authentication Strategy (Future)
- Integration will target **Amazon Cognito User Pools**.
- Incoming HTTP requests will include Cognito-issued JSON Web Tokens (JWT) in the `Authorization` header (`Bearer <Token>`).
- Authentication middleware will verify token signatures locally using `aws-jwt-verify` (utilizing JWKS endpoints) or delegate parsing to an Amazon API Gateway Cognito Authorizer.

---

## 3. Data Decoupling & Repository Pattern

To enable seamless database integrations (e.g. DynamoDB), database logic is decoupled from business logic:
- Code modules should access storage exclusively via interfaces (Repository Pattern).
- Example:
  ```typescript
  interface UserRepository {
    findById(id: string): Promise<User | null>;
    save(user: User): Promise<void>;
  }
  ```
- During local testing, we can inject a mock repository, while in production, we instantiate a `DynamoDBUserRepository` communicating with AWS DynamoDB tables using the `@aws-sdk/client-dynamodb` client.

---

## 4. Structured Logging & Monitoring

Logs are managed centrally via Winston (`src/config/logger.ts`):
- **Development Format**: Highly readable, colorized string format including request IDs.
- **Production Format**: Flat JSON lines output directly to `stdout`. Amazon CloudWatch automatically ingests stdout lines.
- **Correlation**: Every request receives a unique tracking ID (`x-request-id`) upon arrival. The logger appends this request ID to all log items triggered within that request loop.
