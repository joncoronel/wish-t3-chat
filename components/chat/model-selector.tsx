"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useApiKeys } from "@/hooks/use-api-keys";
import { useGlobalModel } from "@/hooks/use-global-model";
import {
  CheckIcon,
  ChevronDown,
  Lock,
  Settings,
  ArrowRight,
} from "lucide-react";
import React, { useState } from "react";
import {
  SiOpenai,
  SiAnthropic,
  SiGoogle,
  SiGooglegemini,
  SiOllama,
  SiClaude,
} from "@icons-pack/react-simple-icons";
import {
  CONSOLIDATED_MODELS,
  getAvailableSources,
  selectBestSource,
  getModelById,
  type ConsolidatedModel,
} from "@/lib/ai";

// OpenRouter icon component using the provided SVG
function OpenRouterIcon({ className }: { className?: string }) {
  return (
    <svg
      fill="currentColor"
      fillRule="evenodd"
      height="1em"
      style={{ flex: "none", lineHeight: 1 }}
      viewBox="0 0 24 24"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M16.804 1.957l7.22 4.105v.087L16.73 10.21l.017-2.117-.821-.03c-1.059-.028-1.611.002-2.268.11-1.064.175-2.038.577-3.147 1.352L8.345 11.03c-.284.195-.495.336-.68.455l-.515.322-.397.234.385.23.53.338c.476.314 1.17.796 2.701 1.866 1.11.775 2.083 1.177 3.147 1.352l.3.045c.694.091 1.375.094 2.825.033l.022-2.159 7.22 4.105v.087L16.589 22l.014-1.862-.635.022c-1.386.042-2.137.002-3.138-.162-1.694-.28-3.26-.926-4.881-2.059l-2.158-1.5a21.997 21.997 0 00-.755-.498l-.467-.28a55.927 55.927 0 00-.76-.43C2.908 14.73.563 14.116 0 14.116V9.888l.14.004c.564-.007 2.91-.622 3.809-1.124l1.016-.58.438-.274c.428-.28 1.072-.726 2.686-1.853 1.621-1.133 3.186-1.78 4.881-2.059 1.152-.19 1.974-.213 3.814-.138l.02-1.907z"></path>
    </svg>
  );
}

// Provider-specific icons using proper logos
const PROVIDER_ICONS = {
  openai: SiOpenai,
  anthropic: SiAnthropic,
  google: SiGoogle,
  openrouter: OpenRouterIcon,
} as const;

function getModelIcon(baseId: string) {
  // Use provider-specific icons based on model base ID
  if (baseId.includes("gpt")) return SiOpenai;
  if (baseId.includes("claude")) return SiClaude;
  if (baseId.includes("gemini")) return SiGooglegemini;
  if (baseId.includes("llama")) return SiOllama;
  return SiOpenai; // Default fallback
}

function getProviderIcon(provider: string) {
  const IconComponent = PROVIDER_ICONS[provider as keyof typeof PROVIDER_ICONS];
  return IconComponent || OpenRouterIcon;
}

function getProviderColor(provider: string) {
  switch (provider.toLowerCase()) {
    case "openai":
      return "text-green-600 dark:text-green-400";
    case "anthropic":
      return "text-orange-600 dark:text-orange-400";
    case "google":
      return "text-blue-600 dark:text-blue-400";
    case "openrouter":
      return "text-purple-600 dark:text-purple-400";
    default:
      return "text-gray-600 dark:text-gray-400";
  }
}

interface ModelSelectorProps {
  selectedModel: string;
  onModelSelect: (modelId: string) => void;
  disabled?: boolean;
  className?: string;
}

