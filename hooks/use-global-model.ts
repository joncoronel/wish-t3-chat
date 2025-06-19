"use client";

import { useQueryState } from "nuqs";
import { getModelById } from "@/lib/ai";

export function useGlobalModel() {
  const [selectedModel, setSelectedModel] = useQueryState("model", {
    defaultValue: "gemini-2.5-flash-lite-preview-06-17",
    shallow: true, // Include in browser history
  });

  const [preferOpenRouter, setPreferOpenRouter] = useQueryState("openrouter", {
    defaultValue: false,
    shallow: true,
    parse: (value) => value === "true",
    serialize: (value) => value.toString(),
  });

  const currentModel = getModelById(selectedModel);

  const selectModel = (modelId: string) => {
    setSelectedModel(modelId);
  };

  const toggleOpenRouterPreference = (enabled: boolean) => {
    setPreferOpenRouter(enabled);
  };

  const isAvailable = !!selectedModel;

  return {
    selectedModel,
    currentModel,
    selectModel,
    isAvailable,
    preferOpenRouter,
    toggleOpenRouterPreference,
  };
}
