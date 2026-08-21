export interface GenerationChunk {
  delta: string;
  done: boolean;
}

export interface IGenerationProvider {
  readonly modelName: string;
  generate(
    systemPrompt: string,
    userPrompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      frequencyPenalty?: number;
      presencePenalty?: number;
      stopSequences?: string[];
    }
  ): Promise<string>;
  generateStream(
    systemPrompt: string,
    userPrompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      frequencyPenalty?: number;
      presencePenalty?: number;
      stopSequences?: string[];
      onDelta?: (delta: string) => void;
    }
  ): Promise<AsyncIterable<GenerationChunk>>;
  healthCheck(): Promise<boolean>;
}
