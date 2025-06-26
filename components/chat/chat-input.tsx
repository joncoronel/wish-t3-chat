"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Send, Square, Paperclip } from "lucide-react";
import { ModelSelector } from "./model-selector";
import { FileDropZone } from "./file-drop-zone";
import { AttachmentList } from "./file-attachment";
import { PersonaSelector } from "@/components/personas/persona-selector";
import { useGlobalModel } from "@/hooks/use-global-model";
import { useAtom } from "jotai";
import { selectedPersonaAtom } from "@/store/persona";

import { cn } from "@/lib/utils";
import type { ChatAttachment } from "@/types";
import type { FileWithPreview } from "@/hooks/use-file-upload";

interface ChatInputProps {
  onSendMessage: (message: string, attachments?: ChatAttachment[]) => void;
  onStopStreaming?: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  userId?: string;
}

export function ChatInput({
  onSendMessage,
  onStopStreaming,
  isStreaming = false,
  disabled = false,
  placeholder = "Type your message...",
  className,
  userId,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [showAttachDialog, setShowAttachDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { selectedModel, selectModel } = useGlobalModel();
  const [selectedPersona, setSelectedPersona] = useAtom(selectedPersonaAtom);

  const handleSubmit = () => {
    const trimmedMessage = message.trim();
    if (
      (trimmedMessage || attachments.length > 0) &&
      !disabled &&
      !isStreaming &&
      !isUploading
    ) {
      console.log("Sending message with attachments:", attachments);
      attachments.forEach((att, index) => {
        console.log(`Attachment ${index}:`, {
          name: att.name,
          type: att.type,
          hasExtractedText: !!att.extractedText,
          extractedTextLength: att.extractedText?.length,
        });
      });

      onSendMessage(
        trimmedMessage,
        attachments.length > 0 ? attachments : undefined,
      );
      setMessage("");
      setAttachments([]);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleFilesSelected = async (files: FileWithPreview[]) => {
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      files.forEach((fileWrapper) => {
        if (fileWrapper.file instanceof File) {
          formData.append("files", fileWrapper.file);
        }
      });

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();
      console.log("Upload response:", result);
      if (result.success) {
        console.log("Setting attachments:", result.files);
        result.files.forEach((file: ChatAttachment, index: number) => {
          console.log(`File ${index}:`, {
            name: file.name,
            type: file.type,
            hasExtractedText: !!file.extractedText,
            extractedTextLength: file.extractedText?.length,
            extractedTextPreview: file.extractedText?.substring(0, 100),
          });
        });
        setAttachments((prev) => [...prev, ...result.files]);
        setShowAttachDialog(false);
      }
    } catch (error) {
      console.error("File upload error:", error);
      // You could show a toast error here
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== attachmentId));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  const handleStop = () => {
    if (onStopStreaming) {
      onStopStreaming();
    }
  };

  return (
    <div
      className={cn(
        "animate-in slide-in-from-bottom-4 fade-in pointer-events-none relative flex justify-center p-4 pb-6 duration-200 ease-in-out",
        className,
      )}
    >
      <div className="pointer-events-none w-full max-w-3xl">
        <div className="bg-card pointer-events-auto overflow-hidden rounded-xl border shadow-lg">
          {/* Attachments area */}
          {(attachments.length > 0 || isUploading) && (
            <div className="border-b px-4 pt-3">
              {attachments.length > 0 && (
                <AttachmentList
                  attachments={attachments}
                  onRemove={handleRemoveAttachment}
                  showRemove={true}
                  className="pb-2"
                />
              )}
            </div>
          )}

          {/* Message input area */}
          <div className="px-4 pt-3 pb-2">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder={isUploading ? "Uploading files..." : placeholder}
                disabled={disabled || isUploading}
                className="placeholder:text-muted-foreground max-h-40 min-h-[3rem] resize-none overflow-y-auto border-0 bg-transparent p-0 text-base shadow-none outline-none focus:border-0 focus:shadow-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 [&]:bg-transparent"
                rows={1}
              />
            </div>
          </div>

          {/* Bottom toolbar */}
          <div className="bg-muted/30 flex items-center justify-between border-t px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Model selector */}
              <ModelSelector
                selectedModel={selectedModel}
                onModelSelect={selectModel}
                disabled={disabled || isStreaming}
                className="h-8"
                userId={userId}
              />

              <PersonaSelector
                selectedPersona={selectedPersona}
                onSelect={setSelectedPersona}
                className="h-8"
              />

              {/* Search button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-full px-3 text-sm"
                disabled={disabled || isStreaming}
                title="Search"
              >
                <svg
                  className="mr-1 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                Search
              </Button>

              {/* Attachment button */}
              <Dialog
                open={showAttachDialog}
                onOpenChange={setShowAttachDialog}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 rounded-full p-0"
                    disabled={disabled || isStreaming || isUploading}
                    title={isUploading ? "Uploading..." : "Attach file"}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Upload Files</DialogTitle>
                  </DialogHeader>
                  <FileDropZone
                    onFilesSelected={handleFilesSelected}
                    disabled={isUploading}
                    isLoading={isUploading}
                    maxFiles={5}
                  />
                </DialogContent>
              </Dialog>
            </div>

            {/* Send/Stop button */}
            {isStreaming ? (
              <Button
                onClick={handleStop}
                size="sm"
                variant="destructive"
                className="h-8 w-8 rounded-full p-0 shadow-sm transition-all duration-200 hover:shadow-md"
                title="Stop generation"
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                size="sm"
                disabled={
                  disabled ||
                  (!message.trim() && attachments.length === 0) ||
                  isUploading
                }
                className="bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground h-8 w-8 rounded-full p-0 shadow-sm transition-all duration-200 hover:shadow-md disabled:shadow-none"
                title="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
