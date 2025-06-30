import { Suspense } from "react";
import { SettingsServer } from "@/components/settings/settings-server";
import { SettingsLoadingSkeleton } from "@/components/settings/settings-loading-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const experimental_ppr = true;

export default function GeneralSettingsPage() {
  return (
    <div className="space-y-6">
      {/* API Keys Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <CardTitle>API Keys</CardTitle>
              <p className="text-muted-foreground mt-1 text-sm">
                Configure your own API keys to use with different AI
                providers. This gives you direct control over costs and
                usage.
              </p>
            </div>
            <Badge variant="secondary" className="shrink-0 self-start">Bring Your Own Key</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<SettingsLoadingSkeleton />}>
            <SettingsServer />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}