"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import {
  useConversations,
  deleteConversation,
} from "@/hooks/use-conversations";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface DeleteConversationDialogProps {
  conversationId: string;
  conversationTitle: string;
  userId: string;
  currentChatId?: string | null;
  className?: string;
  variant?: "ghost" | "destructive";
  size?: "sm" | "default";
}

export function DeleteConversationDialog({
  conversationId,
  conversationTitle,
  userId,
  currentChatId,
  className,
  variant = "ghost",
  size = "sm",
}: DeleteConversationDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Get cached conversations data
  const { data: conversations } = useConversations(userId);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteConversation(conversationId, userId, conversations);

      // If we're currently viewing the deleted conversation, redirect to chat page
      if (currentChatId === conversationId) {
        router.push("/chat");
      }

      toast.success("Conversation deleted successfully");
      setOpen(false);
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Failed to delete conversation");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isDeleting) {
      setOpen(newOpen);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn(
            "h-7 w-7 p-0 opacity-0 transition-opacity group-hover:opacity-100",
            className,
          )}
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering conversation selection
          }}
          title="Delete conversation"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &ldquo;
            {conversationTitle || "Untitled Chat"}&rdquo;? This action cannot be
            undone and will permanently remove the conversation and all its
            messages.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