export function ModelSelector({
  selectedModel,
  onModelSelect,
  disabled = false,
  className,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  // Get current model info
  const currentModelInfo = getModelById(selectedModel);

  // Use global OpenRouter preference from URL state
  const { preferOpenRouter, toggleOpenRouterPreference } = useGlobalModel();
  const { apiKeys } = useApiKeys();

  // Handle OpenRouter preference toggle change
  const handleOpenRouterToggle = (enabled: boolean) => {
    // Update the global preference state (which updates the URL)
    toggleOpenRouterPreference(enabled);

    // If we have a current model, try to switch to the appropriate provider version
    if (currentConsolidatedModel) {
      let newSource;

      if (enabled) {
        // Try to switch to OpenRouter version if available
        newSource = currentConsolidatedModel.sources.find(
          (s) => s.provider === "openrouter",
        );
        // Only switch if both OpenRouter source exists AND we have the key
        if (newSource && apiKeys.openrouter) {
          onModelSelect(newSource.modelId);
        }
        // If no OpenRouter available, toggle state still updates but model stays the same
      } else {
        // Try to switch to preferred provider version
        newSource = selectBestSource(currentConsolidatedModel, apiKeys);
        // Only switch if we found a valid preferred source
        if (newSource && newSource.modelId !== selectedModel) {
          onModelSelect(newSource.modelId);
        }
        // If no preferred source available, toggle state still updates but model stays the same
      }
    }
  };

  // Find current model info
  const currentConsolidatedModel = CONSOLIDATED_MODELS.find((cm) =>
    cm.sources.some((source) => source.modelId === selectedModel),
  );

  const IconComponent = currentConsolidatedModel
    ? getModelIcon(currentConsolidatedModel.baseId)
    : SiOpenai;

  const handleModelSelect = (consolidatedModel: ConsolidatedModel) => {
    // Use the global toggle to determine which source to select
    let bestSource;

    if (preferOpenRouter) {
      // Try to find OpenRouter source first
      bestSource = consolidatedModel.sources.find(
        (s) => s.provider === "openrouter",
      );
      // If no OpenRouter source available, fall back to best available
      if (!bestSource || !apiKeys.openrouter) {
        bestSource = selectBestSource(consolidatedModel, apiKeys);
      }
    } else {
      // Use preferred source (original provider)
      bestSource = selectBestSource(consolidatedModel, apiKeys);
    }

    if (bestSource) {
      onModelSelect(bestSource.modelId);
      setOpen(false);
    }
  };

  // Check if OpenRouter toggle should be available (user has OpenRouter key)
  const hasOpenRouterKey = !!apiKeys.openrouter;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "bg-background hover:bg-background border-input h-9 w-auto justify-between gap-2 px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px]",
            disabled && "opacity-50",
            className,
          )}
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            <IconComponent className="h-4 w-4" />
            <span className="text-sm font-medium">
              {currentConsolidatedModel?.name ||
                currentModelInfo?.name ||
                selectedModel}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="border-input w-full min-w-[var(--radix-popper-anchor-width)] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search AI models..." />
          <CommandList>
            <CommandEmpty>No model found.</CommandEmpty>

            {/* Global Provider Toggle */}
            {hasOpenRouterKey && (
              <div className="border-b px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <OpenRouterIcon className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">
                      Prefer OpenRouter
                    </span>
                  </div>
                  <Switch
                    checked={preferOpenRouter}
                    onCheckedChange={handleOpenRouterToggle}
                    className="h-5 w-8 [&_span]:size-4 data-[state=checked]:[&_span]:translate-x-3 data-[state=checked]:[&_span]:rtl:-translate-x-3"
                  />
                </div>
              </div>
            )}

            {/* Group models by provider */}
            {/* OpenAI Models */}
            <CommandGroup heading="OpenAI" className="pb-1">
              {CONSOLIDATED_MODELS.filter((model) =>
                model.baseId.startsWith("gpt"),
              ).map((consolidatedModel) => {
                const availableSources = getAvailableSources(
                  consolidatedModel,
                  apiKeys,
                );
                const isAnySourceAvailable = availableSources.length > 0;

                // Determine which source to display based on preference
                let displaySource;
                if (preferOpenRouter && apiKeys.openrouter) {
                  displaySource = consolidatedModel.sources.find(
                    (s) => s.provider === "openrouter",
                  );
                }
                if (!displaySource) {
                  displaySource = selectBestSource(consolidatedModel, apiKeys);
                }

                const isCurrentModel =
                  currentConsolidatedModel?.baseId === consolidatedModel.baseId;

                const IconComponent = getModelIcon(consolidatedModel.baseId);

                return (
                  <CommandItem
                    key={consolidatedModel.baseId}
                    value={consolidatedModel.name}
                    onSelect={() => handleModelSelect(consolidatedModel)}
                    disabled={!isAnySourceAvailable}
                    className={cn(
                      "mb-1 flex items-center justify-between py-3",
                      !isAnySourceAvailable && "opacity-50",
                      isCurrentModel && "bg-accent",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className="h-4 w-4" />
                      <span className="font-medium">
                        {consolidatedModel.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Provider indicator */}
                      {isAnySourceAvailable && displaySource ? (
                        <div className="flex min-w-[90px] items-center gap-1">
                          {React.createElement(
                            getProviderIcon(displaySource.provider),
                            {
                              className: cn(
                                "h-3 w-3",
                                getProviderColor(displaySource.provider),
                              ),
                            },
                          )}
                          <span className="text-xs font-medium capitalize">
                            {displaySource.provider}
                          </span>
                        </div>
                      ) : (
                        /* Not available indicator */
                        <div className="flex min-w-[90px] items-center gap-1">
                          <Lock className="text-muted-foreground h-3 w-3" />
                          <span className="text-muted-foreground text-xs">
                            API key required
                          </span>
                        </div>
                      )}

                      {/* Current selection indicator */}
                      <CheckIcon
                        className={cn(
                          "h-4 w-4 text-green-600",
                          !isCurrentModel && "invisible",
                        )}
                      />
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>

            {/* Anthropic Models */}
            <CommandGroup heading="Anthropic" className="py-1">
              {CONSOLIDATED_MODELS.filter((model) =>
                model.baseId.startsWith("claude"),
              ).map((consolidatedModel) => {
                const availableSources = getAvailableSources(
                  consolidatedModel,
                  apiKeys,
                );
                const isAnySourceAvailable = availableSources.length > 0;

                // Determine which source to display based on preference
                let displaySource;
                if (preferOpenRouter && apiKeys.openrouter) {
                  displaySource = consolidatedModel.sources.find(
                    (s) => s.provider === "openrouter",
                  );
                }
                if (!displaySource) {
                  displaySource = selectBestSource(consolidatedModel, apiKeys);
                }

                const isCurrentModel =
                  currentConsolidatedModel?.baseId === consolidatedModel.baseId;

                const IconComponent = getModelIcon(consolidatedModel.baseId);

                return (
                  <CommandItem
                    key={consolidatedModel.baseId}
                    value={consolidatedModel.name}
                    onSelect={() => handleModelSelect(consolidatedModel)}
                    disabled={!isAnySourceAvailable}
                    className={cn(
                      "mb-1 flex items-center justify-between py-3",
                      !isAnySourceAvailable && "opacity-50",
                      isCurrentModel && "bg-accent",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className="h-4 w-4" />
                      <span className="font-medium">
                        {consolidatedModel.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Provider indicator */}
                      {isAnySourceAvailable && displaySource ? (
                        <div className="flex min-w-[90px] items-center gap-1">
                          {React.createElement(
                            getProviderIcon(displaySource.provider),
                            {
                              className: cn(
                                "h-3 w-3",
                                getProviderColor(displaySource.provider),
                              ),
                            },
                          )}
                          <span className="text-xs font-medium capitalize">
                            {displaySource.provider}
                          </span>
                        </div>
                      ) : (
                        /* Not available indicator */
                        <div className="flex min-w-[90px] items-center gap-1">
                          <Lock className="text-muted-foreground h-3 w-3" />
                          <span className="text-muted-foreground text-xs">
                            API key required
                          </span>
                        </div>
                      )}

                      {/* Current selection indicator */}
                      <CheckIcon
                        className={cn(
                          "h-4 w-4 text-green-600",
                          !isCurrentModel && "invisible",
                        )}
                      />
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>

            {/* Google Models */}
            <CommandGroup heading="Google" className="py-1">
              {CONSOLIDATED_MODELS.filter((model) =>
                model.baseId.startsWith("gemini"),
              ).map((consolidatedModel) => {
                const availableSources = getAvailableSources(
                  consolidatedModel,
                  apiKeys,
                );
                const isAnySourceAvailable = availableSources.length > 0;

                // Determine which source to display based on preference
                let displaySource;
                if (preferOpenRouter && apiKeys.openrouter) {
                  displaySource = consolidatedModel.sources.find(
                    (s) => s.provider === "openrouter",
                  );
                }
                if (!displaySource) {
                  displaySource = selectBestSource(consolidatedModel, apiKeys);
                }

                const isCurrentModel =
                  currentConsolidatedModel?.baseId === consolidatedModel.baseId;

                const IconComponent = getModelIcon(consolidatedModel.baseId);

                return (
                  <CommandItem
                    key={consolidatedModel.baseId}
                    value={consolidatedModel.name}
                    onSelect={() => handleModelSelect(consolidatedModel)}
                    disabled={!isAnySourceAvailable}
                    className={cn(
                      "mb-1 flex items-center justify-between py-3",
                      !isAnySourceAvailable && "opacity-50",
                      isCurrentModel && "bg-accent",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className="h-4 w-4" />
                      <span className="font-medium">
                        {consolidatedModel.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Provider indicator */}
                      {isAnySourceAvailable && displaySource ? (
                        <div className="flex min-w-[90px] items-center gap-1">
                          {React.createElement(
                            getProviderIcon(displaySource.provider),
                            {
                              className: cn(
                                "h-3 w-3",
                                getProviderColor(displaySource.provider),
                              ),
                            },
                          )}
                          <span className="text-xs font-medium capitalize">
                            {displaySource.provider}
                          </span>
                        </div>
                      ) : (
                        /* Not available indicator */
                        <div className="flex min-w-[90px] items-center gap-1">
                          <Lock className="text-muted-foreground h-3 w-3" />
                          <span className="text-muted-foreground text-xs">
                            API key required
                          </span>
                        </div>
                      )}

                      {/* Current selection indicator */}
                      <CheckIcon
                        className={cn(
                          "h-4 w-4 text-green-600",
                          !isCurrentModel && "invisible",
                        )}
                      />
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>

            {/* Settings link */}
            <CommandGroup heading="Configuration">
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  window.open("/settings", "_blank");
                }}
                className="text-muted-foreground"
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Configure API Keys</span>
                <ArrowRight className="ml-auto h-3 w-3" />
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
