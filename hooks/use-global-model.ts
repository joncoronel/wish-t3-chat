"use client";

import { useQueryState } from "nuqs";
import { getModelById } from "@/lib/ai";

export function useGlobalModel() {
  const [selectedModel, setSelectedModel] = useQueryState("model", {
    defaultValue: "gemini-2.5-flash-lite-preview-06-17",
    shallow: true, // Include in browser history
  });

  const currentModel = getModelById(selectedModel);

  const selectModel = (modelId: string) => {
    setSelectedModel(modelId);
  };

  const isAvailable = !!selectedModel;

  return {
    selectedModel,
    currentModel,
    selectModel,
    isAvailable,
  };
}
