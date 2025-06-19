"use client";

import { useState } from "react";
import { useApiKeysUnified } from "@/hooks/use-api-keys-unified";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  Key,
  Trash2,
  Shield,
  AlertTriangle,
  Database,
  HardDrive,
  Settings,
} from "lucide-react";
import { AI_PROVIDERS } from "@/lib/ai";

const PROVIDER_INFO = {
  openai: {
    name: "OpenAI",
    placeholder: "sk-...",
    icon: "🤖",
    getKeyUrl: "https://platform.openai.com/api-keys",
  },
  anthropic: {
    name: "Anthropic",
    placeholder: "sk-ant-...",
    icon: "🧠",
    getKeyUrl: "https://console.anthropic.com/settings/keys",
  },
  google: {
    name: "Google AI",
    placeholder: "AI...",
    icon: "🔬",
    getKeyUrl: "https://aistudio.google.com/app/apikey",
  },
  openrouter: {
    name: "OpenRouter",
    placeholder: "sk-or-...",
    icon: "🌐",
    getKeyUrl: "https://openrouter.ai/settings/keys",
  },
} as const;

interface APIKeys {
  [key: string]: {
    value: string;
    isVisible: boolean;
  };
}

interface SettingsFormProps {
  userId: string;
}

export function SettingsForm({ userId }: SettingsFormProps) {
  const {
    apiKeys: savedApiKeys,
    updateApiKeys,
    isLoading: apiKeysLoading,
    deleteApiKey,
    isEncryptionAvailable,
    apiKeyStorageMode,
    switchStorageMode,
    storageInfo,
  } = useApiKeysUnified({ userId });
  const [loading, setLoading] = useState(false);
  const [switchingStorage, setSwitchingStorage] = useState(false);
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

      // Delete from encrypted database via the hook
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

      toast.success("API keys saved successfully!");
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
      {/* Encryption status indicator */}
      {!isEncryptionAvailable && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Client-side encryption not available. Please ensure you&apos;re
            using a modern browser with HTTPS.
          </AlertDescription>
        </Alert>
      )}

      {/* Storage Mode Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            API Key Storage
          </CardTitle>
          <CardDescription>
            Choose how your API keys are stored. You can switch between methods
            at any time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Encrypted Database Storage */}
            <div
              className={`rounded-lg border p-4 transition-all ${
                apiKeyStorageMode === "encrypted"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Database
                    className={`mt-0.5 h-5 w-5 ${apiKeyStorageMode === "encrypted" ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">Encrypted Database</p>
                      {apiKeyStorageMode === "encrypted" && (
                        <Badge variant="default" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Keys are encrypted client-side and stored in the database.
                      Works across all devices.
                    </p>
                    <div className="flex items-center gap-2">
                      <Shield className="h-3 w-3" />
                      <span className="text-muted-foreground text-xs">
                        End-to-end encrypted
                      </span>
                    </div>
                  </div>
                </div>

                {apiKeyStorageMode !== "encrypted" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={async () => {
                      setSwitchingStorage(true);
                      await switchStorageMode("encrypted");
                      setSwitchingStorage(false);
                    }}
                    disabled={switchingStorage || loading}
                  >
                    {switchingStorage ? (
                      <>
                        <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Migrating...
                      </>
                    ) : (
                      "Switch to Encrypted"
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Local Storage */}
            <div
              className={`rounded-lg border p-4 transition-all ${
                apiKeyStorageMode === "local"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <HardDrive
                    className={`mt-0.5 h-5 w-5 ${apiKeyStorageMode === "local" ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">Local Storage Only</p>
                      {apiKeyStorageMode === "local" && (
                        <Badge variant="default" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Keys are stored only in your browser&apos;s local storage.
                      Device-specific.
                    </p>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 text-yellow-500" />
                      <span className="text-muted-foreground text-xs">
                        Not synced across devices
                      </span>
                    </div>
                  </div>
                </div>

                {apiKeyStorageMode !== "local" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={async () => {
                      setSwitchingStorage(true);
                      await switchStorageMode("local");
                      setSwitchingStorage(false);
                    }}
                    disabled={switchingStorage || loading}
                  >
                    {switchingStorage ? (
                      <>
                        <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Migrating...
                      </>
                    ) : (
                      "Switch to Local"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Current status and migration info */}
          <div className="space-y-3 border-t pt-4">
            <div className="text-muted-foreground text-sm">
              <div className="flex items-center gap-2">
                {apiKeyStorageMode === "encrypted" ? (
                  <Shield className="h-4 w-4" />
                ) : (
                  <HardDrive className="h-4 w-4" />
                )}
                <span>
                  Currently using{" "}
                  {apiKeyStorageMode === "encrypted"
                    ? "encrypted database"
                    : "local"}{" "}
                  storage
                </span>
              </div>
            </div>

            {/* Show migration info if keys exist in both storages */}
            {storageInfo.hasLocalKeys && storageInfo.hasEncryptedKeys && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  You have API keys in both storage locations. When you switch
                  storage modes, keys will be migrated to the selected storage
                  and removed from the other.
                </AlertDescription>
              </Alert>
            )}

            {switchingStorage && (
              <Alert>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <AlertDescription className="text-sm">
                  Migrating API keys between storage locations...
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Encryption status indicator */}
      {!isEncryptionAvailable && apiKeyStorageMode === "encrypted" && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Client-side encryption not available. Please ensure you&apos;re
            using a modern browser with HTTPS, or switch to local storage mode.
          </AlertDescription>
        </Alert>
      )}

      {Object.entries(PROVIDER_INFO).map(([provider, info]) => {
        const localKeyState = localApiKeys[provider];
        const hasSavedKey = !!(savedApiKeys as Record<string, string>)[
          provider
        ];
        const availableModels =
          AI_PROVIDERS[provider as keyof typeof AI_PROVIDERS]?.models || [];

        return (
          <Card key={provider} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{info.icon}</span>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {info.name}
                      {hasSavedKey && (
                        <Badge variant="secondary">
                          <Key className="mr-1 h-3 w-3" />
                          Configured
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Add your {info.name} API key to access their models
                    </CardDescription>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={info.getKeyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Get API Key
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
                    disabled={
                      apiKeyStorageMode === "encrypted" &&
                      !isEncryptionAvailable
                    }
                  />
                  <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => toggleVisibility(provider)}
                      disabled={
                        apiKeyStorageMode === "encrypted" &&
                        !isEncryptionAvailable
                      }
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
                        disabled={
                          loading ||
                          (apiKeyStorageMode === "encrypted" &&
                            !isEncryptionAvailable)
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Available models */}
              {availableModels.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Available Models
                  </Label>
                  <div className="flex flex-wrap gap-1">
                    {availableModels.slice(0, 6).map((model) => (
                      <Badge
                        key={model.id}
                        variant="outline"
                        className="text-xs"
                      >
                        {model.name}
                      </Badge>
                    ))}
                    {availableModels.length > 6 && (
                      <Badge variant="outline" className="text-xs">
                        +{availableModels.length - 6} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Save button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={
            !hasChanges ||
            loading ||
            switchingStorage ||
            (apiKeyStorageMode === "encrypted" && !isEncryptionAvailable)
          }
          className="min-w-[120px]"
        >
          {loading ? "Saving..." : "Save API Keys"}
        </Button>
      </div>
    </div>
  );
}
