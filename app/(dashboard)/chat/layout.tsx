import { ChatInputSection } from "./chat-input-section";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex h-full flex-col">
      {/* Content Area - This changes based on route with its own scroll */}
      <div className="min-h-0 flex-1">{children}</div>

      {/* Input - Floating overlay at bottom */}
      <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-10">
        {/* Gradient background that avoids custom scrollbar area - no pointer events */}
        <div className="from-background via-background/95 absolute inset-0 right-3 bg-gradient-to-t to-transparent pt-6" />
        {/* Input wrapper - only this should capture pointer events */}
        <div className="animate-in slide-in-from-bottom-4 fade-in relative duration-200 ease-in-out">
          <ChatInputSection />
        </div>
      </div>
    </div>
  );
}
