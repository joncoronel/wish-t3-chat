"use client";

import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ScrollToBottomButtonProps {
  isVisible: boolean;
  onClick: () => void;
  className?: string;
}

export function ScrollToBottomButton({ 
  isVisible, 
  onClick, 
  className 
}: ScrollToBottomButtonProps) {
  return (
    <div
      className={cn(
        "absolute bottom-32 left-1/2 -translate-x-1/2 z-30 transition-all duration-200",
        isVisible 
          ? "translate-y-0 opacity-100" 
          : "translate-y-2 opacity-0 pointer-events-none",
        className
      )}
    >
      <Button
        onClick={onClick}
        size="sm"
        variant="outline"
        className="h-8 rounded-full pl-3 pr-4 shadow-md hover:shadow-lg bg-background/95 backdrop-blur-sm border-border/50"
        aria-label="Scroll to bottom"
      >
        <ArrowDown className="h-3.5 w-3.5 mr-1.5" />
        <span className="text-xs font-medium">Jump to bottom</span>
      </Button>
    </div>
  );
}