export type ExtractedEntity = { type: string; value: string };

export class EntityService {
  public async extract(text: string): Promise<ExtractedEntity[]> {
    // Stub NER implementation; will integrate with OpenAI later
    return [];
  }
}


