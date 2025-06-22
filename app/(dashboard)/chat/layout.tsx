export const experimental_ppr = true;

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex h-full flex-col">
      {children}
      <div className="absolute right-0 bottom-0 left-0 z-10">
        <div className="from-background via-background/95 pointer-events-none absolute inset-0 right-3 bg-gradient-to-t to-transparent pt-6" />
      </div>
    </div>
  );
}
