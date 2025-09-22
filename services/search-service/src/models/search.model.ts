export interface SearchFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'in' | 'between';
  value: any;
}

export interface SortOption {
  field: string;
  order: 'asc' | 'desc';
}

export interface SearchRequest {
  query: string;
  filters?: SearchFilter[];
  facets?: string[];
  sort?: SortOption[];
  page?: number;
  pageSize?: number;
  searchType: 'semantic' | 'keyword' | 'hybrid';
  minScore?: number;
}

export interface SearchResult {
  id: string;
  score: number;
  document: {
    title: string;
    summary: string;
    metadata: Record<string, any>;
  };
  highlights: {
    field: string;
    fragments: string[];
  }[];
  vectors: {
    similarity: number;
    model: string;
  };
}

export interface FacetValue {
  value: string;
  count: number;
}

export interface FacetResult {
  field: string;
  values: FacetValue[];
}

export interface SearchTiming {
  total: number;
  search: number;
  rank: number;
}

export interface SearchResponse {
  results: SearchResult[];
  facets: FacetResult[];
  total: number;
  page: number;
  pageSize: number;
  timing: SearchTiming;
}

export interface SimilarDocumentsOptions {
  limit?: number;
  minScore?: number;
  includeContent?: boolean;
}

export interface SimilarDocument {
  id: string;
  similarity: number;
  document: {
    title: string;
    summary?: string;
    content?: string;
  };
}

export interface SimilarDocumentsResponse {
  results: SimilarDocument[];
}