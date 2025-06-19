import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
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

// Consolidated model definition for deduplication
export interface ConsolidatedModel {
  baseId: string; // e.g., "gpt-4.1", "claude-opus-4"
  name: string;
  description: string;
  maxTokens: number;
  supportsFunctions: boolean;
  supportsVision: boolean;
  sources: {
    provider: string;
    modelId: string;
    costPer1kTokens: { input: number; output: number };
    preferred?: boolean; // Mark the preferred source
  }[];
}

// Available models configuration
export const AI_MODELS: AIModel[] = [
  // OpenAI Models
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
    description: "Claude's most powerful model",
    maxTokens: 200000,
    supportsFunctions: true,
    supportsVision: true,
    costPer1kTokens: { input: 0.015, output: 0.075 },
  },
  {
    id: "claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    provider: "anthropic",
    description: "Balance of intelligence and speed",
    maxTokens: 200000,
    supportsFunctions: true,
    supportsVision: true,
    costPer1kTokens: { input: 0.003, output: 0.015 },
  },
  {
    id: "claude-3-7-sonnet-20250219",
    name: "Claude Sonnet 3.7",
    provider: "anthropic",
    description: "Advanced reasoning and analysis",
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
  {
    id: "claude-3-5-sonnet-20241022",
    name: "Claude Sonnet 3.5",
    provider: "anthropic",
    description: "Anthropic's most popular model for complex tasks",
    maxTokens: 200000,
    supportsFunctions: true,
    supportsVision: true,
    costPer1kTokens: { input: 0.003, output: 0.015 },
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
    description: "Fast and efficient multimodal model",
    maxTokens: 1000000,
    supportsFunctions: true,
    supportsVision: true,
    costPer1kTokens: { input: 0.00015, output: 0.0006 },
  },
  {
    id: "gemini-2.5-flash-lite-preview-06-17",
    name: "Gemini 2.5 Flash-Lite Preview",
    provider: "google",
    description: "Lightweight preview model",
    maxTokens: 1000000,
    supportsFunctions: true,
    supportsVision: true,
    costPer1kTokens: { input: 0.00015, output: 0.0006 },
  },

  // OpenRouter Models
  {
    id: "openai/gpt-4.1",
    name: "GPT-4.1",
    provider: "openrouter",
    description: "OpenAI's GPT-4.1 model through OpenRouter",
    maxTokens: 128000,
    supportsFunctions: true,
    supportsVision: true,
    costPer1kTokens: { input: 2.0, output: 8.0 },
  },
  {
    id: "openai/gpt-4.1-mini",
    name: "GPT-4.1 mini",
    provider: "openrouter",
    description: "OpenAI's GPT-4.1 mini model through OpenRouter",
    maxTokens: 128000,
    supportsFunctions: true,
    supportsVision: true,
    costPer1kTokens: { input: 0.4, output: 1.6 },
  },
  {
    id: "openai/gpt-4.1-nano",
    name: "GPT-4.1 nano",
    provider: "openrouter",
    description: "OpenAI's GPT-4.1 nano model through OpenRouter",
    maxTokens: 128000,
    supportsFunctions: true,
    supportsVision: true,
    costPer1kTokens: { input: 0.1, output: 0.4 },
  },
  {
    id: "anthropic/claude-opus-4",
    name: "Claude Opus 4",
    provider: "openrouter",
    description: "Anthropic's Claude Opus 4 through OpenRouter",
    maxTokens: 200000,
    supportsFunctions: true,
    supportsVision: true,
    costPer1kTokens: { input: 0.015, output: 0.075 },
  },
  {
    id: "anthropic/claude-sonnet-4",
    name: "Claude Sonnet 4",
    provider: "openrouter",
    description: "Anthropic's Claude Sonnet 4 through OpenRouter",
    maxTokens: 200000,
    supportsFunctions: true,
    supportsVision: true,
    costPer1kTokens: { input: 0.003, output: 0.015 },
  },
  {
    id: "anthropic/claude-3-7-sonnet",
    name: "Claude Sonnet 3.7",
    provider: "openrouter",
    description: "Anthropic's Claude Sonnet 3.7 through OpenRouter",
    maxTokens: 200000,
    supportsFunctions: true,
    supportsVision: true,
    costPer1kTokens: { input: 0.003, output: 0.015 },
  },
  {
    id: "anthropic/claude-3-5-haiku",
    name: "Claude Haiku 3.5",
    provider: "openrouter",
    description: "Anthropic's Claude Haiku 3.5 through OpenRouter",
    maxTokens: 200000,
    supportsFunctions: true,
    supportsVision: true,
    costPer1kTokens: { input: 0.0008, output: 0.004 },
  },
  {
    id: "anthropic/claude-3-5-sonnet",
    name: "Claude Sonnet 3.5",
    provider: "openrouter",
    description: "Anthropic's Claude Sonnet 3.5 through OpenRouter",
    maxTokens: 200000,
    supportsFunctions: true,
    supportsVision: true,
    costPer1kTokens: { input: 0.003, output: 0.015 },
  },
  {
    id: "google/gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "openrouter",
    description: "Google's Gemini 2.5 Pro through OpenRouter",
    maxTokens: 2000000,
    supportsFunctions: true,
    supportsVision: true,
    costPer1kTokens: { input: 0.0035, output: 0.0105 },
  },
  {
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "openrouter",
    description: "Google's Gemini 2.5 Flash through OpenRouter",
    maxTokens: 1000000,
    supportsFunctions: true,
    supportsVision: true,
    costPer1kTokens: { input: 0.00015, output: 0.0006 },
  },
  {
    id: "google/gemini-2.5-flash-lite-preview-06-17",
    name: "Gemini 2.5 Flash-Lite Preview",
    provider: "openrouter",
    description: "Google's Gemini 2.5 Flash-Lite Preview through OpenRouter",
    maxTokens: 1000000,
    supportsFunctions: true,
    supportsVision: true,
    costPer1kTokens: { input: 0.00015, output: 0.0006 },
  },
];

