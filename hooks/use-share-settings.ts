import useSWR, { mutate } from "swr";

export interface SharedBranch {
  branch_name: string;
  share_token: string;
  share_url: string;
  expires_at: string | null;
  view_count: number;
}

export interface ShareSettings {
  is_shared: boolean;
  shared_branches?: SharedBranch[];
  has_password: boolean;
}

async function fetchShareSettings(conversationId: string): Promise<ShareSettings> {
  const response = await fetch(`/api/conversations/${conversationId}/share`);
  
  if (!response.ok) {
    throw new Error("Failed to fetch share settings");
  }
  
  return response.json();
}

export function useShareSettings(conversationId: string, userId?: string) {
  const { data, error, isLoading, mutate: mutateShareSettings } = useSWR(
    conversationId ? `share-settings-${conversationId}` : null,
    conversationId ? () => fetchShareSettings(conversationId) : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    }
  );

  const updateShareSettings = async (
    branchName: string,
    isPublic: boolean,
    expiresAt?: string
  ) => {
    const response = await fetch(`/api/conversations/${conversationId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        is_public: isPublic,
        expires_at: expiresAt,
        branch_name: branchName,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to update share settings");
    }

    // Revalidate the cache
    mutateShareSettings();
    
    // Also invalidate conversations cache to update "shared" status in sidebar
    if (userId) {
      mutate(`conversations-${userId}`);
    }
    
    return response.json();
  };

  const disableBranchShare = async (branchName: string) => {
    const response = await fetch(
      `/api/conversations/${conversationId}/share?branch_name=${encodeURIComponent(branchName)}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to disable branch sharing");
    }

    // Revalidate the cache
    mutateShareSettings();
    
    // Also invalidate conversations cache to update "shared" status in sidebar
    if (userId) {
      mutate(`conversations-${userId}`);
    }
    
    return response.json();
  };

  const disableAllSharing = async () => {
    const response = await fetch(`/api/conversations/${conversationId}/share`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to disable sharing");
    }

    // Revalidate the cache
    mutateShareSettings();
    
    // Also invalidate conversations cache to update "shared" status in sidebar
    if (userId) {
      mutate(`conversations-${userId}`);
    }
    
    return response.json();
  };

  return {
    shareSettings: data || { is_shared: false, shared_branches: [], has_password: false },
    isLoading,
    error,
    updateShareSettings,
    disableBranchShare,
    disableAllSharing,
    mutateShareSettings,
  };
}

// Helper function to invalidate share settings cache
export function invalidateShareSettings(conversationId: string) {
  mutate(`share-settings-${conversationId}`);
}