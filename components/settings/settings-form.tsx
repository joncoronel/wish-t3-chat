"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, ExternalLink, Key, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AI_PROVIDERS } from "@/lib/ai";
import { useApiKeys } from "@/hooks/use-api-keys";

interface APIKeyState {
  value: string;
  isVisible: boolean;
}

type APIKeys = Record<string, APIKeyState>;

const PROVIDER_INFO = {
  openai: {
    name: "OpenAI",
    description: "GPT-4, GPT-3.5 Turbo, and other OpenAI models",
    getKeyUrl: "https://platform.openai.com/api-keys",
    placeholder: "sk-...",
  },
  anthropic: {
    name: "Anthropic",
    description: "Claude 3.5 Sonnet, Claude 3 Opus, and other Claude models",
    getKeyUrl: "https://console.anthropic.com/settings/keys",
    placeholder: "sk-ant-...",
  },
  google: {
    name: "Google AI",
    description: "Gemini 2.5 Pro, Gemini 2.5 Flash, and other Gemini models",
    getKeyUrl: "https://aistudio.google.com/app/apikey",
    placeholder: "AIza...",
  },
  openrouter: {
    name: "OpenRouter",
    description:
      "Access to 200+ models including GPT-4, Claude, Gemini, and more",
    getKeyUrl: "https://openrouter.ai/settings/keys",
    placeholder: "sk-or-...",
  },
};

export function SettingsForm() {
  const {
    apiKeys: savedApiKeys,
    updateApiKeys,
    isLoading: apiKeysLoading,
    storageMethod,
    deleteApiKey,
  } = useApiKeys();
  const [loading, setLoading] = useState(false);
  const [localApiKeys, setLocalApiKeys] = useState<APIKeys>(() => {
    const initialKeys: APIKeys = {};

    // Initialize with existing API keys (marked as set but hidden)
    Object.keys(PROVIDER_INFO).forEach((provider) => {
      initialKeys[provider] = {
        value: "",
        isVisible: false,
      };
    });

    return initialKeys;
  });

  const toggleVisibility = (provider: string) => {
    setLocalApiKeys((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        isVisible: !prev[provider].isVisible,
      },
    }));
  };

  const updateLocalApiKey = (provider: string, value: string) => {
    setLocalApiKeys((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        value,
      },
    }));
  };

  const removeApiKey = async (provider: string) => {
    try {
      setLoading(true);

      // Delete from localStorage via the hook
      const result = await deleteApiKey(provider);

      if (!result.success) {
        throw new Error(result.error || "Failed to delete API key");
      }

      // Also clear the local form state
      setLocalApiKeys((prev) => ({
        ...prev,
        [provider]: {
          value: "",
          isVisible: false,
        },
      }));

      toast.success(
        `${PROVIDER_INFO[provider as keyof typeof PROVIDER_INFO].name} API key deleted successfully!`,
      );
    } catch (error) {
      console.error("Error deleting API key:", error);
      toast.error("Failed to delete API key. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Prepare API keys for submission (only include non-empty keys)
      const keysToSubmit: Record<string, string> = {};

      Object.entries(localApiKeys).forEach(([provider, keyState]) => {
        if (keyState.value.trim()) {
          keysToSubmit[provider] = keyState.value.trim();
        }
      });

      // Use the hook to update API keys
      const result = await updateApiKeys(keysToSubmit);

      if (!result.success) {
        throw new Error(result.error || "Failed to save API keys");
      }

      // Clear the input fields after successful save
      setLocalApiKeys((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((provider) => {
          updated[provider] = {
            value: "",
            isVisible: false,
          };
        });
        return updated;
      });

      toast.success(`API keys saved successfully to ${storageMethod}!`);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save API keys. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = Object.values(localApiKeys).some((keyState) =>
    keyState.value.trim(),
  );

  if (apiKeysLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Storage method indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Key className="h-4 w-4" />
            <span>
              API keys are stored in: <strong>{storageMethod}</strong>
            </span>
          </div>
        </CardContent>
      </Card>

      {Object.entries(PROVIDER_INFO).map(([provider, info]) => {
        const localKeyState = localApiKeys[provider];
        const hasSavedKey = !!(savedApiKeys as Record<string, string>)[
          provider
        ];
        const availableModels =
          AI_PROVIDERS[provider as keyof typeof AI_PROVIDERS]?.models || [];

        return (
          <Card key={provider} className="relative">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {info.name}
                    {hasSavedKey && (
                      <Badge
                        variant="outline"
                        className="border-green-600 text-green-600"
                      >
                        <Key className="mr-1 h-3 w-3" />
                        Configured
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-muted-foreground text-sm">
                    {info.description}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {availableModels.length} models available
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={info.getKeyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    Get API Key
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`${provider}-key`}>API Key</Label>
                <div className="relative">
                  <Input
                    id={`${provider}-key`}
                    type={localKeyState.isVisible ? "text" : "password"}
                    placeholder={
                      hasSavedKey ? "••••••••••••••••" : info.placeholder
                    }
                    value={localKeyState.value}
                    onChange={(e) =>
                      updateLocalApiKey(provider, e.target.value)
                    }
                    className="pr-20"
                  />
                  <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => toggleVisibility(provider)}
                    >
                      {localKeyState.isVisible ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    {(localKeyState.value || hasSavedKey) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive h-8 w-8 p-0"
                        onClick={() => removeApiKey(provider)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <div className="flex justify-end gap-4">
        <Button
          onClick={handleSubmit}
          disabled={!hasChanges || loading}
          className="min-w-[120px]"
        >
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
