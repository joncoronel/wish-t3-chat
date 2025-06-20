"use client";

import { useState } from "react";
import { FileText, Download, X, Eye, Image, FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatBytes } from "@/hooks/use-file-upload";
import { cn } from "@/lib/utils";
import type { ChatAttachment } from "@/types";

interface FileAttachmentProps {
  attachment: ChatAttachment;
  onRemove?: () => void;
  showRemove?: boolean;
  className?: string;
}

export function FileAttachment({
  attachment,
  onRemove,
  showRemove = false,
  className,
}: FileAttachmentProps) {
  const [imageError, setImageError] = useState(false);

  const isImage =
    attachment.type === "image" || attachment.mime_type.startsWith("image/");
  const isPDF = attachment.mime_type === "application/pdf";

  const getFileIcon = () => {
    if (isImage && !imageError) {
      return <Image className="h-4 w-4" />;
    }
    if (isPDF) {
      return <FileText className="h-4 w-4" />;
    }
    return <FileIcon className="h-4 w-4" />;
  };

  const getFileTypeColor = () => {
    if (isImage)
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (isPDF)
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    return "bg-[color-mix(in_oklch,_hsl(var(--primary))_15%,_transparent)] text-[color-mix(in_oklch,_hsl(var(--primary))_85%,_black)] dark:bg-[color-mix(in_oklch,_hsl(var(--primary))_25%,_transparent)] dark:text-[color-mix(in_oklch,_hsl(var(--primary))_70%,_white)]";
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

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = attachment.name;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
      // Fallback to original URL
      const link = document.createElement("a");
      link.href = attachment.url;
      link.download = attachment.name;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderContent = () => {
    if (isImage && !imageError) {
      return (
        <div className="group relative">
          <div className="bg-muted h-32 w-32 overflow-hidden rounded-md">
            <img
              src={attachment.url}
              alt={attachment.name}
              className="h-full w-full object-cover"
              onError={() => setImageError(true)}
            />
          </div>
          {/* Remove button for images when in attachment list */}
          {showRemove && onRemove && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onRemove}
              className="absolute top-2 right-2 z-10 h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
              title="Remove attachment"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <div className="absolute inset-0 flex items-center justify-center gap-1 rounded-md bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-7 px-2 text-xs"
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>{attachment.name}</DialogTitle>
                </DialogHeader>
                <div className="flex justify-center">
                  <img
                    src={attachment.url}
                    alt={attachment.name}
                    className="max-h-[70vh] max-w-full rounded-md object-contain"
                  />
                </div>
              </DialogContent>
            </Dialog>
            <Button
              variant="secondary"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleDownload}
            >
              <Download className="h-3 w-3" />
            </Button>
          </div>
        </div>
      );
    }

    return (
      <Card className={cn("max-w-sm p-3", className)}>
        <div className="flex items-start gap-3">
          <div className="bg-muted flex-shrink-0 rounded-md p-2">
            {getFileIcon()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p
                  className="truncate text-sm font-medium"
                  title={attachment.name}
                >
                  {attachment.name}
                </p>
                <p className="text-muted-foreground text-xs">
                  {formatBytes(attachment.size)}
                </p>
              </div>
              {showRemove && onRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRemove}
                  className="text-muted-foreground hover:text-destructive h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Badge
                variant="secondary"
                className={cn("text-xs", getFileTypeColor())}
              >
                {isPDF ? "PDF" : isImage ? "Image" : "Document"}
              </Badge>
              <div className="flex gap-1">
                {isPDF && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(attachment.url, "_blank")}
                    className="h-6 px-2 text-xs"
                  >
                    <Eye className="mr-1 h-3 w-3" />
                    View
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="h-6 px-2 text-xs"
                >
                  <Download className="mr-1 h-3 w-3" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return <div className={cn("inline-block", className)}>{renderContent()}</div>;
}

interface AttachmentListProps {
  attachments: ChatAttachment[];
  onRemove?: (id: string) => void;
  showRemove?: boolean;
  className?: string;
}

export function AttachmentList({
  attachments,
  onRemove,
  showRemove = false,
  className,
}: AttachmentListProps) {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {attachments.map((attachment) => (
        <FileAttachment
          key={attachment.id}
          attachment={attachment}
          onRemove={onRemove ? () => onRemove(attachment.id) : undefined}
          showRemove={showRemove}
        />
      ))}
    </div>
  );
}
