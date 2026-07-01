# FileFlow Dashboard Command Center: Features & Functional Analysis

This document provides a comprehensive analysis of the flagship **FileFlow Command Center Dashboard**, outlining all active user flows, data connections, UX components, and real-time functionalities.

---

## 1. Real-Time Centralized Database Layer

The dashboard operates as the central intelligence hub of FileFlow. All operations on other pages sync immediately to the dashboard in real-time via global Zustand stores, with **zero page refreshes**:

* **[profileStore](file:///c:/House%20of%20Growth/Zero-Cost%20AWS%20Projects/aws-file-sharing-system-1/frontend/src/stores/profileStore.ts)**: Persists user details and initials.
* **[fileStore](file:///c:/House%20of%20Growth/Zero-Cost%20AWS%20Projects/aws-file-sharing-system-1/frontend/src/stores/fileStore.ts)**: Central database of files, favorites, and security variables.
* **[uploadsStore](file:///c:/House%20of%20Growth/Zero-Cost%20AWS%20Projects/aws-file-sharing-system-1/frontend/src/stores/uploadsStore.ts)**: Coordinates active S3 upload progress lines.
* **[sharesStore](file:///c:/House%20of%20Growth/Zero-Cost%20AWS%20Projects/aws-file-sharing-system-1/frontend/src/stores/sharesStore.ts)**: Tracks shared access parameters.
* **[notificationsStore](file:///c:/House%20of%20Growth/Zero-Cost%20AWS%20Projects/aws-file-sharing-system-1/frontend/src/stores/notificationsStore.ts)**: Manages alerts and unread counts.
* **[activityStore](file:///c:/House%20of%20Growth/Zero-Cost%20AWS%20Projects/aws-file-sharing-system-1/frontend/src/stores/activityStore.ts)**: Logs workspace events chronologically.

---

## 2. Feature & Functionality Breakdown

### 📊 Dynamic Metrics Overview
* **Interactive KPI Cards**: Six cards displaying real-time metrics with trend calculations:
  * **Files Count**: Total files with a weekly increment trend (e.g. `+2 this week`).
  * **Storage Capacity**: Total capacity consumed (in GB) against plan limits (5 GB) with capacity trends.
  * **Active Shares**: Number of shared files, highlighting upcoming link expirations (e.g. `1 expiring soon`).
  * **Favorites**: Star count showing pinned files.
  * **Requires Attention**: Critical security warning count (flagging files with scores < 70).
  * **Recently Modified**: Active files modified within the last 7 days.
* **Micro SVG Sparklines**: Each card renders a dynamic SVG line chart displaying mock metrics fluctuations.

### 🛡️ Security Dashboard (Visual Priority 1 & 2)
* **Safety Index circular gauge**: Displays the average security score of all files in the workspace (color-coded: Green $\ge$ 90, Sky $\ge$ 70, Amber/Rose < 70).
* **Scope counts**: Summarizes public share links and expiring link items.
* **Risk Factor Breakdown**: Segmented bar chart representing risk dimensions (Encryption vs. Permissions vs. Expirations) to guide audits.
* **Needs Attention alert panel**: Banners files with security scores < 70. Displays details of the vulnerability (e.g. `Unencrypted API credentials`) and links directly to the file details panel.

### ⏱️ Timeline Activity Feed (Visual Priority 3)
* **Chronological audit log**: Shows timeline dots representing operations (Uploads, Shares, Downloads, Deletions, Profile edits).
* **View More expansion**: Renders the top 4 activities by default to preserve vertical space, with a "View Older Activities" button simulating paginated scroll.
* **Infinite Scroll hook**: Placeholder logs ready to load older historical database chunks.

### 🔗 File Shares Manager (Visual Priority 4)
* **Active share items**: Lists links created for external collaboration.
* **Status Badges**: Indicators for link availability (`Active`, `Expired`, `Revoked`).
* **One-Click copy**: Fast copy button to grab target URLs to the clipboard.
* **Redirection Link**: Leads to the Shared Links management page.

### 💾 Storage Intelligence (Visual Priority 5)
* **Multi-segmented Progress Bar**: Graphically displays storage consumption divided by category type (PDF, Images, Spreadsheets, Documents, Archives, Text, etc.).
* **Category density lists**: Details storage sizes and files count for each file category.
* **Ranked top files list**: Lists the 3 largest files by size to identify items for potential cleanup.

### 💡 Productivity Insights (Visual Priority 6)
* **Accessed/Stale Tabs Switcher**:
  * **Popular**: Rank-ordered list of files based on download activity.
  * **Shared**: Files with high share link counts.
  * **Stale (Unused)**: Filters files with zero downloads and modified over 14 days ago for cleanups.

### ⚡ Quick Actions Hub (Visual Priority 7)
* **Shortcut Action Tiles**: Bento tiles linking to primary platform areas: `Upload Files`, `View Files`, `Shared Links`, `Edit Profile`, `Favorites`, and `Security Issues`.
* **Micro-interactions**: Hover effects (scaling/translating icons, color transitions) and accessibility features (keyboard tab index focus outlines, Enter/Space key listeners).

### 🔔 System Alert Drawer
* **Unread Alert Counter**: Renders counts on header notification icons and the alert card.
* **Alert dismiss actions**: Clicking items marks them as read, and includes a "Mark all read" quick toggle.

---

## 3. Sidebar Layout & Grid Specifications

* **Visual Hierarchy placement**: The columns stack and order layouts by priority:
  ```mermaid
  graph TD
      A[Main Column] --> B[Security Dashboard / Attention alerts]
      A --> C[Workspace Activity Timeline]
      A --> D[Active File Shares]
      A --> E[Recent Upload Activity]
      F[Sidebar Column] --> G[Quick Actions Hub]
      F --> H[Storage segment progress]
      F --> I[Productivity tabs Popular/Stale]
      F --> J[System Alerts Notifications]
  ```
* **CSS Grid system**: Designed with auto-fit content-aware heights (`height: auto`). Columns adjust from a two-column desktop template down to a single-column layout on mobile.
