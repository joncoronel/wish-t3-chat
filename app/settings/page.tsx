import { Suspense } from "react";
import Link from "next/link";

import { SettingsServer } from "@/components/settings/settings-server";
import { SettingsLoadingSkeleton } from "@/components/settings/settings-loading-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";

export const experimental_ppr = true;

export default async function SettingsPage() {
  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="sm" className="shrink-0" asChild>
              <Link href="/chat" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Chat</span>
                <span className="sm:hidden">Back</span>
              </Link>
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold sm:text-2xl">Settings</h1>
              <p className="text-muted-foreground text-sm">
                Manage your API keys, preferences, and account settings.
              </p>
            </div>
            <ThemeSwitcher />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-4xl space-y-8 px-4 py-8">
        <div className="grid gap-8">
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
      </div>
    </div>
  );
}
