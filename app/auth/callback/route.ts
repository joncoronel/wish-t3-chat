import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const error_description = searchParams.get("error_description");
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/chat";

  // Handle OAuth errors
  if (error) {
    console.error("OAuth error:", error, error_description);
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  if (code) {
    const supabase = await createClient();

    try {
      const { data, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (!exchangeError && data.session) {
        return NextResponse.redirect(`${origin}${next}`);
      } else {
        console.error("Error exchanging code for session:", exchangeError);
      }
    } catch (err) {
      console.error("Unexpected error during code exchange:", err);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
