"use client";

import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  Zap,
  Brain,
  Sparkles,
  CheckIcon,
  Bot,
  Search,
} from "lucide-react";
import { AI_MODELS, type AIModel } from "@/lib/ai";
import { cn } from "@/lib/utils";

interface ModelSelectorProps {
  selectedModel: string;
  onModelSelect: (modelId: string) => void;
  disabled?: boolean;
  className?: string;
}

const MODEL_ICONS = {
  // OpenAI models
  "gpt-4": Brain,
  "gpt-4-turbo": Sparkles,
  "gpt-3.5-turbo": Zap,

  // Anthropic models
  "claude-3-5-sonnet-20241022": Bot,
  "claude-3-5-haiku-20241022": Bot,
  "claude-3-opus-20240229": Bot,

  // Google models
  "gemini-1.5-pro": Search,
  "gemini-1.5-flash": Search,
  "gemini-2.0-flash-exp": Search,
} as const;

function getModelIcon(modelId: string) {
  const IconComponent =
    MODEL_ICONS[modelId as keyof typeof MODEL_ICONS] || Brain;
  return IconComponent;
}

function formatModelName(model: AIModel) {
  return model.name;
}

function getModelBadgeVariant(modelId: string) {
  if (modelId.includes("gpt-4")) return "default";
  if (modelId.includes("gpt-3.5")) return "secondary";
  if (modelId.includes("claude")) return "outline";
  if (modelId.includes("gemini")) return "destructive";
  return "outline";
}

function getProviderColor(provider: string) {
  switch (provider.toLowerCase()) {
    case "openai":
      return "text-green-600 dark:text-green-400";
    case "anthropic":
      return "text-orange-600 dark:text-orange-400";
    case "google":
      return "text-blue-600 dark:text-blue-400";
    default:
      return "text-gray-600 dark:text-gray-400";
  }
}

// Group models by provider
function groupModelsByProvider(models: AIModel[]) {
  const groups: Record<string, AIModel[]> = {};

  models.forEach((model) => {
    const provider =
      model.provider.charAt(0).toUpperCase() + model.provider.slice(1);
    if (!groups[provider]) {
      groups[provider] = [];
    }
    groups[provider].push(model);
  });

  return groups;
}

export function ModelSelector({
  selectedModel,
  onModelSelect,
  disabled = false,
  className,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);

  const currentModel = AI_MODELS.find((model) => model.id === selectedModel);
  const IconComponent = getModelIcon(selectedModel);
  const groupedModels = groupModelsByProvider(AI_MODELS);

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
            <IconComponent
              className={cn(
                "h-4 w-4",
                currentModel && getProviderColor(currentModel.provider),
              )}
            />
            <span className="text-sm font-medium">
              {currentModel ? formatModelName(currentModel) : selectedModel}
            </span>
            <Badge
              variant={getModelBadgeVariant(selectedModel)}
              className="text-xs"
            >
              {currentModel?.provider.toUpperCase()}
            </Badge>
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

            {Object.entries(groupedModels).map(([provider, models]) => (
              <CommandGroup key={provider} heading={provider}>
                {models.map((model) => {
                  const ModelIcon = getModelIcon(model.id);
                  const isSelected = model.id === selectedModel;

                  return (
                    <CommandItem
                      key={model.id}
                      value={`${model.name} ${model.provider} ${model.id}`}
                      onSelect={() => {
                        onModelSelect(model.id);
                        setOpen(false);
                      }}
                      className={cn(
                        "mb-1 flex flex-col items-start gap-1 rounded-md p-3",
                        isSelected && "bg-accent border-l-primary border-l-2",
                      )}
                    >
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ModelIcon
                            className={cn(
                              "h-4 w-4",
                              isSelected
                                ? "text-primary"
                                : getProviderColor(model.provider),
                            )}
                          />
                          <span
                            className={cn(
                              "font-medium",
                              isSelected && "text-primary font-semibold",
                            )}
                          >
                            {formatModelName(model)}
                          </span>
                          {isSelected && (
                            <CheckIcon className="text-primary ml-auto h-4 w-4" />
                          )}
                        </div>
                        <Badge
                          variant={
                            isSelected
                              ? "default"
                              : getModelBadgeVariant(model.id)
                          }
                          className="text-xs"
                        >
                          {model.provider.toUpperCase()}
                        </Badge>
                      </div>

                      <p className="text-muted-foreground text-xs">
                        {model.description}
                      </p>

                      <div className="flex w-full items-center justify-between text-xs">
                        <div className="text-muted-foreground">
                          Max tokens: {model.maxTokens.toLocaleString()}
                        </div>
                        <div className="text-muted-foreground">
                          ${model.costPer1kTokens.input}/$
                          {model.costPer1kTokens.output} per 1K tokens
                        </div>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
