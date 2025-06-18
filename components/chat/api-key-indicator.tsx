"use client";

import { Badge } from "@/components/ui/badge";
import { Key, Globe } from "lucide-react";
import { AI_MODELS } from "@/lib/ai";
import { useApiKeys } from "@/hooks/use-api-keys";

interface ApiKeyIndicatorProps {
  selectedModel: string;
  className?: string;
}

export function ApiKeyIndicator({
  selectedModel,
  className,
}: ApiKeyIndicatorProps) {
  const { apiKeys } = useApiKeys();
  const model = AI_MODELS.find((m) => m.id === selectedModel);

  if (!model) return null;

  const hasUserApiKey = !!(apiKeys as Record<string, string>)[model.provider];

  if (hasUserApiKey) {
    return (
      <Badge variant="outline" className={`text-xs ${className}`}>
        <Key className="mr-1 h-3 w-3" />
        Your API Key
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className={`text-xs ${className}`}>
      <Globe className="mr-1 h-3 w-3" />
      System API Key
    </Badge>
  );
}
