"use client";

import { useState } from "react";
import { usePersonas } from "@/hooks/use-personas";
import { Persona } from "@/types/persona";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronDown, Plus, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface PersonaSelectorProps {
  selectedPersona?: Persona | null;
  onSelect: (persona: Persona | null) => void;
  className?: string;
}

export function PersonaSelector({
  selectedPersona,
  onSelect,
  className,
}: PersonaSelectorProps) {
  const { personas, isLoading } = usePersonas();
  const [open, setOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
        >
          {selectedPersona ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={selectedPersona.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {getInitials(selectedPersona.name)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{selectedPersona.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Select persona</span>
            </div>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <div className="max-h-[400px] overflow-auto">
          {/* Default option - no persona */}
          <div
            className={cn(
              "hover:bg-accent flex cursor-pointer items-center gap-3 px-3 py-2",
              !selectedPersona && "bg-accent",
            )}
            onClick={() => {
              onSelect(null);
              setOpen(false);
            }}
          >
            <div className="flex-1">
              <div className="font-medium">Default AI</div>
              <div className="text-muted-foreground text-xs">
                Use the standard AI without a specific persona
              </div>
            </div>
            {!selectedPersona && <Check className="h-4 w-4" />}
          </div>

          {personas.length > 0 && (
            <>
              <div className="my-1 border-t" />
              <div className="text-muted-foreground px-3 py-1.5 text-xs font-medium">
                Your Personas
              </div>
            </>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="border-primary h-5 w-5 animate-spin rounded-full border-b-2"></div>
            </div>
          ) : (
            personas.map((persona) => (
              <div
                key={persona.id}
                className={cn(
                  "hover:bg-accent flex cursor-pointer items-center gap-3 px-3 py-2",
                  selectedPersona?.id === persona.id && "bg-accent",
                )}
                onClick={() => {
                  onSelect(persona);
                  setOpen(false);
                }}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={persona.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(persona.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="truncate">{persona.name}</span>
                    {persona.is_default && (
                      <Badge variant="secondary" className="text-xs">
                        Default
                      </Badge>
                    )}
                  </div>
                  {persona.description && (
                    <div className="text-muted-foreground truncate text-xs">
                      {persona.description}
                    </div>
                  )}
                </div>
                {selectedPersona?.id === persona.id && (
                  <Check className="h-4 w-4 shrink-0" />
                )}
              </div>
            ))
          )}

          <div className="mt-1 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                setOpen(false);
                // Navigate to personas page
                window.location.href = "/personas";
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Manage Personas
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
