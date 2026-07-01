# Smart Collections Classification Rules Specification

This document outlines the programmatic triggers and thresholds governing FileFlow's dynamic collections engine.

---

## 1. Recently Modified Heuristic
- **Trigger Condition**:
  - File status must be `ACTIVE`.
  - The difference between `now` and the file's `updatedAt` date must be less than or equal to the target window $N$ (default: 7 days):
    $$\text{now} - \text{updatedAt} \le N \times 86400 \text{ seconds}$$

---

## 2. Shared Recently Heuristic
- **Trigger Condition**:
  - A file must possess at least one corresponding active share link (`shareStatus === 'ACTIVE'`) whose `updatedAt` date falls within the target window $M$ (default: 30 days):
    $$\text{now} - \text{share.updatedAt} \le M \times 86400 \text{ seconds}$$
  - Files matching this query return aggregated metrics:
    - `shareCount`: Total count of active and inactive shares of this file.
    - `downloadCount`: Sum of downloads across all shares of this file.
    - `lastSharedDate`: Most recent `createdAt` date from matching shares.

---

## 3. Favorites & Activity Heuristic
- **Trigger Condition**:
  - File status is `ACTIVE` and `favorite === true`.
  - Extract the 10 most recent activity logs for this user matching type `FILE_FAVORITED` or `FILE_UNFAVORITED` to chart favorite-actions velocity.

---

## 4. Large Files Heuristic
- **Trigger Condition**:
  - File status is `ACTIVE` and size is greater than or equal to threshold $T$ in bytes (default: 100 MB / 104,857,600 bytes):
    $$\text{fileSize} \ge T \times 1024 \times 1024 \text{ bytes}$$
  - Storage impact is calculated relative to the user's limit:
    $$\text{Storage Impact (\%)} = \frac{\text{fileSize}}{\text{storageLimit}} \times 100$$

---

## 5. Needs Attention Flag Triggers
Any file matching one or more of the following five distinct triggers is listed in the Needs Attention collection:

| Code Trigger | Logic Condition | Severity |
|---|---|---|
| **`LOW_SECURITY_SCORE`** | `file.securityScore < 70` | `MEDIUM` |
| **`UNPROTECTED_SHARE`** | Active share with `passwordProtected === false` and `expiryDate === null` / undefined | `MEDIUM` |
| **`INACTIVE_FILE`** | `status === 'ACTIVE'`, last modified > 30 days ago, and total downloads across shares is 0 | `LOW` |
| **`HIGH_RISK_SHARE`** | Unprotected share AND (no expiry OR downloads >= maxLimit OR file is script/executable with score < 50) | `HIGH` |
| **`EXECUTABLE_RISK`** | File extension is executable (`exe`, `bat`, `cmd`, `sh`, `msi`) and `securityScore < 60` | `HIGH` |

### Needs Attention Risk Level Sorting
Files are sorted by risk priority:
1. **`HIGH`**: Set if any trigger reasons are `EXECUTABLE_RISK`, `HIGH_RISK_SHARE`, or if the file's individual `securityScore < 50`.
2. **`MEDIUM`**: Set if trigger reasons include `LOW_SECURITY_SCORE` or `UNPROTECTED_SHARE`.
3. **`LOW`**: Set if the file only matches the `INACTIVE_FILE` trigger.
