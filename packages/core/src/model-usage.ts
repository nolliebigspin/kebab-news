export type ModelUsage = {
  provider: "google" | "anthropic";
  model: string;
  inputTokens: number;
  outputTokens: number;
  costMicroUsd: number;
};
