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
import { Trash2, AlertTriangle } from "lucide-react";
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
      <AlertDialogContent className="w-[calc(100%-2rem)] max-w-[425px]">
        <AlertDialogHeader className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="bg-destructive/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
              <AlertTriangle className="text-destructive h-5 w-5" />
            </div>
            <div className="space-y-1">
              <AlertDialogTitle>Delete All Conversations</AlertDialogTitle>
              <AlertDialogDescription>
                Permanently delete {totalChats} conversation
                {totalChats !== 1 ? "s" : ""}? This cannot be undone.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="mt-4 space-y-4">
          <div className="bg-destructive/5 rounded-md p-3 text-sm">
            <p className="text-destructive mb-1 font-medium">
              This will delete:
            </p>
            <ul className="text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <span className="text-destructive">•</span>
                All conversations and messages
              </li>
              <li className="flex items-center gap-2">
                <span className="text-destructive">•</span>
                All file attachments
              </li>
              <li className="flex items-center gap-2">
                <span className="text-destructive">•</span>
                Complete chat history
              </li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <label htmlFor="confirm" className="block text-sm font-medium">
              Type{" "}
              <code className="bg-muted rounded px-1 py-0.5 text-xs">
                DELETE ALL
              </code>{" "}
              to confirm
            </label>
            <input
              id="confirm"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE ALL"
              className={cn(
                "bg-muted/30 placeholder:text-muted-foreground flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
                isConfirmValid
                  ? "border-destructive ring-destructive text-destructive"
                  : "border-border focus-visible:border-ring focus-visible:ring-ring",
              )}
              disabled={isDeleting}
              autoComplete="off"
            />
          </div>
        </div>

        <AlertDialogFooter className="mt-6">
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
