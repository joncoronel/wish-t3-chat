import { Suspense } from "react";
import Link from "next/link";

import { SettingsServer } from "@/components/settings/settings-server";
import { SettingsLoadingSkeleton } from "@/components/settings/settings-loading-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function SettingsPage() {
  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/chat" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Chat
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-muted-foreground text-sm">
                Manage your API keys, preferences, and account settings.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-4xl space-y-8 px-4 py-8">
        <div className="grid gap-8">
          {/* API Keys Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>API Keys</CardTitle>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Configure your own API keys to use with different AI
                    providers. This gives you direct control over costs and
                    usage.
                  </p>
                </div>
                <Badge variant="secondary">Bring Your Own Key</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<SettingsLoadingSkeleton />}>
                <SettingsServer />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
