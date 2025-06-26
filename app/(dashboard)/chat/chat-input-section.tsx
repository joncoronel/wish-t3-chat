import { getUser } from "@/lib/auth";
import { ChatInputWrapper } from "@/components/chat/chat-input-wrapper";
import { redirect } from "next/navigation";

export async function ChatInputSection() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  return <ChatInputWrapper userId={user.id} />;
}
