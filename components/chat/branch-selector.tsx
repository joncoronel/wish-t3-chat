"use client";

import { useState } from "react";
import { useAtom } from "jotai";
import { Check, ChevronDown, GitBranch, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useConversationBranches } from "@/hooks/use-conversation-branches";
import { getActiveBranchAtom } from "@/store/branch";
import { CreateBranchDialog } from "./create-branch-dialog";
import { cn } from "@/lib/utils";

interface BranchSelectorProps {
  conversationId: string;
  className?: string;
  onBranchChange?: (branchName: string) => void;
}

export function BranchSelector({ 
  conversationId, 
  className,
  onBranchChange 
}: BranchSelectorProps) {
  const [activeBranch, setActiveBranch] = useAtom(getActiveBranchAtom(conversationId || ""));
  const { branches, isLoading } = useConversationBranches(conversationId || "");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Don't render if no conversation ID
  if (!conversationId) {
    return null;
  }

  const currentBranch = branches?.find(b => b.branch_name === activeBranch);
  const displayName = currentBranch?.display_name || (typeof activeBranch === "string" ? activeBranch : "main");

  const handleBranchChange = (branchName: string) => {
    if (branchName === activeBranch) return;

    // Update local state immediately for instant responsiveness
    setActiveBranch(branchName);
    
    // Notify parent component immediately
    onBranchChange?.(branchName);
    
    // Note: We're not updating the server anymore since the active branch
    // is just UI state and doesn't need to be persisted
  };

  if (isLoading || !branches || branches.length <= 1) {
    return null; // Don't show selector if loading, no branches, or only main branch
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("h-8 w-auto px-2 gap-1.5", className)}
          >
            <GitBranch className="h-4 w-4 flex-shrink-0" />
            <span className="truncate text-sm font-medium">{displayName}</span>
            <Badge variant="secondary" className="ml-0.5 text-xs px-1 py-0 h-4">
              {currentBranch?.message_count || 0}
            </Badge>
            <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {branches.map((branch) => (
            <DropdownMenuItem
              key={branch.id}
              onClick={() => handleBranchChange(branch.branch_name)}
              className="flex items-center gap-2 p-3"
            >
              <div className="flex items-center gap-2 flex-1">
                <GitBranch className="h-3 w-3" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {branch.display_name}
                    </span>
                    {branch.branch_name === activeBranch && (
                      <Check className="h-3 w-3 text-green-600" />
                    )}
                  </div>
                  {branch.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {branch.description}
                    </p>
                  )}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {branch.message_count}
                </Badge>
              </div>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2 p-3 text-blue-600"
          >
            <Plus className="h-3 w-3" />
            <span className="text-sm">Create Branch</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateBranchDialog
        conversationId={conversationId}
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </>
  );
}