// Consolidated models for deduplication
export const CONSOLIDATED_MODELS: ConsolidatedModel[] = [
  {
    baseId: "gpt-4.1",
    name: "GPT-4.1",
    description: "Smartest model for complex tasks",
    maxTokens: 128000,
    supportsFunctions: true,
    supportsVision: true,
    sources: [
      {
        provider: "openai",
        modelId: "gpt-4.1",
        costPer1kTokens: { input: 2.0, output: 8.0 },
        preferred: true,
      },
      {
        provider: "openrouter",
        modelId: "openai/gpt-4.1",
        costPer1kTokens: { input: 2.0, output: 8.0 },
      },
    ],
  },
  {
    baseId: "gpt-4.1-mini",
    name: "GPT-4.1 mini",
    description: "Affordable model balancing speed and intelligence",
    maxTokens: 128000,
    supportsFunctions: true,
    supportsVision: true,
    sources: [
      {
        provider: "openai",
        modelId: "gpt-4.1-mini",
        costPer1kTokens: { input: 0.4, output: 1.6 },
        preferred: true,
      },
      {
        provider: "openrouter",
        modelId: "openai/gpt-4.1-mini",
        costPer1kTokens: { input: 0.4, output: 1.6 },
      },
    ],
  },
  {
    baseId: "gpt-4.1-nano",
    name: "GPT-4.1 nano",
    description: "Fastest, most cost-effective model for low-latency tasks",
    maxTokens: 128000,
    supportsFunctions: true,
    supportsVision: true,
    sources: [
      {
        provider: "openai",
        modelId: "gpt-4.1-nano",
        costPer1kTokens: { input: 0.1, output: 0.4 },
        preferred: true,
      },
      {
        provider: "openrouter",
        modelId: "openai/gpt-4.1-nano",
        costPer1kTokens: { input: 0.1, output: 0.4 },
      },
    ],
  },
  {
    baseId: "claude-opus-4",
    name: "Claude Opus 4",
    description: "Claude's most powerful model",
    maxTokens: 200000,
    supportsFunctions: true,
    supportsVision: true,
    sources: [
      {
        provider: "anthropic",
        modelId: "claude-opus-4-20250514",
        costPer1kTokens: { input: 0.015, output: 0.075 },
        preferred: true,
      },
      {
        provider: "openrouter",
        modelId: "anthropic/claude-opus-4",
        costPer1kTokens: { input: 0.015, output: 0.075 },
      },
    ],
  },
  {
    baseId: "claude-sonnet-4",
    name: "Claude Sonnet 4",
    description: "Balance of intelligence and speed",
    maxTokens: 200000,
    supportsFunctions: true,
    supportsVision: true,
    sources: [
      {
        provider: "anthropic",
        modelId: "claude-sonnet-4-20250514",
        costPer1kTokens: { input: 0.003, output: 0.015 },
        preferred: true,
      },
      {
        provider: "openrouter",
        modelId: "anthropic/claude-sonnet-4",
        costPer1kTokens: { input: 0.003, output: 0.015 },
      },
    ],
  },
  {
    baseId: "claude-3-7-sonnet",
    name: "Claude Sonnet 3.7",
    description: "Advanced reasoning and analysis",
    maxTokens: 200000,
    supportsFunctions: true,
    supportsVision: true,
    sources: [
      {
        provider: "anthropic",
        modelId: "claude-3-7-sonnet-20250219",
        costPer1kTokens: { input: 0.003, output: 0.015 },
        preferred: true,
      },
      {
        provider: "openrouter",
        modelId: "anthropic/claude-3-7-sonnet",
        costPer1kTokens: { input: 0.003, output: 0.015 },
      },
    ],
  },
  {
    baseId: "claude-3-5-haiku",
    name: "Claude Haiku 3.5",
    description: "Fast and cost-effective Claude model",
    maxTokens: 200000,
    supportsFunctions: true,
    supportsVision: true,
    sources: [
      {
        provider: "anthropic",
        modelId: "claude-3-5-haiku-20241022",
        costPer1kTokens: { input: 0.0008, output: 0.004 },
        preferred: true,
      },
      {
        provider: "openrouter",
        modelId: "anthropic/claude-3-5-haiku",
        costPer1kTokens: { input: 0.0008, output: 0.004 },
      },
    ],
  },
  {
    baseId: "claude-3-5-sonnet",
    name: "Claude Sonnet 3.5",
    description: "Anthropic's most popular model for complex tasks",
    maxTokens: 200000,
    supportsFunctions: true,
    supportsVision: true,
    sources: [
      {
        provider: "anthropic",
        modelId: "claude-3-5-sonnet-20241022",
        costPer1kTokens: { input: 0.003, output: 0.015 },
        preferred: true,
      },
      {
        provider: "openrouter",
        modelId: "anthropic/claude-3-5-sonnet",
        costPer1kTokens: { input: 0.003, output: 0.015 },
      },
    ],
  },
  {
    baseId: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    description: "Google's most capable multimodal model",
    maxTokens: 2000000,
    supportsFunctions: true,
    supportsVision: true,
    sources: [
      {
        provider: "google",
        modelId: "gemini-2.5-pro",
        costPer1kTokens: { input: 0.0035, output: 0.0105 },
        preferred: true,
      },
      {
        provider: "openrouter",
        modelId: "google/gemini-2.5-pro",
        costPer1kTokens: { input: 0.0035, output: 0.0105 },
      },
    ],
  },
  {
    baseId: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    description: "Fast and efficient multimodal model",
    maxTokens: 1000000,
    supportsFunctions: true,
    supportsVision: true,
    sources: [
      {
        provider: "google",
        modelId: "gemini-2.5-flash",
        costPer1kTokens: { input: 0.00015, output: 0.0006 },
        preferred: true,
      },
      {
        provider: "openrouter",
        modelId: "google/gemini-2.5-flash",
        costPer1kTokens: { input: 0.00015, output: 0.0006 },
      },
    ],
  },
  {
    baseId: "gemini-2.5-flash-lite-preview-06-17",
    name: "Gemini 2.5 Flash-Lite Preview",
    description: "Lightweight preview model",
    maxTokens: 1000000,
    supportsFunctions: true,
    supportsVision: true,
    sources: [
      {
        provider: "google",
        modelId: "gemini-2.5-flash-lite-preview-06-17",
        costPer1kTokens: { input: 0.00015, output: 0.0006 },
        preferred: true,
      },
      {
        provider: "openrouter",
        modelId: "google/gemini-2.5-flash-lite-preview-06-17",
        costPer1kTokens: { input: 0.00015, output: 0.0006 },
      },
    ],
  },
];

