import { openai } from "@ai-sdk/openai";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

// AI Model definition
export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  maxTokens: number;
  supportsFunctions: boolean;
  supportsVision: boolean;
  costPer1kTokens: {
    input: number;
    output: number;
  };
}

// Available models configuration
export const AI_MODELS: AIModel[] = [
  {
    id: "gpt-4",
    name: "GPT-4",
    provider: "openai",
    description: "Most capable GPT-4 model",
    maxTokens: 8192,
    supportsFunctions: true,
    supportsVision: false,
    costPer1kTokens: { input: 0.03, output: 0.06 },
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "openai",
    description: "Latest GPT-4 model with improved performance",
    maxTokens: 128000,
    supportsFunctions: true,
    supportsVision: true,
    costPer1kTokens: { input: 0.01, output: 0.03 },
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: "openai",
    description: "Fast and cost-effective model",
    maxTokens: 16384,
    supportsFunctions: true,
    supportsVision: false,
    costPer1kTokens: { input: 0.001, output: 0.002 },
  },
];

// Provider configurations
export const AI_PROVIDERS = {
  openai: {
    name: "OpenAI",
    models: AI_MODELS.filter((m) => m.provider === "openai"),
    requiresApiKey: true,
  },
  anthropic: {
    name: "Anthropic",
    models: [],
    requiresApiKey: true,
  },
  google: {
    name: "Google",
    models: [],
    requiresApiKey: true,
  },
};

// Get language model instance
export function getLanguageModel(
  modelId: string,
  apiKey?: string,
): LanguageModel {
  const model = AI_MODELS.find((m) => m.id === modelId);
  if (!model) {
    throw new Error(`Model ${modelId} not found`);
  }

  switch (model.provider) {
    case "openai":
      if (apiKey) {
        const customOpenAI = createOpenAI({ apiKey });
        return customOpenAI(modelId);
      }
      return openai(modelId);

    default:
      throw new Error(`Provider ${model.provider} not implemented yet`);
  }
}

// Utility functions
export function getModelById(id: string): AIModel | undefined {
  return AI_MODELS.find((model) => model.id === id);
}

export function getModelsByProvider(provider: string): AIModel[] {
  return AI_MODELS.filter((model) => model.provider === provider);
}

export function calculateTokenCost(
  model: AIModel,
  inputTokens: number,
  outputTokens: number,
): number {
  const inputCost = (inputTokens / 1000) * model.costPer1kTokens.input;
  const outputCost = (outputTokens / 1000) * model.costPer1kTokens.output;
  return inputCost + outputCost;
}
