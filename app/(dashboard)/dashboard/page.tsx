"use client";

import { useAtom } from "jotai";
import { MessageSquare, Sparkles, Zap, Shield, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { activeConversationAtom, isNewChatModalOpenAtom } from "@/store";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardPage() {
  const [activeConversation] = useAtom(activeConversationAtom);
  const [, setNewChatModalOpen] = useAtom(isNewChatModalOpenAtom);
  const { user } = useAuth();

  const handleNewChat = () => {
    setNewChatModalOpen(true);
  };

  // If there's an active conversation, this page shouldn't be shown
  if (activeConversation) {
    return null;
  }

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center">
            <div className="bg-primary/10 rounded-full p-4">
              <MessageSquare className="text-primary h-8 w-8" />
            </div>
          </div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight">
            Welcome to Wish T3 Chat
            {user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}!
          </h1>
          <p className="text-muted-foreground mb-6 text-lg">
            Your AI-powered chat companion with multi-model support
          </p>
          <Button onClick={handleNewChat} size="lg" className="text-base">
            <Plus className="mr-2 h-5 w-5" />
            Start New Conversation
          </Button>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 w-fit rounded-full bg-blue-500/10 p-3">
                <Sparkles className="h-6 w-6 text-blue-500" />
              </div>
              <CardTitle className="text-lg">Multi-Model Support</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Chat with GPT-4, Claude, Gemini, and more AI models in one place
              </CardDescription>
              <div className="mt-3 flex flex-wrap justify-center gap-1">
                <Badge variant="secondary">GPT-4</Badge>
                <Badge variant="secondary">Claude</Badge>
                <Badge variant="secondary">Gemini</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 w-fit rounded-full bg-green-500/10 p-3">
                <Zap className="h-6 w-6 text-green-500" />
              </div>
              <CardTitle className="text-lg">Real-time Features</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Streaming responses, file attachments, and conversation
                branching
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 w-fit rounded-full bg-purple-500/10 p-3">
                <Shield className="h-6 w-6 text-purple-500" />
              </div>
              <CardTitle className="text-lg">Secure & Private</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                End-to-end encryption with your own API keys for maximum privacy
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-muted-foreground text-sm">
            Built with ❤️ for the T3 Chat Clone competition
          </p>
        </div>
      </div>
    </div>
  );
}