// Helper function to get available sources for a consolidated model
export function getAvailableSources(
  consolidatedModel: ConsolidatedModel,
  apiKeys: Record<string, string>,
): ConsolidatedModel["sources"] {
  return consolidatedModel.sources.filter((source) => {
    switch (source.provider) {
      case "openai":
        return !!apiKeys.openai;
      case "anthropic":
        return !!apiKeys.anthropic;
      case "google":
        return !!apiKeys.google;
      case "openrouter":
        return !!apiKeys.openrouter;
      default:
        return false;
    }
  });
}

// Helper function to select the best available source
export function selectBestSource(
  consolidatedModel: ConsolidatedModel,
  apiKeys: Record<string, string>,
): ConsolidatedModel["sources"][0] | null {
  const availableSources = getAvailableSources(consolidatedModel, apiKeys);

  if (availableSources.length === 0) {
    return null;
  }

  // Prefer the preferred source if available
  const preferredSource = availableSources.find((source) => source.preferred);
  if (preferredSource) {
    return preferredSource;
  }

  // Otherwise return the first available source
  return availableSources[0];
}

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
  openrouter: {
    name: "OpenRouter",
    models: AI_MODELS.filter((m) => m.provider === "openrouter"),
    requiresApiKey: true,
    envKey: "OPENROUTER_API_KEY",
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

  console.log(
    `Creating language model for: ${modelId} (provider: ${model.provider})`,
  );

  switch (model.provider) {
    case "openai":
      const openaiKey = apiKeys?.openai;
      if (!openaiKey) {
        throw new Error(
          "OpenAI API key is required for this model. Please add your API key in Settings.",
        );
      }
      const customOpenAI = createOpenAI({ apiKey: openaiKey });
      return customOpenAI(modelId);

    case "anthropic":
      const anthropicKey = apiKeys?.anthropic;
      if (!anthropicKey) {
        throw new Error(
          "Anthropic API key is required for this model. Please add your API key in Settings.",
        );
      }
      const customAnthropic = createAnthropic({ apiKey: anthropicKey });
      return customAnthropic(modelId);

    case "google":
      const googleKey = apiKeys?.google;
      if (!googleKey) {
        throw new Error(
          "Google Generative AI API key is required for this model. Please add your API key in Settings.",
        );
      }
      console.log(
        `Using Google API key: ${googleKey ? "✓ Available" : "✗ Missing"}`,
      );
      try {
        const customGoogle = createGoogleGenerativeAI({
          apiKey: googleKey,
        });
        return customGoogle(modelId);
      } catch (error) {
        console.error("Error creating Google language model:", error);
        throw new Error(
          `Failed to create Google language model: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }

    case "openrouter":
      const openrouterKey = apiKeys?.openrouter;
      if (!openrouterKey) {
        throw new Error(
          "OpenRouter API key is required for this model. Please add your API key in Settings.",
        );
      }
      console.log("OpenRouter API key:", openrouterKey);
      console.log("Model:", modelId);
      console.log("Provider:", model.provider);
      const customOpenRouter = createOpenAI({
        apiKey: openrouterKey,
        baseURL: "https://openrouter.ai/api/v1",
        headers: {
          "HTTP-Referer":
            process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
          "X-Title": "Wish T3 Chat Clone",
        },
      });
      return customOpenRouter(modelId);

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
