import { z } from "zod";

export const ChunkingOptionsSchema = z.object({
  maxTokensPerChunk: z.number().int().positive().default(800),
  overlapTokens: z.number().int().nonnegative().default(100),
});
export type ChunkingOptions = z.infer<typeof ChunkingOptionsSchema>;

export class ChunkingService {
  public chunkText(text: string, options?: Partial<ChunkingOptions>): string[] {
    const { maxTokensPerChunk, overlapTokens } = {
      maxTokensPerChunk: 800,
      overlapTokens: 100,
      ...options,
    };
    if (text.length === 0) return [];
    const chunks: string[] = [];
    let start = 0;
    while (start < text.length) {
      const end = Math.min(text.length, start + maxTokensPerChunk);
      const chunk = text.slice(start, end);
      chunks.push(chunk);
      if (end === text.length) break;
      start = Math.max(0, end - overlapTokens);
    }
    return chunks;
  }
}

export class EmbeddingService {
  public async embed(texts: string[]): Promise<number[][]> {
    // Stub for Azure OpenAI embeddings. Deterministic placeholder for tests.
    return texts.map((t) => this.fakeEmbedding(t));
  }

  private fakeEmbedding(text: string): number[] {
    const length = 1536;
    const arr = new Array<number>(length).fill(0);
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
    }
    for (let i = 0; i < length; i++) {
      arr[i] = ((hash + i) % 1000) / 1000;
    }
    return arr;
  }
}


