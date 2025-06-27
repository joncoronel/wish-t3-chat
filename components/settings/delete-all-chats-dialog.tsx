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
import { deleteAllConversations } from "@/hooks/use-conversations";
import { toast } from "sonner";
import { useChatUrl } from "@/hooks/use-chat-url";
import { cn } from "@/lib/utils";

interface DeleteAllChatsDialogProps {
  userId: string;
  totalChats: number;
  className?: string;
}

export function DeleteAllChatsDialog({
  userId,
  totalChats,
  className,
}: DeleteAllChatsDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const { navigateToNewChat } = useChatUrl();

  const isConfirmValid = confirmText === "DELETE ALL";

  const handleDelete = async () => {
    if (!isConfirmValid) return;
    
    setIsDeleting(true);
    try {
      await deleteAllConversations(userId);
      
      // Navigate to new chat since all conversations are deleted
      navigateToNewChat();
      
      toast.success("All conversations deleted successfully");
      setOpen(false);
      setConfirmText("");
    } catch (error) {
      console.error("Error deleting all conversations:", error);
      toast.error("Failed to delete all conversations");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isDeleting) {
      setOpen(newOpen);
      if (!newOpen) {
        setConfirmText("");
      }
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          className={cn("w-full", className)}
          disabled={totalChats === 0}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete All Chats
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete All Conversations</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete all {totalChats} conversation{totalChats !== 1 ? 's' : ''}? 
            This action cannot be undone and will permanently remove all your conversations, 
            messages, and attachments.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4">
          <p className="text-sm font-semibold text-destructive">
            This is a destructive action that will delete ALL your chat history.
          </p>
          <div className="space-y-2">
            <label htmlFor="confirm" className="text-sm font-medium">
              Type <span className="font-mono font-bold">DELETE ALL</span> to confirm:
            </label>
            <input
              id="confirm"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE ALL"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isDeleting}
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting || !isConfirmValid}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete All"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}