import Link from "next/link";
import { PersonasList } from "@/components/personas/personas-list";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const experimental_ppr = true;

export default function PersonasPage() {
  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur">
        <div className="container mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/chat" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Chat
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">AI Personas</h1>
              <p className="text-muted-foreground text-sm">
                Create and manage custom AI personalities for your conversations.
              </p>
            </div>
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