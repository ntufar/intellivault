import OpenAI from 'openai';
import { logger } from './logger';

export interface OpenAIConfig {
  apiKey: string;
  endpoint?: string;
  deploymentName?: string;
}

export interface EmbeddingRequest {
  input: string | string[];
  model?: string;
}

export interface EmbeddingResponse {
  data: Array<{
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface ChatRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenAIService {
  private client: OpenAI;
  private config: OpenAIConfig;
  private defaultEmbeddingModel: string;
  private defaultChatModel: string;

  constructor(config: OpenAIConfig) {
    this.config = config;
    this.defaultEmbeddingModel = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002';
    this.defaultChatModel = process.env.OPENAI_CHAT_MODEL || 'gpt-4';

    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.endpoint,
      defaultQuery: config.deploymentName ? { 'api-version': '2024-02-15-preview' } : undefined,
    });
  }

  // Generate embeddings for text
  async generateEmbeddings(
    input: string | string[],
    model?: string
  ): Promise<number[][]> {
    try {
      const request: EmbeddingRequest = {
        input,
        model: model || this.defaultEmbeddingModel,
      };

      const response = await this.client.embeddings.create(request);
      
      const embeddings = response.data.map(item => item.embedding);
      
      logger.debug('Embeddings generated', {
        inputCount: Array.isArray(input) ? input.length : 1,
        model: response.model,
        usage: response.usage,
      });

      return embeddings;
    } catch (error) {
      logger.error('Failed to generate embeddings', { 
        inputType: Array.isArray(input) ? 'array' : 'string',
        inputLength: Array.isArray(input) ? input.length : input.length,
        model,
        error 
      });
      throw error;
    }
  }

  // Generate a single embedding for text
  async generateEmbedding(text: string, model?: string): Promise<number[]> {
    const embeddings = await this.generateEmbeddings(text, model);
    return embeddings[0];
  }

  // Chat completion for Q&A and summarization
  async chatCompletion(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: {
      model?: string;
      temperature?: number;
      max_tokens?: number;
      stream?: boolean;
    }
  ): Promise<ChatResponse> {
    try {
      const request: ChatRequest = {
        messages,
        model: options?.model || this.defaultChatModel,
        temperature: options?.temperature || 0.7,
        max_tokens: options?.max_tokens || 1000,
        stream: options?.stream || false,
      };

      const response = await this.client.chat.completions.create(request);
      
      logger.debug('Chat completion generated', {
        model: response.model,
        messageCount: messages.length,
        usage: response.usage,
        finishReason: response.choices[0]?.finish_reason,
      });

      return response as ChatResponse;
    } catch (error) {
      logger.error('Failed to generate chat completion', { 
        messageCount: messages.length,
        model: options?.model,
        error 
      });
      throw error;
    }
  }

  // Summarize document content
  async summarizeDocument(
    content: string,
    context?: string
  ): Promise<string> {
    try {
      const systemPrompt = `You are an AI assistant that creates concise, accurate summaries of documents. 
Focus on the key points, main arguments, and important details. Keep the summary clear and well-structured.`;

      const userPrompt = context 
        ? `Please summarize the following document content. Context: ${context}\n\nDocument content:\n${content}`
        : `Please summarize the following document content:\n${content}`;

      const response = await this.chatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ], {
        temperature: 0.3,
        max_tokens: 500,
      });

      const summary = response.choices[0]?.message?.content || '';
      
      logger.debug('Document summarized', {
        contentLength: content.length,
        summaryLength: summary.length,
        hasContext: !!context,
      });

      return summary;
    } catch (error) {
      logger.error('Failed to summarize document', { 
        contentLength: content.length,
        hasContext: !!context,
        error 
      });
      throw error;
    }
  }

  // Answer question with context
  async answerQuestion(
    question: string,
    context: string,
    includeCitations: boolean = true
  ): Promise<{ answer: string; citations?: string[] }> {
    try {
      const systemPrompt = `You are an AI assistant that answers questions based on provided context. 
Be accurate and only use information from the provided context. If the answer isn't in the context, say so clearly.
${includeCitations ? 'When possible, cite specific parts of the context that support your answer.' : ''}`;

      const userPrompt = `Context:\n${context}\n\nQuestion: ${question}`;

      const response = await this.chatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ], {
        temperature: 0.3,
        max_tokens: 800,
      });

      const answer = response.choices[0]?.message?.content || '';
      
      logger.debug('Question answered', {
        questionLength: question.length,
        contextLength: context.length,
        answerLength: answer.length,
        includeCitations,
      });

      const result: { answer: string; citations?: string[] } = { answer };

      if (includeCitations) {
        // Simple citation extraction - look for patterns like [1], [2], etc.
        const citationMatches = answer.match(/\[\d+\]/g);
        if (citationMatches) {
          result.citations = [...new Set(citationMatches)];
        }
      }

      return result;
    } catch (error) {
      logger.error('Failed to answer question', { 
        questionLength: question.length,
        contextLength: context.length,
        includeCitations,
        error 
      });
      throw error;
    }
  }

  // Extract entities from text using NER
  async extractEntities(
    text: string,
    entityTypes: string[] = ['person', 'organization', 'location', 'date', 'money']
  ): Promise<Array<{ text: string; label: string; start: number; end: number }>> {
    try {
      const systemPrompt = `You are an AI assistant that extracts named entities from text. 
Return the entities in JSON format as an array of objects with: text, label, start, end.
Entity types to extract: ${entityTypes.join(', ')}.
For each entity, provide the exact text, its type/label, and character positions (start/end).`;

      const userPrompt = `Extract entities from this text:\n${text}`;

      const response = await this.chatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ], {
        temperature: 0.1,
        max_tokens: 1000,
      });

      const result = response.choices[0]?.message?.content || '[]';
      
      try {
        const entities = JSON.parse(result);
        
        logger.debug('Entities extracted', {
          textLength: text.length,
          entityCount: entities.length,
          entityTypes,
        });

        return entities;
      } catch (parseError) {
        logger.warn('Failed to parse entity extraction result', { 
          result,
          parseError 
        });
        return [];
      }
    } catch (error) {
      logger.error('Failed to extract entities', { 
        textLength: text.length,
        entityTypes,
        error 
      });
      throw error;
    }
  }

  // Batch process embeddings for efficiency
  async batchEmbeddings(
    texts: string[],
    batchSize: number = 100,
    model?: string
  ): Promise<number[][]> {
    const results: number[][] = [];
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchEmbeddings = await this.generateEmbeddings(batch, model);
      results.push(...batchEmbeddings);
      
      logger.debug('Processed embedding batch', {
        batchIndex: Math.floor(i / batchSize),
        batchSize: batch.length,
        totalProcessed: Math.min(i + batchSize, texts.length),
        totalTexts: texts.length,
      });
    }

    return results;
  }
}

// Global instance
let openAIService: OpenAIService | null = null;

export function getOpenAIService(): OpenAIService {
  if (!openAIService) {
    const config: OpenAIConfig = {
      apiKey: process.env.OPENAI_API_KEY || '',
      endpoint: process.env.OPENAI_ENDPOINT,
      deploymentName: process.env.OPENAI_DEPLOYMENT_NAME,
    };
    openAIService = new OpenAIService(config);
  }
  return openAIService;
}

export async function initializeOpenAI(): Promise<void> {
  const service = getOpenAIService();
  // Test the connection
  try {
    await service.generateEmbedding('test');
    logger.info('OpenAI service initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize OpenAI service', { error });
    throw error;
  }
}
