export type QAAnswer = {
  answer: string;
  citations: Array<{ documentId: string; chunkIndex: number; snippet: string }>;
};

export class QAService {
  public async answer(question: string): Promise<QAAnswer> {
    // Stub implementation; will integrate RAG later
    return { answer: "", citations: [] };
  }
}


