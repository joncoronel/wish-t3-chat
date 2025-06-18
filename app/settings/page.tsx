import { Suspense } from "react";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/settings/settings-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function SettingsPage() {
  const user = await getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <a href="/chat" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Chat
              </a>
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
              <Suspense fallback={<div>Loading settings...</div>}>
                <SettingsForm />
              </Suspense>
            </CardContent>
          </Card>

          {/* Usage Information */}
          <Card>
            <CardHeader>
              <CardTitle>Why Use Your Own API Keys?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium">✨ Benefits</h4>
                  <ul className="text-muted-foreground space-y-1 text-sm">
                    <li>• Direct billing from AI providers</li>
                    <li>• No usage limits or restrictions</li>
                    <li>• Access to latest models immediately</li>
                    <li>• Full control over your data</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">🔒 Security</h4>
                  <ul className="text-muted-foreground space-y-1 text-sm">
                    <li>• Keys stored securely in your browser</li>
                    <li>• Only used for your requests</li>
                    <li>• Never shared or logged</li>
                    <li>• Can be removed anytime</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Setup Guide */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Setup Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-6">
                <div>
                  <h4 className="mb-3 font-medium">
                    🚀 Recommended for T3 Chat Cloneathon
                  </h4>
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
                    <div className="flex items-start gap-2">
                      <Badge className="bg-blue-600 text-white">
                        OpenRouter
                      </Badge>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          Perfect for testing and access to 200+ models
                        </p>
                        <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                          Get started with just one API key and access GPT-4,
                          Claude, Gemini, Llama, and many more models.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-medium">1️⃣ Create Accounts</h4>
                    <ul className="text-muted-foreground space-y-1 text-sm">
                      <li>• OpenAI: Most popular models</li>
                      <li>• Anthropic: Claude models</li>
                      <li>• Google AI Studio: Gemini models</li>
                      <li>• OpenRouter: Access to 200+ models</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">2️⃣ Get API Keys</h4>
                    <ul className="text-muted-foreground space-y-1 text-sm">
                      <li>• Click &ldquo;Get API Key&rdquo; buttons above</li>
                      <li>• Follow provider instructions</li>
                      <li>• Copy your API keys securely</li>
                      <li>• Add billing method for usage</li>
                    </ul>
                  </div>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
                  <div className="flex items-start gap-2">
                    <div className="text-amber-600 dark:text-amber-400">💡</div>
                    <div>
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        Pro Tip for Cloneathon Judges
                      </p>
                      <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                        Configure OpenRouter with your API key to give judges
                        easy access to test all models without needing their own
                        keys.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
