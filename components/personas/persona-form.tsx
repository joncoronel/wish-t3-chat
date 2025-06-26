"use client";

import { useState } from "react";
import { PersonaInsert } from "@/types/persona";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PersonaFormProps {
  initialData?: Partial<PersonaInsert>;
  onSubmit: (data: Omit<PersonaInsert, "user_id">) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
}

export function PersonaForm({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false,
}: PersonaFormProps) {
  const [formData, setFormData] = useState<Omit<PersonaInsert, "user_id">>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    system_prompt: initialData?.system_prompt || "",
    avatar_url: initialData?.avatar_url || "",
    temperature: initialData?.temperature || 0.7,
    max_tokens: initialData?.max_tokens || 8192,
    is_default: initialData?.is_default || false,
    metadata: initialData?.metadata || {},
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Basic Information</CardTitle>
          <CardDescription>
            Set up the basic details for your persona
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Professional Assistant"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of this persona"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar_url">Avatar URL</Label>
              <Input
                id="avatar_url"
                type="url"
                value={formData.avatar_url || ""}
                onChange={(e) =>
                  setFormData({ ...formData, avatar_url: e.target.value })
                }
                placeholder="https://example.com/avatar.png"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* System Prompt Section - Takes 2/3 width */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">System Prompt</CardTitle>
              <CardDescription>
                Define how your persona should behave and respond
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="system_prompt">Instructions *</Label>
                <Textarea
                  id="system_prompt"
                  value={formData.system_prompt}
                  onChange={(e) =>
                    setFormData({ ...formData, system_prompt: e.target.value })
                  }
                  placeholder="You are a helpful AI assistant with expertise in... Define the persona's personality, tone, knowledge areas, and how they should respond to different types of questions."
                  rows={16}
                  required
                  className="min-h-[300px] resize-y"
                />
                <p className="text-muted-foreground text-sm">
                  Provide detailed instructions about the persona&apos;s
                  behavior, expertise, communication style, and guidelines.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Section - Takes 1/3 width */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Model Settings</CardTitle>
              <CardDescription>Configure AI behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="temperature">
                    Temperature: {formData.temperature ?? 0.7}
                  </Label>
                  <Slider
                    id="temperature"
                    min={0}
                    max={2}
                    step={0.1}
                    value={[formData.temperature ?? 0.7]}
                    onValueChange={([value]) =>
                      setFormData({ ...formData, temperature: value })
                    }
                    className="w-full"
                  />
                  <p className="text-muted-foreground text-sm">
                    Lower = more focused, Higher = more creative
                  </p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="max_tokens">
                    Max Tokens: {formData.max_tokens ?? 8192}
                  </Label>
                  <Slider
                    id="max_tokens"
                    min={256}
                    max={128000}
                    step={256}
                    value={[formData.max_tokens ?? 8192]}
                    onValueChange={([value]) =>
                      setFormData({ ...formData, max_tokens: value })
                    }
                    className="w-full"
                  />
                  <p className="text-muted-foreground text-sm">
                    Maximum response length
                  </p>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-start space-x-3">
                    <Switch
                      id="is_default"
                      checked={formData.is_default}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_default: checked })
                      }
                      className="mt-1"
                    />
                    <div className="space-y-1">
                      <Label
                        htmlFor="is_default"
                        className="text-sm font-medium"
                      >
                        Default persona
                      </Label>
                      <p className="text-muted-foreground text-xs">
                        Auto-select for new conversations
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : isEdit
              ? "Update Persona"
              : "Create Persona"}
        </Button>
      </div>
    </form>
  );
}
