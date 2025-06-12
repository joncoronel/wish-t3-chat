"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createClient();

      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(
          window.location.search,
        );

        if (error) {
          console.error("Auth callback error:", error);
          window.location.href = "/auth/login?error=auth_callback_error";
          return;
        }

        if (data.session) {
          // Redirect to dashboard on successful authentication
          window.location.href = "/";
        } else {
          window.location.href = "/auth/login";
        }
      } catch (error) {
        console.error("Unexpected error:", error);
        window.location.href = "/auth/login?error=unexpected_error";
      }
    };

    handleAuthCallback();
  }, []);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
        <p className="text-muted-foreground mt-2 text-sm">
          Completing sign in...
        </p>
      </div>
    </div>
  );
}
