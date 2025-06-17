import { getUser } from "@/lib/auth";
import { ChatInputWrapper } from "@/components/chat/chat-input-wrapper";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  // Parent layout already handles auth redirect, so user should exist
  if (!user) {
    throw new Error("User not found in chat layout");
  }

  return (
    <div className="relative flex h-full flex-col">
      {/* Content Area - This changes based on route with its own scroll */}
      <div className="min-h-0 flex-1">{children}</div>

      {/* Input - Floating overlay at bottom */}
      <div className="absolute right-0 bottom-0 left-0 z-10">
        {/* Gradient background that avoids custom scrollbar area */}
        <div className="from-background via-background/95 pointer-events-none absolute inset-0 right-3 bg-gradient-to-t to-transparent pt-6" />
        {/* Input wrapper with proper pointer events */}
        <div className="relative">
          <ChatInputWrapper userId={user.id} />
        </div>
      </div>
    </div>
  );
}
