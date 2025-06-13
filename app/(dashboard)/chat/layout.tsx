import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInputWrapper } from "@/components/chat/chat-input-wrapper";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/auth/login");
  }

  return (
    <div className="relative flex h-full flex-col">
      {/* Header - Always visible */}
      <ChatHeader />

      {/* Content Area - This changes based on route */}
      <div className="flex-1 overflow-hidden">{children}</div>

      {/* Input - Always visible with floating overlay effect */}
      <div className="absolute right-0 bottom-0 left-0 z-10">
        <ChatInputWrapper userId={data.user.id} />
      </div>
    </div>
  );
}
