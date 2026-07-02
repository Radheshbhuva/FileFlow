# FileFlow Backend Folder Structure

This document details the layout of the `backend/` directory, mapping the purpose and responsibilities of each module.

---

## Directory Mapping

```text
backend/
├── dist/                     # Compiled JavaScript files (build target)
├── docs/                     # Architectural, guideline, and structural docs
│   ├── backend-architecture.md
│   ├── api-guidelines.md
│   └── folder-structure.md
├── node_modules/             # Node packages
├── src/                      # TypeScript source files
│   ├── app.ts                # Express application configuration
│   ├── server.ts             # Main entry point (HTTP listener & bootstrap)
│   ├── config/               # Global configurations (env, logger)
│   │   ├── env.ts            # Environment validations
│   │   └── logger.ts         # Central Winston logging
│   ├── constants/            # Global Constants (status codes, strings)
│   ├── controllers/          # HTTP controllers parsing req & calling services
│   ├── interfaces/           # Global interfaces
│   ├── middleware/           # Express middleware (error, validation, tracing)
│   │   ├── error.middleware.ts
│   │   ├── rate-limit.middleware.ts
│   │   ├── request-id.middleware.ts
│   │   ├── request-logger.middleware.ts
│   │   └── validation.middleware.ts
│   ├── modules/              # Context-bounded business modules
│   ├── repositories/         # Storage layer abstractions (e.g. User db repository)
│   ├── routes/               # Express routing layers
│   │   ├── index.ts          # Root API router
│   │   └── v1/               # Version 1 aggregated routers
│   │       ├── index.ts
│   │       └── health.routes.ts
│   ├── services/             # Core business rules logic layer
│   ├── types/                # Ambient and custom typescript declarations
│   │   └── express.d.ts      # Custom type extensions for Express
│   ├── utils/                # General utility classes (e.g., AppError)
│   │   └── app-error.ts
│   └── validators/           # Zod validation schemas
├── tests/                    # Integration and unit tests
└── package.json              # Script directives and dependencies
```

---

## Directory Roles & Design Patterns

### 1. Presentation & Routing Layer (`routes/`, `controllers/`, `validators/`)
- **`validators/`**: Defines Zod validation schemas for requests.
- **`routes/`**: Binds schemas, middleware, and controller execution to URLs.
- **`controllers/`**: Extracts parameters from the request, forwards them to the service layer, and writes standardized HTTP payloads back to the response.

### 2. Business Logic Layer (`services/`, `modules/`)
- Contains domain logic, calculations, and integrations (Cognito parsing, Cognito signups, file sharing logic).
- Services do NOT have direct access to Express request/response parameters, making them reusable across multiple trigger patterns (such as CLI tasks or Direct Lambda handlers).

### 3. Data Access Layer (`repositories/`)
- Interfaces that define how metadata, files, and users are stored and fetched.
- Business services interact exclusively with repositories via interfaces, allowing the system to swap out database adapters without changes to core business flows.
