"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Globe, Calendar, Eye, GitBranch, RefreshCw } from "lucide-react";
import { MessageComponent } from "@/components/chat/message";
import { useSharedConversation } from "@/hooks/use-shared-conversation";
import type { ChatMessage, ConversationBranch } from "@/types";

export interface SharedConversationData {
  conversation: {
    id: string;
    title: string;
    model: string;
    created_at: string;
    updated_at: string;
  };
  branches: ConversationBranch[];
  messages: Array<{
    id: string;
    role: string;
    content: string;
    created_at: string;
    parent_id: string | null;
    branch_name: string;
    metadata: Record<string, unknown> | null;
    attachments?: Array<{
      id: string;
      filename: string;
      file_type: string;
      file_size: number;
      file_path: string;
      metadata?: {
        extracted_text?: string;
      };
    }>;
  }>;
  view_count: number;
  shared_branch: string;
}

export function SharedConversationView({
  token,
}: {
  token: string;
}) {
  const router = useRouter();
  const [selectedBranch, setSelectedBranch] = useState("main");
  
  const { data, error, isLoading, mutate } = useSharedConversation(token);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Set initial selected branch when data loads
  if (data && selectedBranch === "main" && data.shared_branch !== "main") {
    setSelectedBranch(data.shared_branch);
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await mutate();
    } finally {
      setIsRefreshing(false);
    }
  };


  const getMessagesForBranch = (branchName: string): ChatMessage[] => {
    if (!data) return [];
    
    return data.messages
      .filter((msg) => msg.branch_name === branchName)
      .map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
        timestamp: new Date(msg.created_at),
        metadata: msg.metadata ? {
          model: msg.metadata.model as string | undefined,
          tokens: msg.metadata.tokens as number | undefined,
          cost: msg.metadata.cost as number | undefined,
          tool_calls: msg.metadata.tool_calls as unknown[] | undefined,
        } : undefined,
        attachments: msg.attachments?.map((att) => ({
          id: att.id,
          type: att.file_type.startsWith("image/") ? "image" : 
                att.file_type === "application/pdf" ? "document" : "text",
          name: att.filename,
          url: att.file_path,
          size: att.file_size,
          mime_type: att.file_type,
          extractedText: att.metadata?.extracted_text,
        })),
        parent_id: msg.parent_id || undefined,
        branch_name: msg.branch_name,
      }));
  };

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="h-4 w-4" />
              <span className="font-medium">Loading Shared Conversation...</span>
            </div>
          </div>
        </header>
        <div className="flex items-center justify-center py-32">
          <div className="text-center space-y-4">
            <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full mx-auto" />
            <p className="text-muted-foreground">Loading conversation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="h-4 w-4" />
              <span className="font-medium">Shared Conversation</span>
            </div>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center py-32">
          <Card className="max-w-lg w-full p-8 text-center space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Unable to Load Conversation</h2>
              <p className="text-muted-foreground">{error.message}</p>
            </div>
            <div className="space-y-3">
              <Button onClick={handleRefresh} disabled={isRefreshing} className="w-full">
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Try Again
              </Button>
              <Button onClick={() => router.push("/")} variant="outline" className="w-full">
                Go to Homepage
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }


  if (!data) {
    return null;
  }

  const messages = getMessagesForBranch(selectedBranch);

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Fixed at top */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Globe className="h-4 w-4" />
                <span className="font-medium">Shared Conversation</span>
              </div>
              {data.shared_branch !== "main" && (
                <div className="flex items-center gap-2">
                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <GitBranch className="h-4 w-4" />
                    <span>Branch: {data.branches.find(b => b.branch_name === data.shared_branch)?.display_name || data.shared_branch}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span>{data.view_count} views</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {/* Conversation header */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="text-center space-y-4 pb-8 border-b">
            <h1 className="text-3xl font-bold tracking-tight">{data.conversation.title}</h1>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {data.conversation.model}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(data.conversation.created_at).toLocaleDateString()}</span>
              </div>
              {data.shared_branch !== "main" && (
                <div className="flex items-center gap-1">
                  <GitBranch className="h-4 w-4" />
                  <span>Branch: {data.branches.find(b => b.branch_name === data.shared_branch)?.display_name || data.shared_branch}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="max-w-4xl mx-auto space-y-8">
          {messages.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-muted-foreground space-y-2">
                <GitBranch className="h-12 w-12 mx-auto opacity-50" />
                <h3 className="text-lg font-medium">No messages in this branch</h3>
                <p className="text-sm">This conversation branch appears to be empty.</p>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={message.id}>
                <MessageComponent
                  message={message}
                  conversationId={data.conversation.id}
                  messageIndex={index}
                  readOnly={true}
                />
                {index < messages.length - 1 && (
                  <Separator className="my-8" />
                )}
              </div>
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Globe className="h-4 w-4" />
              <span>This is a read-only view of a shared conversation</span>
            </div>
            {data.view_count > 1 && (
              <p className="text-xs text-muted-foreground">
                This conversation has been viewed {data.view_count} times
              </p>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}