"use client";

import { PersonaWithMemories } from "@/types/persona";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash, MessageSquare, Sparkles } from "lucide-react";

interface PersonaCardProps {
  persona: PersonaWithMemories;
  onEdit: (persona: PersonaWithMemories) => void;
  onDelete: (id: string) => void;
  onSelect?: (persona: PersonaWithMemories) => void;
  isSelected?: boolean;
}

export function PersonaCard({ persona, onEdit, onDelete, onSelect, isSelected }: PersonaCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className={`transition-all ${isSelected ? "ring-2 ring-primary" : ""} ${onSelect ? "cursor-pointer hover:shadow-lg" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={persona.avatar_url || undefined} alt={persona.name} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                {getInitials(persona.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {persona.name}
                {persona.is_default && (
                  <Badge variant="secondary" className="text-xs">
                    Default
                  </Badge>
                )}
              </CardTitle>
              {persona.description && (
                <CardDescription className="mt-1 line-clamp-2">
                  {persona.description}
                </CardDescription>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Temp: {persona.temperature}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{persona.recentConversations || 0} conversations</span>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-3">
          {persona.system_prompt}
        </p>
      </CardContent>
      
      <CardFooter className="pt-3 flex justify-between">
        {onSelect ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onSelect(persona)}
          >
            Select Persona
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(persona)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(persona.id)}
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}