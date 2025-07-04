"use client";

import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Copy,
  Edit2,
  Trash2,
  FileText,
  Image,
  FileIcon,
  Download,
  GitBranch,
} from "lucide-react";
import { toast } from "sonner";
import type { Message, ChatAttachment } from "@/types";
import { cn } from "@/lib/utils";
import { AIResponse } from "@/components/chat/ai-response";
import { CreateBranchDialog } from "./create-branch-dialog";

// Type for messages from useChat hook
interface UseChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at?: string;
  experimental_attachments?: ChatAttachment[];
}

// Compact file display component for chat messages
function CompactFileAttachment({ attachment }: { attachment: ChatAttachment }) {
  const isImage =
    attachment.type === "image" || attachment.mime_type.startsWith("image/");
  const isPDF = attachment.mime_type === "application/pdf";

  const getFileIcon = () => {
    if (isImage) return <Image className="h-full w-auto" />;
    if (isPDF) return <FileText className="h-full w-auto" />;
    return <FileIcon className="h-full w-auto" />;
  };

  const getFileType = () => {
    if (isPDF) return "PDF";
    if (isImage) return "Image";
    return "Document";
  };

  const handleDownload = async () => {
    try {
      // If URL is expired or not accessible, get a fresh one
      let downloadUrl = attachment.url;

      // Check if the URL is a signed URL that might be expired
      if (attachment.url.includes("token=")) {
        const response = await fetch(`/api/files/${attachment.id}`);
        if (response.ok) {
          const data = await response.json();
          downloadUrl = data.url;
        }
      }

      // Fetch the file as a blob to control the filename
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch file");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.name; // This will now work correctly
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download file");

      // Fallback: try direct link approach
      try {
        let downloadUrl = attachment.url;
        if (attachment.url.includes("token=")) {
          const response = await fetch(`/api/files/${attachment.id}`);
          if (response.ok) {
            const data = await response.json();
            downloadUrl = data.url;
          }
        }

        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = attachment.name;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (fallbackError) {
        console.error("Fallback download also failed:", fallbackError);
        toast.error("Download failed completely");
      }
    }
  };

  // If it's an image, render it directly
  if (isImage) {
    return (
      <div className="group/imageContainer relative max-w-xs">
        <img
          src={attachment.url}
          alt={attachment.name}
          className="max-h-64 w-full rounded-lg object-cover"
          onError={(e) => {
            console.error("Image failed to load:", attachment.url);
            // If image fails to load, show fallback
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = "block";
          }}
        />
        {/* Fallback for failed image loads */}
        <div
          style={{ display: "none" }}
          className="flex items-center gap-3 py-1 text-sm"
        >
          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
            <Image className="h-full w-auto" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{attachment.name}</div>
            <div className="text-xs opacity-70">Image (failed to load)</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-8 w-8 p-0 opacity-70 hover:opacity-100"
            title="Download file"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
        {/* Download button positioned at top-right corner */}
        <Button
          variant="secondary"
          size="sm"
          onClick={handleDownload}
          className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 shadow-lg transition-opacity group-hover/imageContainer:opacity-100"
          title="Download image"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // For non-image files, use the compact card display
  return (
    <div className="flex items-center gap-3 py-1 text-sm">
      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
        {getFileIcon()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{attachment.name}</div>
        <div className="text-xs opacity-70">{getFileType()}</div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDownload}
        className="h-8 w-8 p-0 opacity-70 hover:opacity-100"
        title="Download file"
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface MessageComponentProps {
  message: Message | UseChatMessage;
  conversationId: string;
  isStreaming?: boolean;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  className?: string;
  isDBMessage?: boolean;
  messageIndex?: number; // Position of this message in the conversation
  readOnly?: boolean; // Hide interactive elements for shared/public views
}

export const MessageComponent = memo(function MessageComponent({
  message,
  conversationId,
  isStreaming = false,
  onEdit,
  onDelete,
  className,
  isDBMessage = true,
  messageIndex,
  readOnly = false,
}: MessageComponentProps) {
  const isSystem = message.role === "system";
  const isAssistant = message.role === "assistant";
  const [showCreateBranchDialog, setShowCreateBranchDialog] = useState(false);

  // Convert raw database attachments to ChatAttachment format
  const convertAttachments = (
    rawAttachments: Record<string, unknown>[],
  ): ChatAttachment[] => {
    return rawAttachments.map((attachment) => ({
      id: attachment.id as string,
      type: attachment.type as "image" | "document",
      name: attachment.name as string,
      url: attachment.url as string,
      size: attachment.size as number,
      mime_type: attachment.mime_type as string,
    }));
  };

  // Handle both database messages and useChat messages
  let attachments: ChatAttachment[] | undefined;
  if (
    "experimental_attachments" in message &&
    message.experimental_attachments
  ) {
    attachments = message.experimental_attachments;
  } else if ("attachments" in message && message.attachments) {
    attachments = convertAttachments(message.attachments);
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      toast.success("Message copied to clipboard");
    } catch {
      toast.error("Failed to copy message");
    }
  };

  if (isSystem) {
    return (
      <div className={cn("flex justify-center py-2", className)}>
        <div className="bg-muted text-muted-foreground rounded-lg px-3 py-1 text-sm">
          System: {message.content}
        </div>
      </div>
    );
  }

  // AI Assistant messages - no bubble, no avatar
  if (isAssistant) {
    return (
      <div className={cn("group flex py-4", className)}>
        <div className="flex w-full flex-col">
          <div className="text-sm leading-relaxed">
            <AIResponse className="prose dark:prose-invert prose-sm">
              {message.content + (isStreaming ? " ●" : "")}
            </AIResponse>
          </div>

          {/* Bottom action buttons and timestamp */}
          <div className="mt-3 flex items-center gap-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <div className="text-muted-foreground text-xs">
              {message.created_at
                ? new Date(message.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Just now"}
            </div>

            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleCopy}
                title="Copy message"
              >
                <Copy className="mr-1 h-3 w-3" />
                Copy
              </Button>

              {!readOnly && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setShowCreateBranchDialog(true)}
                  title="Create branch from this message"
                >
                  <GitBranch className="mr-1 h-3 w-3" />
                  Branch
                </Button>
              )}

              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 h-7 px-2 text-xs"
                  onClick={() => onDelete(message.id)}
                  title="Delete message"
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Branch dialog for AI messages */}
        {!readOnly && (
          <CreateBranchDialog
            conversationId={conversationId}
            open={showCreateBranchDialog}
            onOpenChange={setShowCreateBranchDialog}
            fromMessageId={isDBMessage ? message.id : undefined}
            messageIndex={messageIndex}
          />
        )}
      </div>
    );
  }

  // User messages - keep bubble, remove avatar
  return (
    <div className={cn("group flex justify-end gap-3 py-4", className)}>
      <div className="flex max-w-[70%] flex-col items-end space-y-2">
        {/* Show attachments above the message */}
        {attachments && attachments.length > 0 && (
          <div className="space-y-2">
            {attachments.map((attachment) => {
              const isImage =
                attachment.type === "image" ||
                attachment.mime_type.startsWith("image/");

              // Images are displayed directly without a card wrapper
              if (isImage) {
                return (
                  <CompactFileAttachment
                    key={attachment.id}
                    attachment={attachment}
                  />
                );
              }

              // Non-image files get the card wrapper
              return (
                <Card
                  key={attachment.id}
                  className="bg-muted text-muted-foreground border-muted px-3 py-2"
                >
                  <CompactFileAttachment attachment={attachment} />
                </Card>
              );
            })}
          </div>
        )}

        {/* Only show message bubble if there's actual text content */}
        {message.content.trim() && (
          <Card
            className={cn(
              "bg-primary text-primary-foreground relative px-4 py-3",
              isStreaming && "animate-pulse",
            )}
          >
            <div className="text-sm leading-relaxed break-words">
              <div className="whitespace-pre-wrap">
                {message.content}
                {isStreaming && (
                  <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-current" />
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Bottom action buttons and timestamp */}
        <div className="mt-1 flex w-full items-center justify-end gap-2 px-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleCopy}
              title="Copy message"
            >
              <Copy className="mr-1 h-3 w-3" />
              Copy
            </Button>

            {!readOnly && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setShowCreateBranchDialog(true)}
                title="Create branch from this message"
              >
                <GitBranch className="mr-1 h-3 w-3" />
                Branch
              </Button>
            )}

            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => onEdit(message.id)}
                title="Edit message"
              >
                <Edit2 className="mr-1 h-3 w-3" />
                Edit
              </Button>
            )}

            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 h-7 px-2 text-xs"
                onClick={() => onDelete(message.id)}
                title="Delete message"
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Delete
              </Button>
            )}
          </div>

          <div className="text-muted-foreground text-xs">
            {message.created_at
              ? new Date(message.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Just now"}
          </div>
        </div>
      </div>

      {/* Branch dialog for user messages */}
      {!readOnly && (
        <CreateBranchDialog
          conversationId={conversationId}
          open={showCreateBranchDialog}
          onOpenChange={setShowCreateBranchDialog}
          fromMessageId={isDBMessage ? message.id : undefined}
          messageIndex={messageIndex}
        />
      )}
    </div>
  );
});
