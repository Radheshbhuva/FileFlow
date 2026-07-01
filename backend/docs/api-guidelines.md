# FileFlow API Development Guidelines

This document outlines the standard guidelines, conventions, and practices for developing endpoints, handling requests, and formatting API responses for FileFlow.

---

## 1. Response Formats

All API endpoints must return a standardized JSON structure:

### Success Responses (2xx)
```json
{
  "success": true,
  "message": "User profile retrieved successfully.",
  "data": {
    "id": "usr_9028",
    "name": "Jane Doe",
    "email": "jane@fileflow.com"
  }
}
```

### Error Responses (4xx, 5xx)
```json
{
  "success": false,
  "message": "Validation Failed",
  "errors": [
    {
      "field": "body.email",
      "message": "Invalid email address formatting"
    }
  ]
}
```

---

## 2. Validation Patterns (Zod)

Never process raw incoming data. Always validate payloads using Zod schemas and register the schema with the `validate` middleware:

1. **Define Schema**: Create a validator schema in `src/validators/`:
   ```typescript
   import { z } from 'zod';

   export const createUserSchema = {
     body: z.object({
       name: z.string().min(2, 'Name must be at least 2 characters'),
       email: z.string().email('Invalid email format'),
     }),
   };
   ```

2. **Register with Router**: Import and apply `validate` middleware in your routing layer:
   ```typescript
   import { Router } from 'express';
   import { validate } from '../../middleware/validation.middleware';
   import { createUserSchema } from '../../validators/user.validators';
   import { createUserController } from '../../controllers/user.controllers';

   const router = Router();
   router.post('/', validate(createUserSchema), createUserController);
   ```

---

## 3. Error Handling Guidelines

Do not send direct HTTP responses from internal services or database query blocks. Instead, throw a subclass of `AppError`:

| Error Class | HTTP Code | Use Case |
| :--- | :--- | :--- |
| `BadRequestError` | 400 | Invalid payload arguments or bad business operations |
| `ValidationError` | 400 | Express query/params/body validation failures (handled automatically by `validate`) |
| `UnauthorizedError` | 401 | Missing or invalid auth tokens |
| `ForbiddenError` | 403 | Authenticated user lacks permission to access the resource |
| `NotFoundError` | 404 | Resource does not exist |
| `ConflictError` | 409 | Duplicate resource entry conflicts (e.g., duplicate email registration) |
| `InternalServerError` | 500 | System failures (thrown automatically by error boundary for uncaught faults) |

Example of throwing an error:
```typescript
if (!userExists) {
  throw new NotFoundError('User account not found');
}
```

---

## 4. API Versioning

API routing uses strict versioning to prevent breaking changes:
- Default version: `/api/v1/...`
- Core routing file `src/routes/index.ts` delegates requests:
  - `/api/v1` mounts to `src/routes/v1/index.ts`
- Future v2 features can be isolated within `src/routes/v2/index.ts` and mapped under `/api/v2`.
- Avoid mixing version routes inside controller handlers. Keep controller parameters generic.
