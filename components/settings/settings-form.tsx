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
import {
  SiOpenai,
  SiAnthropic,
  SiGoogle,
} from "@icons-pack/react-simple-icons";
import { SettingsLoadingSkeleton } from "./settings-loading-skeleton";

// OpenRouter icon component
const OpenRouterIcon = ({ className }: { className?: string }) => (
  <svg
    fill="currentColor"
    fillRule="evenodd"
    height="1em"
    style={{ flex: "none", lineHeight: 1 }}
    viewBox="0 0 24 24"
    width="1em"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M16.804 1.957l7.22 4.105v.087L16.73 10.21l.017-2.117-.821-.03c-1.059-.028-1.611.002-2.268.11-1.064.175-2.038.577-3.147 1.352L8.345 11.03c-.284.195-.495.336-.68.455l-.515.322-.397.234.385.23.53.338c.476.314 1.17.796 2.701 1.866 1.11.775 2.083 1.177 3.147 1.352l.3.045c.694.091 1.375.094 2.825.033l.022-2.159 7.22 4.105v.087L16.589 22l.014-1.862-.635.022c-1.386.042-2.137.002-3.138-.162-1.694-.28-3.26-.926-4.881-2.059l-2.158-1.5a21.997 21.997 0 00-.755-.498l-.467-.28a55.927 55.927 0 00-.76-.43C2.908 14.73.563 14.116 0 14.116V9.888l.14.004c.564-.007 2.91-.622 3.809-1.124l1.016-.58.438-.274c.428-.28 1.072-.726 2.686-1.853 1.621-1.133 3.186-1.78 4.881-2.059 1.152-.19 1.974-.213 3.814-.138l.02-1.907z"></path>
  </svg>
);

const PROVIDER_INFO = {
  openai: {
    name: "OpenAI",
    placeholder: "sk-...",
    icon: SiOpenai,
    getKeyUrl: "https://platform.openai.com/api-keys",
  },
  anthropic: {
    name: "Anthropic",
    placeholder: "sk-ant-...",
    icon: SiAnthropic,
    getKeyUrl: "https://console.anthropic.com/settings/keys",
  },
  google: {
    name: "Google AI",
    placeholder: "AI...",
    icon: SiGoogle,
    getKeyUrl: "https://aistudio.google.com/app/apikey",
  },
  openrouter: {
    name: "OpenRouter",
    placeholder: "sk-or-...",
    icon: OpenRouterIcon,
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

  if (apiKeysLoading && !isEncryptionAvailable) {
    return <SettingsLoadingSkeleton />;
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
          <CardTitle className="border-primary flex items-center gap-2 border-l-4 pl-4">
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
                      <AlertTriangle className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
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

        return (
          <Card key={provider} className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center">
                    <info.icon className="h-6 w-6" />
                  </div>
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
                  </div>
                </div>
                <Button variant="secondary" size="sm" asChild>
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
            <CardContent className="pt-0">
              <div className="relative">
                <Input
                  id={`${provider}-key`}
                  type={localKeyState.isVisible ? "text" : "password"}
                  placeholder={
                    hasSavedKey ? "••••••••••••••••" : info.placeholder
                  }
                  value={localKeyState.value}
                  onChange={(e) => updateLocalApiKey(provider, e.target.value)}
                  className="pr-20"
                  disabled={
                    apiKeyStorageMode === "encrypted" && !isEncryptionAvailable
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
