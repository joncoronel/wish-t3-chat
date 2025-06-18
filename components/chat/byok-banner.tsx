"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Key, Settings, Globe, ExternalLink } from "lucide-react";
import { AI_MODELS } from "@/lib/ai";
import { useApiKeys } from "@/hooks/use-api-keys";

interface ByokBannerProps {
  selectedModel: string;
  onClose?: () => void;
  className?: string;
}

export function ByokBanner({
  selectedModel,
  onClose,
  className,
}: ByokBannerProps) {
  const { apiKeys } = useApiKeys();
  const model = AI_MODELS.find((m) => m.id === selectedModel);

  if (!model) return null;

  const hasUserApiKey = !!(apiKeys as Record<string, string>)[model.provider];
  const hasAnyApiKey = Object.keys(apiKeys).length > 0;

  // Don't show banner if user has API key for current model
  if (hasUserApiKey) {
    return null;
  }

  return (
    <Alert
      className={`border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20 ${className}`}
    >
      <Key className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex flex-col gap-2 pr-4">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span className="font-medium text-amber-800 dark:text-amber-200">
              Using system API key for {model.provider}
            </span>
            <Badge
              variant="outline"
              className="border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300"
            >
              {model.provider.toUpperCase()}
            </Badge>
          </div>

          <p className="text-sm text-amber-700 dark:text-amber-300">
            {hasAnyApiKey
              ? `You have API keys configured for other providers. Add a ${model.provider} key for full control.`
              : "Set up your own API keys for direct billing, no limits, and access to the latest models."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200 dark:border-amber-700 dark:bg-amber-900/50 dark:text-amber-200 dark:hover:bg-amber-900"
            asChild
          >
            <a href="/settings" className="flex items-center gap-1">
              <Settings className="h-3 w-3" />
              Configure API Keys
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>

          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200"
            >
              ×
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
