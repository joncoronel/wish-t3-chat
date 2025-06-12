import { useAtom } from "jotai";
import {
  sessionAtom,
  authUserAtom,
  userSettingsAtom,
  isAuthLoadingAtom,
  isAuthenticatedAtom,
} from "@/store";
import { auth, AuthError } from "@/lib/auth";
import { addToastAtom } from "@/store";
import type { LoginForm, SignUpForm } from "@/types";

export function useAuth() {
  const [session] = useAtom(sessionAtom);
  const [user] = useAtom(authUserAtom);
  const [userSettings] = useAtom(userSettingsAtom);
  const [isLoading] = useAtom(isAuthLoadingAtom);
  const [isAuthenticated] = useAtom(isAuthenticatedAtom);
  const [, addToast] = useAtom(addToastAtom);

  const signUp = async (data: SignUpForm) => {
    try {
      await auth.signUp(data);
      addToast({
        type: "success",
        title: "Account created",
        description: "Please check your email to verify your account.",
      });
    } catch (error) {
      if (error instanceof AuthError) {
        addToast({
          type: "error",
          title: "Sign up failed",
          description: error.message,
        });
      }
      throw error;
    }
  };

  const signIn = async (data: LoginForm) => {
    try {
      await auth.signIn(data);
      addToast({
        type: "success",
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
    } catch (error) {
      if (error instanceof AuthError) {
        addToast({
          type: "error",
          title: "Sign in failed",
          description: error.message,
        });
      }
      throw error;
    }
  };

  const signInWithOAuth = async (provider: "google" | "github" | "discord") => {
    try {
      await auth.signInWithOAuth(provider);
    } catch (error) {
      if (error instanceof AuthError) {
        addToast({
          type: "error",
          title: "OAuth sign in failed",
          description: error.message,
        });
      }
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
      addToast({
        type: "success",
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      if (error instanceof AuthError) {
        addToast({
          type: "error",
          title: "Sign out failed",
          description: error.message,
        });
      }
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await auth.resetPassword(email);
      addToast({
        type: "success",
        title: "Reset email sent",
        description: "Please check your email for password reset instructions.",
      });
    } catch (error) {
      if (error instanceof AuthError) {
        addToast({
          type: "error",
          title: "Reset failed",
          description: error.message,
        });
      }
      throw error;
    }
  };

  return {
    // State
    session,
    user,
    userSettings,
    isLoading,
    isAuthenticated,

    // Actions
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    resetPassword,
  };
}
