import { File } from '../../files/interfaces/file.interface';
import { CollectionSummaryItem } from '../../collections/interfaces/collection.interface';

export interface SearchQueryFilters {
  fileType?: string;
  startDate?: Date;
  endDate?: Date;
  minSize?: number;
  maxSize?: number;
  favorite?: boolean;
  shareStatus?: 'PRIVATE' | 'SHARED';
  minSecurityScore?: number;
  maxSecurityScore?: number;
  owner?: string;
  collectionType?: 'recently-modified' | 'shared-recently' | 'favorites' | 'large-files' | 'needs-attention';
}

export type SearchSortField =
  | 'relevance'
  | 'recently_modified'
  | 'recently_uploaded'
  | 'file_size'
  | 'most_shared'
  | 'most_downloaded'
  | 'alphabetical';

export interface SearchQueryOptions {
  query?: string;
  filters?: SearchQueryFilters;
  sort?: {
    field?: SearchSortField;
    order?: 'asc' | 'desc';
  };
  page?: number;
  limit?: number;
}

export interface SearchHistoryRecord {
  id: string;
  userId: string;
  query: string;
  frequency: number;
  lastSearchedAt: Date;
  createdAt: Date;
}

export interface SearchSuggestionsResult {
  recentSearches: string[];
  popularSearches: Array<{ query: string; frequency: number }>;
  suggestedFiles: File[];
  suggestedCollections: CollectionSummaryItem[];
}

export interface DiscoveryResults {
  recentlyModified: File[];
  frequentlyAccessed: File[];
  recentlyShared: File[];
  favorites: File[];
  largeFiles: File[];
  needsAttention: File[];
}

export interface SearchAnalyticsSummary {
  totalSearches: number;
  searchFrequency: Record<string, number>;
  topQueries: Array<{ query: string; frequency: number }>;
  failedSearches: Array<{ query: string; reason: string; timestamp: Date }>;
  searchTrends: Array<{ date: string; count: number }>;
}

// =========================================================================
// Future AI & AWS OpenSearch Readiness (Contracts and Configuration Types)
// =========================================================================

export interface VectorQuery {
  vector: number[];
  topK: number;
  distanceMetric: 'COSINE' | 'EUCLIDEAN' | 'DOT_PRODUCT';
  filters?: SearchQueryFilters;
}

export interface VectorSearchResult<T> {
  item: T;
  score: number; // Similarity/distance score
}

/**
 * Interface contract for Vector Database implementations (e.g. Pinecone, Milvus, pgvector).
 */
export interface VectorSearchEngine {
  upsertVector(id: string, vector: number[], metadata: Record<string, any>): Promise<void>;
  queryVector(query: VectorQuery): Promise<Array<VectorSearchResult<any>>>;
  deleteVector(id: string): Promise<void>;
}

/**
 * Interface contract for Enterprise Full-Text Search Indices (e.g. AWS OpenSearch, Elasticsearch).
 */
export interface SearchIndexEngine {
  indexDocument(index: string, id: string, doc: Record<string, any>): Promise<void>;
  updateDocument(index: string, id: string, doc: Partial<Record<string, any>>): Promise<void>;
  deleteDocument(index: string, id: string): Promise<void>;
  searchIndex(index: string, dslQuery: Record<string, any>): Promise<any>;
}
