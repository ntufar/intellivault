export type SearchResult = {
  documentId: string;
  chunkIndex: number;
  score: number;
  text: string;
  source: { documentId: string; chunkIndex: number };
};

export class SearchService {
  public async semanticSearch(query: string, k: number): Promise<SearchResult[]> {
    // Stub returning empty for now. Integration will call Azure AI Search.
    if (!query || k <= 0) return [];
    return [];
  }
}


