import Link from "next/link";
import { PersonasList } from "@/components/personas/personas-list";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";

export const experimental_ppr = true;

export default function PersonasPage() {
  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur">
        <div className="container mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="sm" className="shrink-0" asChild>
              <Link href="/chat" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Chat</span>
                <span className="sm:hidden">Back</span>
              </Link>
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold sm:text-2xl">AI Personas</h1>
              <p className="text-muted-foreground text-sm">
                Create and manage custom AI personalities for your conversations.
              </p>
            </div>
            <ThemeSwitcher />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <PersonasList />
      </div>
    </div>
  );
}