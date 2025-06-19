"use client";

import { Button } from "@/components/ui/button";

const categoryPrompts = {
  default: [
    "How does AI work?",
    "Are black holes real?",
    'How many Rs are in the word "strawberry"?',
    "What is the meaning of life?",
  ],
  create: [
    "Help me write a creative story",
    "Design a logo for my startup",
    "Create a workout plan for beginners",
    "Write a poem about nature",
  ],
  explore: [
    "What are the latest trends in AI?",
    "Explain quantum computing simply",
    "Tell me about ancient civilizations",
    "What's happening in space exploration?",
  ],
  code: [
    "Help me debug this JavaScript code",
    "Explain React hooks with examples",
    "How do I optimize database queries?",
    "Best practices for API design",
  ],
  learn: [
    "Teach me basic photography",
    "How does machine learning work?",
    "Explain the stock market basics",
    "What is blockchain technology?",
  ],
} as const;

interface ChatWelcomeProps {
  selectedCategory: keyof typeof categoryPrompts | "default";
  onCategoryChange: (
    category: keyof typeof categoryPrompts | "default",
  ) => void;
  categoryPrompts: typeof categoryPrompts;
  onSendMessage: (message: string) => void;
}

export function ChatWelcome({
  selectedCategory,
  onCategoryChange,
  onSendMessage,
}: ChatWelcomeProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 pb-40">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-foreground mb-8 text-3xl font-semibold">
          How can I help you today?
        </h1>

        {/* Category buttons */}
        <div className="mb-12 flex flex-wrap justify-center gap-3">
          <Button
            variant={selectedCategory === "create" ? "seashell" : "outline"}
            className="hover:border-warm-seashell/50 flex items-center gap-2 px-4 py-2"
            onClick={() =>
              onCategoryChange(
                selectedCategory === "create" ? "default" : "create",
              )
            }
          >
            <span className="text-lg">⚡</span>
            Create
          </Button>
          <Button
            variant={selectedCategory === "explore" ? "pewter" : "outline"}
            className="hover:border-pewter/50 flex items-center gap-2 px-4 py-2"
            onClick={() =>
              onCategoryChange(
                selectedCategory === "explore" ? "default" : "explore",
              )
            }
          >
            <span className="text-lg">📚</span>
            Explore
          </Button>
          <Button
            variant={selectedCategory === "code" ? "default" : "outline"}
            className="hover:border-neutral-gray/50 flex items-center gap-2 px-4 py-2"
            onClick={() =>
              onCategoryChange(selectedCategory === "code" ? "default" : "code")
            }
          >
            <span className="text-lg">💻</span>
            Code
          </Button>
          <Button
            variant={selectedCategory === "learn" ? "secondary" : "outline"}
            className="hover:border-secondary/50 flex items-center gap-2 px-4 py-2"
            onClick={() =>
              onCategoryChange(
                selectedCategory === "learn" ? "default" : "learn",
              )
            }
          >
            <span className="text-lg">🎓</span>
            Learn
          </Button>
        </div>

        {/* Suggested prompts */}
        <div className="space-y-3">
          {categoryPrompts[selectedCategory].map((prompt) => (
            <Button
              key={prompt}
              variant="ghost"
              className="text-muted-foreground hover:text-pewter hover:bg-warm-seashell/10 w-full justify-start text-left"
              onClick={() => onSendMessage(prompt)}
            >
              {prompt}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
