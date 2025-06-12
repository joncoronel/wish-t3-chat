import { createClient } from "@/lib/supabase/client";
import type { LoginForm, SignUpForm, AuthUser } from "@/types";
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

export const auth = {
  async signUp({ email, password, full_name }: SignUpForm) {
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
        },
      },
    });

    if (error) {
      throw new AuthError(error.message, error.message);
    }

    return data;
  },

  async signIn({ email, password }: LoginForm) {
    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new AuthError(error.message, error.message);
    }

    return data;
  },

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

  async signOut() {
    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new AuthError(error.message, error.message);
    }
  },

  async resetPassword(email: string) {
    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      throw new AuthError(error.message, error.message);
    }
  },

  async updatePassword(password: string) {
    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      throw new AuthError(error.message, error.message);
    }
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
