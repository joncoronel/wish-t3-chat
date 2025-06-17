import { openai } from "@ai-sdk/openai";
import { createOpenAI } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { createAnthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
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
  // OpenAI Models
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
  {
    id: "gpt-4.1",
    name: "GPT-4.1",
    provider: "openai",
    description: "Smartest model for complex tasks",
    maxTokens: 128000,
    supportsFunctions: true,
    supportsVision: true,
    costPer1kTokens: { input: 2.0, output: 8.0 },
  },
  {
    id: "gpt-4.1-mini",
    name: "GPT-4.1 mini",
    provider: "openai",
    description: "Affordable model balancing speed and intelligence",
    maxTokens: 128000,
    supportsFunctions: true,
    supportsVision: true,
    costPer1kTokens: { input: 0.4, output: 1.6 },
  },
  {
    id: "gpt-4.1-nano",
    name: "GPT-4.1 nano",
    provider: "openai",
    description: "Fastest, most cost-effective model for low-latency tasks",
    maxTokens: 128000,
    supportsFunctions: true,
    supportsVision: true,
    costPer1kTokens: { input: 0.1, output: 0.4 },
  },

  // Anthropic Claude Models
  {
    id: "claude-opus-4-20250514",
    name: "Claude Opus 4",
    provider: "anthropic",
    description: "Anthropic's most powerful and intelligent model",
    maxTokens: 200000,
    supportsFunctions: true,
    supportsVision: true,
    costPer1kTokens: { input: 0.015, output: 0.075 },
  },
  {
    id: "claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    provider: "anthropic",
    description: "Next-generation balanced model for complex reasoning",
    maxTokens: 200000,
    supportsFunctions: true,
    supportsVision: true,
    costPer1kTokens: { input: 0.003, output: 0.015 },
  },
  {
    id: "claude-3-7-sonnet-20250219",
    name: "Claude Sonnet 3.7",
    provider: "anthropic",
    description: "Enhanced Sonnet model with improved capabilities",
    maxTokens: 200000,
    supportsFunctions: true,
    supportsVision: true,
    costPer1kTokens: { input: 0.003, output: 0.015 },
  },
  {
    id: "claude-3-5-sonnet-20241022",
    name: "Claude Sonnet 3.5",
    provider: "anthropic",
    description: "Anthropic's most intelligent model",
    maxTokens: 200000,
    supportsFunctions: true,
    supportsVision: true,
    costPer1kTokens: { input: 0.003, output: 0.015 },
  },
  {
    id: "claude-3-5-haiku-20241022",
    name: "Claude Haiku 3.5",
    provider: "anthropic",
    description: "Fast and cost-effective Claude model",
    maxTokens: 200000,
    supportsFunctions: true,
    supportsVision: true,
    costPer1kTokens: { input: 0.0008, output: 0.004 },
  },

  // Google Gemini Models
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "google",
    description: "Google's most capable multimodal model",
    maxTokens: 2000000,
    supportsFunctions: true,
    supportsVision: true,
    costPer1kTokens: { input: 0.0035, output: 0.0105 },
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "google",
    description: "Fast and efficient Gemini model",
    maxTokens: 1000000,
    supportsFunctions: true,
    supportsVision: true,
    costPer1kTokens: { input: 0.00015, output: 0.0006 },
  },
  {
    id: "gemini-2.5-flash-lite-preview-06-17",
    name: "Gemini 2.5 Flash-Lite Preview",
    provider: "google",
    description: "Lightweight preview version of Gemini 2.5 Flash",
    maxTokens: 1000000,
    supportsFunctions: true,
    supportsVision: true,
    costPer1kTokens: { input: 0.00015, output: 0.0006 },
  },
];

// Provider configurations
export const AI_PROVIDERS = {
  openai: {
    name: "OpenAI",
    models: AI_MODELS.filter((m) => m.provider === "openai"),
    requiresApiKey: true,
    envKey: "OPENAI_API_KEY",
  },
  anthropic: {
    name: "Anthropic",
    models: AI_MODELS.filter((m) => m.provider === "anthropic"),
    requiresApiKey: true,
    envKey: "ANTHROPIC_API_KEY",
  },
  google: {
    name: "Google",
    models: AI_MODELS.filter((m) => m.provider === "google"),
    requiresApiKey: true,
    envKey: "GOOGLE_GENERATIVE_AI_API_KEY",
  },
};

// Get language model instance
export function getLanguageModel(
  modelId: string,
  apiKeys?: Record<string, string>,
): LanguageModel {
  const model = AI_MODELS.find((m) => m.id === modelId);
  if (!model) {
    throw new Error(`Model ${modelId} not found`);
  }

  switch (model.provider) {
    case "openai":
      const openaiKey = apiKeys?.openai || process.env.OPENAI_API_KEY;
      if (openaiKey && openaiKey !== process.env.OPENAI_API_KEY) {
        const customOpenAI = createOpenAI({ apiKey: openaiKey });
        return customOpenAI(modelId);
      }
      return openai(modelId);

    case "anthropic":
      const anthropicKey = apiKeys?.anthropic || process.env.ANTHROPIC_API_KEY;
      if (anthropicKey && anthropicKey !== process.env.ANTHROPIC_API_KEY) {
        const customAnthropic = createAnthropic({ apiKey: anthropicKey });
        return customAnthropic(modelId);
      }
      return anthropic(modelId);

    case "google":
      const googleKey =
        apiKeys?.google || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      if (googleKey && googleKey !== process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        const customGoogle = createGoogleGenerativeAI({ apiKey: googleKey });
        return customGoogle(modelId);
      }
      return google(modelId);

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
