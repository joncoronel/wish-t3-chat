"use client";

import { Upload, FileText, Image, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { useFileUpload, formatBytes } from "@/hooks/use-file-upload";
import { cn } from "@/lib/utils";
import type { FileWithPreview } from "@/hooks/use-file-upload";

interface FileDropZoneProps {
  onFilesSelected: (files: FileWithPreview[]) => void;
  accept?: string;
  maxFiles?: number;
  maxSize?: number;
  multiple?: boolean;
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

export function FileDropZone({
  onFilesSelected,
  accept = "image/*,.pdf,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx",
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  multiple = true,
  className,
  disabled = false,
  isLoading = false,
}: FileDropZoneProps) {
  const [state, actions] = useFileUpload({
    accept,
    maxFiles,
    maxSize,
    multiple,
    onFilesAdded: onFilesSelected,
  });

  const { files, isDragging, errors } = state;
  const {
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    openFileDialog,
    removeFile,
    clearErrors,
    getInputProps,
  } = actions;

  const getFileIcon = (file: FileWithPreview) => {
    const fileType =
      file.file instanceof File ? file.file.type : file.file.type;

    if (fileType.startsWith("image/")) {
      return <Image className="h-5 w-5 text-green-600 dark:text-green-400" />;
    }

    return (
      <FileText className="h-5 w-5 text-[color-mix(in_oklch,_hsl(var(--primary))_75%,_black)] dark:text-[color-mix(in_oklch,_hsl(var(--primary))_60%,_white)]" />
    );
  };

  const getFileSize = (file: FileWithPreview) => {
    return file.file instanceof File ? file.file.size : file.file.size;
  };

  const getFileName = (file: FileWithPreview) => {
    return file.file instanceof File ? file.file.name : file.file.name;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <Card
        className={cn(
          "relative overflow-hidden transition-all duration-200",
          "border-muted-foreground/25 border-2 border-dashed",
          "hover:border-muted-foreground/50",
          isDragging && "border-primary bg-primary/5",
          disabled && "cursor-not-allowed opacity-50",
          !disabled && "cursor-pointer",
        )}
        onDragEnter={disabled ? undefined : handleDragEnter}
        onDragLeave={disabled ? undefined : handleDragLeave}
        onDragOver={disabled ? undefined : handleDragOver}
        onDrop={disabled ? undefined : handleDrop}
        onClick={disabled ? undefined : openFileDialog}
      >
        <div className="p-8 text-center">
          <div className="bg-muted mx-auto flex h-12 w-12 items-center justify-center rounded-full">
            {isLoading ? (
              <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
            ) : (
              <Upload
                className={cn(
                  "h-6 w-6",
                  isDragging ? "text-primary" : "text-muted-foreground",
                )}
              />
            )}
          </div>

          <div className="mt-4">
            <p className="text-sm font-medium">
              {isLoading
                ? "Uploading files..."
                : isDragging
                  ? "Drop files here"
                  : "Upload files"}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {multiple ? `Up to ${maxFiles} files` : "Single file"} • Max{" "}
              {formatBytes(maxSize)} each
            </p>
            <p className="text-muted-foreground text-xs">
              Supports images, PDFs, and documents
            </p>
          </div>

          {!disabled && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={(e) => {
                e.stopPropagation();
                openFileDialog();
              }}
            >
              Choose Files
            </Button>
          )}
        </div>

        {/* Hidden file input */}
        <input
          {...getInputProps()}
          style={{ display: "none" }}
          disabled={disabled}
        />
      </Card>

      {/* Error Messages */}
      {errors.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/10">
          <div className="p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="text-destructive mt-0.5 h-4 w-4 flex-shrink-0" />
              <div className="flex-1">
                <div className="space-y-1">
                  {errors.map((error, index) => (
                    <div key={index} className="text-destructive text-sm">
                      {error}
                    </div>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearErrors}
                  className="text-destructive mt-2 h-auto p-0 text-xs hover:bg-transparent"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* File Preview List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">
            Attached Files ({files.length})
          </h4>
          <div className="space-y-2">
            {files.map((file) => (
              <Card key={file.id} className="p-3">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {file.preview &&
                    file.file instanceof File &&
                    file.file.type.startsWith("image/") ? (
                      <img
                        src={file.preview}
                        alt={getFileName(file)}
                        className="h-10 w-10 rounded object-cover"
                        onError={() => {
                          // Handle image load error
                        }}
                      />
                    ) : (
                      <div className="bg-muted flex h-10 w-10 items-center justify-center rounded">
                        {getFileIcon(file)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-sm font-medium"
                      title={getFileName(file)}
                    >
                      {getFileName(file)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatBytes(getFileSize(file))}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
