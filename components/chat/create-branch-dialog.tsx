"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useConversationBranches } from "@/hooks/use-conversation-branches";
import { toast } from "sonner";

interface CreateBranchDialogProps {
  conversationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromMessageId?: string; // If creating branch from a specific message
  messageIndex?: number; // Position of the message in the conversation
}

export function CreateBranchDialog({
  conversationId,
  open,
  onOpenChange,
  fromMessageId,
  messageIndex,
}: CreateBranchDialogProps) {
  const { createBranch } = useConversationBranches(conversationId);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    branchName: "",
    displayName: "",
    description: "",
  });

  const resetForm = () => {
    setFormData({
      branchName: "",
      displayName: "",
      description: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.branchName.trim() || !formData.displayName.trim()) {
      toast.error("Branch name and display name are required");
      return;
    }

    setIsCreating(true);
    
    try {
      await createBranch({
        branchName: formData.branchName.trim(),
        displayName: formData.displayName.trim(),
        description: formData.description.trim() || undefined,
        createdFromMessageId: fromMessageId,
        messageIndex: messageIndex,
      });

      toast.success("Branch created successfully");
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create branch:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create branch");
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  // Auto-generate branch name from display name
  const handleDisplayNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      displayName: value,
      branchName: prev.branchName || value
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .slice(0, 50),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Branch</DialogTitle>
          <DialogDescription>
            {fromMessageId 
              ? "Create a new conversation branch from this message. The branch will include all conversation history up to this point."
              : "Create a new conversation branch from the current conversation state to explore different directions."
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              placeholder="e.g., Alternative approach"
              value={formData.displayName}
              onChange={(e) => handleDisplayNameChange(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="branchName">Branch Name</Label>
            <Input
              id="branchName"
              placeholder="e.g., alternative-approach"
              value={formData.branchName}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                branchName: e.target.value.toLowerCase().replace(/\s+/g, "-") 
              }))}
              pattern="[a-z0-9-]+"
              title="Only lowercase letters, numbers, and hyphens allowed"
              required
            />
            <p className="text-xs text-muted-foreground">
              Only lowercase letters, numbers, and hyphens allowed
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe what makes this branch different..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                description: e.target.value 
              }))}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Branch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}