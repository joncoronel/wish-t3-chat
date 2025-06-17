"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Square, Paperclip } from "lucide-react";
import { ModelSelector } from "./model-selector";
import { useGlobalModel } from "@/hooks/use-global-model";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onStopStreaming?: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function ChatInput({
  onSendMessage,
  onStopStreaming,
  isStreaming = false,
  disabled = false,
  placeholder = "Type your message...",
  className,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { selectedModel, selectModel } = useGlobalModel();

  const handleSubmit = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled && !isStreaming) {
      onSendMessage(trimmedMessage);
      setMessage("");

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
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
    <div className={cn("flex justify-center p-4 pb-6", className)}>
      <div className="w-full max-w-3xl">
        <div className="bg-background overflow-hidden rounded-2xl border shadow-lg">
          {/* Message input area */}
          <div className="px-4 pt-3 pb-2">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                className="placeholder:text-muted-foreground max-h-40 min-h-[3rem] resize-none overflow-y-auto border-0 bg-transparent p-0 text-base shadow-none outline-none focus:border-0 focus:shadow-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
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
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 rounded-full p-0"
                disabled={disabled || isStreaming}
                title="Attach file"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
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
                disabled={disabled || !message.trim()}
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
