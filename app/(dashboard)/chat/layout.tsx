import { getUser } from "@/lib/auth";
import { ChatHeader } from "@/components/chat/chat-header";
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
      {/* Header - Always visible */}
      <ChatHeader />

      {/* Content Area - This changes based on route */}
      <div className="flex-1 overflow-hidden">{children}</div>

      {/* Input - Always visible with floating overlay effect */}
      <div className="absolute right-0 bottom-0 left-0 z-10">
        <ChatInputWrapper userId={user.id} />
      </div>
    </div>
  );
}
