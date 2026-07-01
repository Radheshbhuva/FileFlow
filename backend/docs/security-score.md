# FileFlow Security Score Calculation Engine

FileFlow evaluates a unique **Security Score** for every registered file. This score acts as an indicators of security risk, public exposure, and malware profile boundaries.

---

## 1. Scoring Weights and Rules

The calculation starting baseline is **`100`** points (perfect score). Penalties are applied based on criteria:

### A. Executable File Type Penalties (`-40` Points)
Executables present execution risks (malware, scripts, installation scripts).
- **Target Extensions**: `.exe`, `.bat`, `.sh`, `.cmd`, `.vbs`, `.js`, `.msi`, `.scr`.
- **Score Impact**: Base score is restricted to `60` points before other factors are checked.

### B. Compression File Type Penalties (`-15` Points)
Zip/tar bundles can hide viruses, script injections, or bypass standard extension scanners.
- **Target Extensions**: `.zip`, `.rar`, `.tar`, `.7z`, `.gz`.
- **Score Impact**: Restricts initial score to `85` points.

### C. Public Exposure Penalties (`-15` Points)
When `shareStatus` is set to `SHARED`, the file is accessible publically, creating threat vectors.
- **Score Impact**: Deducts `15` points.
- **Dynamic Scoring**: The score is automatically recalculated when a user toggles the share status from `PRIVATE` to `SHARED` (and vice-versa).

### D. Large File Penalties (`-10` Points)
Files larger than 250 MB receive a penalty because of bandwidth consumption, denial-of-service risks, or data leak vulnerability scopes.
- **Score Impact**: Deducts `10` points.

---

## 2. Risk Level Categorization

The final score translates directly into a user-friendly Risk Level:

| Score Range | Risk Level | Dashboard Color | Action Required |
| :--- | :--- | :--- | :--- |
| **`80 - 100`** | **`LOW`** | Green | File is private and safe. |
| **`50 - 79`** | **`MEDIUM`** | Yellow | File is shared or compressed. Review links. |
| **`0 - 49`** | **`HIGH`** | Red | High execution risk or public executable. Restrict access. |

---

## 3. Dynamic Score Lifecycle

```text
+-------------------+     Recalculate     +--------------------------+
|  File Registered  |-------------------->| Evaluate Ext / Size /   |
|  (Initial Score)  |                     | Share Status             |
+-------------------+                     +--------------------------+
          |                                            |
          | (User toggles public sharing)              |
          ▼                                            ▼
+-------------------+                     +--------------------------+
|  PATCH /files/:id |-------------------->| Deduct 15 pts if Shared  |
|  (Update share)   |                     | Grant 15 pts if Private  |
+-------------------+                     +--------------------------+
```
This dynamic update loop ensures the user's dashboard is always accurate, reflecting actual security exposure in real time.
