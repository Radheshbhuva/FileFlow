# Repository Design Pattern & Abstraction Layer

This document describes the design patterns used to decouple FileFlow's core business service logic from specific database persistence layers.

---

## 1. Design Overview

To support multi-cloud portability and permit rapid data layer migrations without code churn inside business services, we employ the **Repository Pattern** coupled with a central **Repository Registry** factory.

```
       +--------------------------------------------+
       |             Express Controllers            |
       +---------------------+----------------------+
                             |
                             v
       +---------------------+----------------------+
       |            Business Service Layer          |
       | (FileService, UserService, ShareService)   |
       +---------------------+----------------------+
                             |
                             | (Resolves via registry)
                             v
       +---------------------+----------------------+
       |             RepositoryRegistry             |
       +----------+----------------------+----------+
                  |                      |
      (DB_TYPE="memory")           (DB_TYPE="dynamodb")
                  |                      |
                  v                      v
       +----------+----------+ +---------+----------+
       |   InMemory Repository| | DynamoDB Repository |
       |     (Local Mock)    | |   (Production SDK)  |
       +---------------------+ +--------------------+
```

---

## 2. RepositoryRegistry Factory

The `RepositoryRegistry` class acts as the single source of truth for resolving repositories. All business services specify registry methods as their default constructor parameters:

```typescript
// Example: src/modules/files/services/file.service.ts
import { RepositoryRegistry } from '../../database/repositories/registry';

export class FileService {
  private fileRepository: FileRepository;
  
  constructor(
    fileRepository: FileRepository = RepositoryRegistry.getFileRepository()
  ) {
    this.fileRepository = fileRepository;
  }
}
```

This approach yields several architectural benefits:
- **Default Dependency Resolution**: Constructors automatically load the active database repository instance when called in the API routes.
- **Dependency Injection**: Test suites can explicitly pass custom mocks, stubs, or memory repository instances to verify behaviors offline.
- **Provider Swapping**: Changing the persistence provider requires zero changes inside the controller or service logic.

---

## 3. Supported Database Providers

The database type is resolved at startup using the `DB_TYPE` environment variable.

### 1. In-Memory Mock Provider (`DB_TYPE=memory` or undefined)
- Simulates standard database tables using local in-memory arrays.
- Emulates unique constraints, timestamps, and indexes in Node.js memory.
- Used for fast, zero-dependency offline unit tests and development checks.

### 2. AWS DynamoDB Provider (`DB_TYPE=dynamodb`)
- Communicates directly with Amazon DynamoDB using AWS SDK v3 Document Client commands.
- Implements single table partition key and sort key lookup conventions.
- Leverages Global Secondary Indexes (GSIs) to optimize query paths.
- PROJECTED structures map Date fields between ISO strings (DynamoDB format) and JavaScript `Date` objects.
