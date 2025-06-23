import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getUser();

  const features = [
    {
      icon: "🤖",
      title: "Multi-Provider AI",
      description:
        "Access multiple AI models from OpenAI, Claude, Gemini and more",
    },
    {
      icon: "💬",
      title: "Smart Conversations",
      description: "Persistent chat history with context-aware responses",
    },
    {
      icon: "📁",
      title: "File Attachments",
      description: "Upload and discuss documents, images, and files",
    },
    {
      icon: "🔒",
      title: "Secure & Private",
      description: "Your conversations are encrypted and protected",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-border border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h2 className="text-xl font-semibold">Cubby Chat</h2>
          <Button asChild variant="outline">
            <Link href={user ? "/chat" : "/login"}>
              {user ? "Dashboard" : "Sign In"}
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="w-full max-w-4xl text-center">
          <h1 className="text-foreground mb-6 text-5xl font-bold">
            AI Chat for Everyone
          </h1>
          <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-xl">
            Experience the power of AI with support for multiple providers, file
            attachments, and intelligent conversations that remember context.
          </p>

          <div className="mb-12 flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="px-8 text-lg">
              <Link href={user ? "/chat" : "/login"}>
                {user ? "Continue Chatting" : "Get Started Free"}
              </Link>
            </Button>
            {!user && (
              <Button
                asChild
                variant="outline"
                size="lg"
                className="px-8 text-lg"
              >
                <Link href="/login">Sign In</Link>
              </Button>
            )}
          </div>

          {/* Features Grid */}
          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 text-center">
                <div className="mb-4 text-3xl">{feature.icon}</div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-border border-t py-8">
        <div className="text-muted-foreground container mx-auto px-4 text-center text-sm">
          <p>&copy; 2025 Cubby Chat</p>
        </div>
      </footer>
    </div>
  );
}
