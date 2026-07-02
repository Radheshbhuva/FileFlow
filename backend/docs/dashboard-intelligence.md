# FileFlow Dashboard Intelligence & Insights Spec

This document details the calculations, aggregations, and recommendations rules generated dynamically by the Dashboard Intelligence Module.

---

## 1. Storage Intelligence calculations

- **Usage Percentage**:
  - Computed from user storage limits:
    $$\text{Usage \%} = \frac{\text{storageUsed}}{\text{storageLimit}} \times 100$$
- **File Type Distribution**:
  - Scans user files, groups by the extension, and maps the total count and aggregate bytes size per type:
    ```json
    { "extension": "pdf", "count": 12, "bytes": 125829120 }
    ```
- **Historical Snapshot Trends**:
  - Filters and aggregates files uploaded up to month boundaries (simulating a rolling 6-month historical line chart).

---

## 2. Security Intelligence calculations

- **Risk Levels**:
  - **LOW**: Average security score $\ge 80$.
  - **MEDIUM**: Average security score $\ge 50$.
  - **HIGH**: Average security score $< 50$.
- **Aggregated Security Breakdown**:
  - `averageFileSecurityScore`: average score of files.
  - `shareSecurityScore`: active link safety component. Subtracts 15 points for each unprotected link, 10 points for each infinite link, and 5 points for each unlimited downloads link.
  - `workspaceSecurityScore`: Weighted average score:
    $$\text{Score} = (0.6 \times \text{File Score}) + (0.4 \times \text{Share Score})$$

---

## 3. Dynamic Alerts & Recommendations Engine

The system evaluates the workspace state to construct actionable alerts:

| Risk Trigger | Actionable Recommendation | Alert Severity |
|---|---|---|
| Unprotected active shares exist | `"Add passwords to X unprotected active sharing links."` | `WARNING` |
| Infinite active shares exist | `"Configure expiration dates on Y active sharing links."` | `WARNING` |
| Low file security scores exist (<70) | `"Review Z files with vulnerable ratings."` | `WARNING` |
| Storage usage $\ge 75\%$ | `"Your storage is running low. Upgrade your plan."` | `WARNING` |
| Storage usage $\ge 90\%$ | `"Storage limit exhausted. Upgrade immediately."` | `CRITICAL` |
| Extremely low security file (<50) | `"Vulnerable files detected. Review them now."` | `CRITICAL` |
