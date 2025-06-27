"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteAllChatsDialog } from "./delete-all-chats-dialog";
import { useConversations } from "@/hooks/use-conversations";
import { Skeleton } from "@/components/ui/skeleton";

interface DataManagementSectionProps {
  userId: string;
}

export function DataManagementSection({ userId }: DataManagementSectionProps) {
  const { data: conversations, isLoading } = useConversations(userId);
  const conversationCount = conversations?.length || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Management</CardTitle>
        <CardDescription>
          Manage your chat history and personal data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Chat History</h3>
                <p className="text-sm text-muted-foreground">
                  {isLoading ? (
                    <Skeleton className="h-4 w-24" />
                  ) : (
                    <>
                      You have {conversationCount} conversation{conversationCount !== 1 ? 's' : ''} in your history.
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="pt-2">
              {isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <DeleteAllChatsDialog
                  userId={userId}
                  totalChats={conversationCount}
                />
              )}
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Deleting your chat history will permanently remove all conversations, messages, and attachments. This action cannot be undone.
        </p>
      </CardContent>
    </Card>
  );
}