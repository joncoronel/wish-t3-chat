"use client";

import { Button } from "@/components/ui/button";
import { Share, Settings, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

interface ChatHeaderProps {
  onShare?: () => void;
  onSettings?: () => void;
}

export function ChatHeader({ onShare, onSettings }: ChatHeaderProps) {
  const handleShare = () => {
    if (onShare) {
      onShare();
    } else {
      toast.info("Sharing feature coming soon!");
    }
  };

  const handleSettings = () => {
    if (onSettings) {
      onSettings();
    } else {
      toast.info("Settings panel coming soon!");
    }
  };

  return (
    <div className="flex h-16 flex-shrink-0 items-center justify-end border-b px-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={handleSettings}>
          <Settings className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={handleShare}>
          <Share className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
