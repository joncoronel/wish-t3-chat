import useSWR from "swr";
import { Message } from "@/types";

async function fetchBranchMessages(
  conversationId: string,
  branchName: string,
): Promise<Message[]> {
  const response = await fetch(
    `/api/conversations/${conversationId}/messages?branch=${encodeURIComponent(branchName)}`,
  );
  if (!response.ok) {
    throw new Error("Failed to fetch branch messages");
  }
  const data = await response.json();
  return data.messages;
}

export function useBranchMessages(
  conversationId: string,
  branchName: string = "main",
) {
  const { data, error, isLoading, mutate } = useSWR(
    conversationId && branchName
      ? `messages-${conversationId}-${branchName}`
      : null,
    () => fetchBranchMessages(conversationId, branchName),
    {
      revalidateOnMount: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  return {
    messages: data || [],
    isLoading,
    error,
    mutate,
  };
}
