export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="flex-1 overflow-hidden">{children}</main>;
}
