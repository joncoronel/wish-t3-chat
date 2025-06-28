"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy, Globe, Calendar, Eye, GitBranch } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useConversationBranches } from "@/hooks/use-conversation-branches";
import { useShareSettings } from "@/hooks/use-share-settings";
import { useAtom } from "jotai";
import { getActiveBranchAtom } from "@/store/branch";

interface ShareDialogProps {
  conversationId: string;
  conversationTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
}

export function ShareDialog({
  conversationId,
  conversationTitle,
  open,
  onOpenChange,
  userId,
}: ShareDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    expires_in_days: 0,
    branch_name: "main",
  });

  // Fetch conversation branches and share settings
  const { branches } = useConversationBranches(conversationId);
  const {
    shareSettings,
    isLoading,
    updateShareSettings,
    disableBranchShare,
    disableAllSharing,
  } = useShareSettings(conversationId, userId);
  
  // Get current active branch
  const [activeBranch] = useAtom(getActiveBranchAtom(conversationId));
  const currentBranch = typeof activeBranch === "string" ? activeBranch : "main";

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        expires_in_days: 0,
        branch_name: currentBranch,
      });
    }
  }, [open, currentBranch]);

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      let expires_at = null;
      if (formData.expires_in_days > 0) {
        const date = new Date();
        date.setDate(date.getDate() + formData.expires_in_days);
        expires_at = date.toISOString();
      }

      await updateShareSettings(
        formData.branch_name,
        true, // Always enable sharing when submitting
        expires_at || undefined,
      );

      toast.success(`Branch "${formData.branch_name}" is now shared`);

      // Reset form
      setFormData({
        expires_in_days: 0,
        branch_name: "main",
      });
    } catch (error) {
      console.error("Failed to update share settings:", error);
      toast.error("Failed to update share settings");
    } finally {
      setIsSaving(false);
    }
  };

  const copyShareLink = async (url?: string) => {
    const urlToCopy = url || shareSettings.shared_branches?.[0]?.share_url;
    if (urlToCopy) {
      try {
        await navigator.clipboard.writeText(urlToCopy);
        toast.success("Share link copied to clipboard");
      } catch {
        toast.error("Failed to copy link");
      }
    }
  };

  const handleDisableSharing = async () => {
    setIsSaving(true);
    try {
      await disableAllSharing();
      setFormData({
        expires_in_days: 0,
        branch_name: "main",
      });
      toast.success("All sharing disabled");
    } catch (error) {
      console.error("Failed to disable sharing:", error);
      toast.error("Failed to disable sharing");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisableBranchShare = async (branchName: string) => {
    setIsSaving(true);
    try {
      await disableBranchShare(branchName);
      toast.success(`Sharing disabled for branch "${branchName}"`);
    } catch (error) {
      console.error("Failed to disable branch sharing:", error);
      toast.error("Failed to disable branch sharing");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share Conversation</DialogTitle>
          <DialogDescription>
            Share &ldquo;{conversationTitle}&rdquo; with others via a public
            link.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Share Status */}
            {shareSettings.is_shared &&
              shareSettings.shared_branches &&
              shareSettings.shared_branches.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Globe className="h-4 w-4" />
                    Shared Branches ({shareSettings.shared_branches.length})
                  </div>

                  {shareSettings.shared_branches.map((branch) => {
                    const branchDisplayName =
                      branches.find((b) => b.branch_name === branch.branch_name)
                        ?.display_name || branch.branch_name;

                    return (
                      <div
                        key={branch.branch_name}
                        className="bg-muted/50 space-y-3 rounded-lg border p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            <div className="flex items-center gap-2 font-medium">
                              <GitBranch className="h-4 w-4" />
                              {branchDisplayName}
                              {branch.branch_name === "main" && (
                                <span className="text-muted-foreground text-xs">
                                  (main)
                                </span>
                              )}
                            </div>
                            {branch.expires_at ? (
                              <span className="rounded-md bg-amber-100 px-2 py-1 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                Expires{" "}
                                {new Date(
                                  branch.expires_at,
                                ).toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="rounded-md bg-green-100 px-2 py-1 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                No expiration
                              </span>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              handleDisableBranchShare(branch.branch_name)
                            }
                            disabled={isSaving}
                          >
                            Disable
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              value={branch.share_url}
                              readOnly
                              className="font-mono text-sm"
                            />
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => copyShareLink(branch.share_url)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="text-muted-foreground flex items-center gap-4 text-xs">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {branch.view_count} views
                            </span>
                            {branch.expires_at && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Expires{" "}
                                {new Date(
                                  branch.expires_at,
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            <Separator />

            {/* Branch Sharing Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Share a branch</Label>
                <p className="text-muted-foreground text-sm">
                  Create a public link for others to view a specific branch
                </p>
              </div>

              {/* Branch Selection */}
              <div className="space-y-2">
                <Label htmlFor="branch-select">Select branch to share</Label>
                <Select
                  value={formData.branch_name}
                  onValueChange={(value) =>
                    setFormData({ ...formData, branch_name: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => {
                      const isAlreadyShared =
                        shareSettings.shared_branches?.some(
                          (sb) => sb.branch_name === branch.branch_name,
                        );
                      return (
                        <SelectItem
                          key={branch.branch_name}
                          value={branch.branch_name}
                        >
                          <div className="flex items-center gap-2">
                            <GitBranch className="h-3 w-3" />
                            <span>
                              {branch.display_name || branch.branch_name}
                            </span>
                            {branch.branch_name === currentBranch && (
                              <span className="text-muted-foreground text-xs">
                                (current)
                              </span>
                            )}
                            {isAlreadyShared && (
                              <span className="text-xs text-green-600">
                                ✓ shared
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiry">Expiration (days)</Label>
                <Input
                  id="expiry"
                  type="number"
                  min="0"
                  placeholder="0 for no expiration"
                  value={formData.expires_in_days}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expires_in_days: parseInt(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-muted-foreground text-xs">
                  Set to 0 for no expiration
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {shareSettings.is_shared &&
            shareSettings.shared_branches &&
            shareSettings.shared_branches.length > 1 && (
              <Button
                variant="destructive"
                onClick={handleDisableSharing}
                disabled={isSaving}
                className="sm:mr-auto"
              >
                Disable All Sharing
              </Button>
            )}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving || isLoading}>
            {isSaving
              ? "Creating Share..."
              : shareSettings.shared_branches?.some(
                    (sb) => sb.branch_name === formData.branch_name,
                  )
                ? "Update Share"
                : "Create Share Link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
