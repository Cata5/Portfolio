export interface IRerankerProvider {
  readonly modelName: string;
  rerank(
    query: string,
    candidates: { id: string; text: string }[],
    topK?: number
  ): Promise<{ id: string; score: number }[]>;
  healthCheck(): Promise<boolean>;
}
