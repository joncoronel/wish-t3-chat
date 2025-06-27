import useSWR from "swr";
import { ConversationBranch } from "@/types";

async function fetchBranches(
  conversationId: string,
): Promise<ConversationBranch[]> {
  const response = await fetch(`/api/conversations/${conversationId}/branches`);
  if (!response.ok) {
    if (response.status === 404) {
      // Conversation doesn't exist yet (new chat), return empty branches
      return [];
    }
    throw new Error("Failed to fetch branches");
  }
  const data = await response.json();
  return data.branches;
}

export function useConversationBranches(conversationId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    conversationId ? `branches-${conversationId}` : null,
    conversationId ? () => fetchBranches(conversationId) : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      revalidateIfStale: false,
    },
  );

  const createBranch = async (branchData: {
    branchName: string;
    displayName: string;
    description?: string;
    createdFromMessageId?: string;
    messageIndex?: number;
  }) => {
    // If creating from a specific message, use the message-specific endpoint
    if (branchData.createdFromMessageId) {
      const response = await fetch(
        `/api/messages/${branchData.createdFromMessageId}/branch`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            branchName: branchData.branchName,
            displayName: branchData.displayName,
            description: branchData.description,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create branch");
      }

      const result = await response.json();

      // Optimistically update the cache
      mutate();

      return result.branch;
    } else {
      // Creating a new branch without a specific source message
      // Pass the messageIndex to help determine which messages to copy
      const response = await fetch(
        `/api/conversations/${conversationId}/branches`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            branchName: branchData.branchName,
            displayName: branchData.displayName,
            description: branchData.description,
            messageIndex: branchData.messageIndex,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create branch");
      }

      const result = await response.json();

      // Optimistically update the cache
      mutate();

      return result.branch;
    }
  };

  const updateBranch = async (
    branchName: string,
    updates: {
      displayName?: string;
      description?: string;
      isActive?: boolean;
    },
  ) => {
    const response = await fetch(
      `/api/conversations/${conversationId}/branches`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ branchName, ...updates }),
      },
    );

    if (!response.ok) {
      const responseText = await response.text();

      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { error: `HTTP ${response.status}: ${responseText}` };
      }
      throw new Error(errorData.error || "Failed to update branch");
    }

    const responseText = await response.text();

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (error) {
      console.error("Failed to parse response JSON:", responseText);
      throw new Error("Invalid response format");
    }

    // Optimistically update the cache
    mutate();

    return result.branch;
  };

  const deleteBranch = async (branchName: string) => {
    const response = await fetch(
      `/api/conversations/${conversationId}/branches?branchName=${encodeURIComponent(branchName)}`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete branch");
    }

    // Optimistically update the cache
    mutate();

    return true;
  };

  const setActiveBranch = async (branchName: string) => {
    try {
      const result = await updateBranch(branchName, { isActive: true });
      return result;
    } catch (error) {
      console.error("Error setting active branch:", error);
      throw error;
    }
  };

  const getActiveBranch = () => {
    return data?.find((branch) => branch.is_active);
  };

  return {
    branches: data || [],
    activeBranch: getActiveBranch(),
    isLoading,
    error,
    createBranch,
    updateBranch,
    deleteBranch,
    setActiveBranch,
    mutate,
  };
}
