import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { SettingsNavigation } from "@/components/settings/settings-navigation";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center gap-4">
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
                Manage your preferences and AI assistants
              </p>
            </div>
            <ThemeSwitcher />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
        <SettingsNavigation />
        {children}
      </div>
    </div>
  );
}