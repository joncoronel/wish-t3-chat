"use client";

import { useState } from "react";
import Link from "next/link";
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
          className={cn("h-9 justify-between px-3", className)}
        >
          {selectedPersona ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={selectedPersona.avatar_url || undefined} />
                <AvatarFallback className="text-[10px] font-medium">
                  {getInitials(selectedPersona.name)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate text-sm font-medium">{selectedPersona.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-sm">Select persona</span>
            </div>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-1.5">
        <div className="max-h-[400px] overflow-auto">
          {/* Default option - no persona */}
          <div
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-accent",
              !selectedPersona && "bg-accent",
            )}
            onClick={() => {
              onSelect(null);
              setOpen(false);
            }}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-0.5">
              <div className="text-sm font-medium">Default Assistant</div>
              <div className="text-xs text-muted-foreground">
                Standard AI without custom personality
              </div>
            </div>
            {!selectedPersona && <Check className="h-4 w-4 text-primary" />}
          </div>

          {personas.length > 0 && (
            <>
              <div className="my-2 h-px bg-border" />
              <div className="px-3 pb-1.5 pt-2 text-xs font-semibold text-muted-foreground">
                YOUR PERSONAS
              </div>
            </>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>
          ) : (
            personas.map((persona) => (
              <div
                key={persona.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-accent",
                  selectedPersona?.id === persona.id && "bg-accent",
                )}
                onClick={() => {
                  onSelect(persona);
                  setOpen(false);
                }}
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={persona.avatar_url || undefined} />
                  <AvatarFallback className="text-xs font-medium">
                    {getInitials(persona.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{persona.name}</span>
                    {persona.is_default && (
                      <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                        Default
                      </Badge>
                    )}
                  </div>
                  {persona.description && (
                    <div className="truncate text-xs text-muted-foreground">
                      {persona.description}
                    </div>
                  )}
                </div>
                {selectedPersona?.id === persona.id && (
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                )}
              </div>
            ))
          )}

          <div className="mt-1.5 border-t pt-1.5">
            <Button
              variant="ghost"
              className="w-full justify-start rounded-md px-3 py-2.5 hover:bg-accent"
              onClick={() => setOpen(false)}
              asChild
            >
              <Link href="/settings/personas" className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30">
                  <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium">Manage Personas</span>
              </Link>
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
