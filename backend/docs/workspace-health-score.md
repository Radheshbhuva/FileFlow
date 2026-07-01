# FileFlow Workspace Health Score Specification

The **Workspace Health Score** is a dynamic metric (from 0 to 100) representing the overall status, safety, and efficiency of a user's workspace.

---

## 1. Weighted Components

The score is calculated from four core components:

```
[Workspace Health Score: 0-100]
 ├── Security Component (40% Weight)
 ├── Storage component (25% Weight)
 ├── Share Hygiene component (20% Weight)
 └── Activity Health component (15% Weight)
```

$$\text{Health Score} = (0.4 \times S_c) + (0.25 \times St_c) + (0.2 \times Sh_c) + (0.15 \times A_c)$$

---

## 2. Component Equations

### 1. Security Component ($S_c$)
- **Goal**: Measures file safety.
- **Equation**: Average security score of all files.
- **Null State**: Default to `100` if no files are uploaded.

### 2. Storage Component ($St_c$)
- **Goal**: Measures storage capacity risk.
- **Equation**:
  $$St_c = \max(0, 100 - \text{Usage \%})$$
  *E.g. if the user consumes 90% of their quota, $St_c$ drops to 10 points.*

### 3. Share Hygiene Component ($Sh_c$)
- **Goal**: Measures public link exposure risk.
- **Equation**: Start at 100. For each active share:
  - Deduct `15` points if it has no password locks.
  - Deduct `10` points if it has no expiration rule.
  - Deduct `5` points if it has no download limits.
  - Deduct total penalty divided by active share count, clamped between 0 and 100.

### 4. Activity Health Component ($A_c$)
- **Goal**: Measures system execution stability.
- **Equation**: Start at 100. Deduct `15` points for each `CRITICAL` severity activity or `UPLOAD_FAILED` activity logged in the past 7 days. Clamped between 0 and 100.
