import { createClient } from "@/lib/supabase/client";
import type { AuthUser } from "@/types";
import type { Session } from "@supabase/supabase-js";

export class AuthError extends Error {
  constructor(
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

// Client-side auth utilities (for browser-only operations)
export const clientAuth = {
  async signInWithOAuth(provider: "google" | "github" | "discord") {
    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      throw new AuthError(error.message, error.message);
    }

    return data;
  },

  async updateProfile(updates: Partial<AuthUser>) {
    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      data: updates,
    });

    if (error) {
      throw new AuthError(error.message, error.message);
    }

    // Also update the users table
    if (updates.full_name || updates.avatar_url) {
      const { error: dbError } = await supabase
        .from("users")
        .update({
          full_name: updates.full_name,
          avatar_url: updates.avatar_url,
        })
        .eq("id", (await supabase.auth.getUser()).data.user?.id);

      if (dbError) {
        throw new AuthError(dbError.message, dbError.code);
      }
    }
  },

  async getSession() {
    const supabase = createClient();

    const { data, error } = await supabase.auth.getSession();

    if (error) {
      throw new AuthError(error.message, error.message);
    }

    return data.session;
  },

  async getUser() {
    const supabase = createClient();

    const { data, error } = await supabase.auth.getUser();

    if (error) {
      throw new AuthError(error.message, error.message);
    }

    return data.user;
  },

  onAuthStateChange(callback: (session: Session | null) => void) {
    const supabase = createClient();

    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session);
    });
  },
};

// Re-export server actions for convenience
export { login, signup } from "./actions";

// Legacy compatibility - deprecated, use server actions instead
export const auth = {
  async signUp() {
    console.warn(
      "auth.signUp is deprecated. Use the signup server action instead.",
    );
    throw new Error("Use server actions for auth operations");
  },

  async signIn() {
    console.warn(
      "auth.signIn is deprecated. Use the login server action instead.",
    );
    throw new Error("Use server actions for auth operations");
  },

  async signOut() {
    console.warn(
      "auth.signOut is deprecated. Use server actions for auth operations",
    );
    throw new Error("Use server actions for auth operations");
  },

  async resetPassword() {
    console.warn(
      "auth.resetPassword is deprecated. Use server actions for auth operations",
    );
    throw new Error("Use server actions for auth operations");
  },

  async updatePassword() {
    console.warn(
      "auth.updatePassword is deprecated. Use server actions for auth operations",
    );
    throw new Error("Use server actions for auth operations");
  },

  // Keep client-side methods
  signInWithOAuth: clientAuth.signInWithOAuth,
  updateProfile: clientAuth.updateProfile,
  getSession: clientAuth.getSession,
  getUser: clientAuth.getUser,
  onAuthStateChange: clientAuth.onAuthStateChange,
};
