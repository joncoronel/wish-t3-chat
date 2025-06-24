"use client";

import { ChevronDown } from "lucide-react";
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
        "fixed bottom-24 right-6 z-20 transition-all duration-300 ease-in-out",
        isVisible 
          ? "translate-y-0 opacity-100" 
          : "translate-y-2 opacity-0 pointer-events-none",
        className
      )}
    >
      <Button
        onClick={onClick}
        size="sm"
        variant="secondary"
        className="h-10 w-10 rounded-full p-0 shadow-lg hover:shadow-xl"
        aria-label="Scroll to bottom"
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  );
}