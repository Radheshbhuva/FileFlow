# FileFlow Future AI Integration Roadmap

This document outlines the type schemas, mock service methods, and integration checkpoints built into FileFlow V1 to support upcoming AI-driven classifications without breaking core systems.

---

## 1. Interface Schemas & Mock Responses

The following contracts are prepared to integrate vector embeddings, recommendation engines, and usage analytics:

### 1. AI Recommended Files (`AIRecommendedFile`)
- **Use Case**: Collaborative filtering showing documents recommended based on co-workers' actions or similar project activities.
- **Trigger heuristic**: High vector proximity of file metadata or department engagement spikes.
- **Contract**:
  ```typescript
  export interface AIRecommendedFile {
    fileId: string;
    fileName: string;
    recommendationReason: string; // E.g., "Modified by Y working on similar task Z"
    confidenceScore: number;       // Value between 0.00 and 1.00
    recommendedAt: Date;
  }
  ```

### 2. Frequently Accessed (`FrequentlyAccessedFile`)
- **Use Case**: Analyzes usage velocity (access velocity spikes) to pin active files to the user's dashboard.
- **Contract**:
  ```typescript
  export interface FrequentlyAccessedFile {
    fileId: string;
    fileName: string;
    accessCount: number;
    lastAccessTime: Date;
  }
  ```

### 3. Archive Candidates (`ArchiveCandidate`)
- **Use Case**: Identifies cold files that have high storage sizes and are candidates for archiving to S3 Glacier.
- **Contract**:
  ```typescript
  export interface ArchiveCandidate {
    fileId: string;
    fileName: string;
    lastAccessedAt: Date;
    estimatedStorageSavings: number; // Size in bytes
    archivalReason: string;          // E.g., "Unused for 90+ days"
  }
  ```

### 4. Security Risk Candidates (`SecurityRiskCandidate`)
- **Use Case**: Flags abnormal download rates (spikes) or suspicious filenames containing credit cards/API keys.
- **Contract**:
  ```typescript
  export interface SecurityRiskCandidate {
    fileId: string;
    fileName: string;
    riskType: string;  // E.g., "SUSPICIOUS_CONTENT", "DOWNLOAD_ANOMALY"
    riskScore: number; // Value from 0 to 100
  }
  ```

### 5. Team Hot Files (`TeamHotFile`)
- **Use Case**: Collaborative hot-lists displaying files with the highest velocity across the user's department.
- **Contract**:
  ```typescript
  export interface TeamHotFile {
    fileId: string;
    fileName: string;
    activityVelocity: number; // Actions/shares per hour
    departmentId?: string;
  }
  ```

---

## 2. API Integration Strategy

Once a semantic embedding engine (e.g., Pinecone or AWS Kendra) or collaborative filter is deployed:
1. Re-route the controller calls from the mock service layer to query the AI inference server.
2. The REST signatures on `/api/v1/collections/ai-recommendations`, `/api/v1/collections/frequently-accessed`, `/api/v1/collections/archive-candidates`, `/api/v1/collections/security-risks`, and `/api/v1/collections/team-hot-files` will remain identical, preventing frontend breaking updates.
