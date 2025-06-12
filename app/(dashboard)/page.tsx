import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Welcome to T3 Chat</h1>
      <p className="text-gray-600">Hello {user?.email}</p>
      <div className="mt-8">
        <h2 className="mb-2 text-lg font-semibold">Getting Started</h2>
        <p className="text-gray-600">
          This is your dashboard. The authentication is now working properly
          with Supabase SSR!
        </p>
      </div>
    </div>
  );
}
