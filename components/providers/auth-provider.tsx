"use client";

import { useEffect } from "react";
import { useAtom } from "jotai";
import { createClient } from "@/lib/supabase/client";
import { setSessionAtom, setAuthUserAtom, setUserSettingsAtom } from "@/store";
import type { ReactNode } from "react";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [, setSession] = useAtom(setSessionAtom);
  const [, setAuthUser] = useAtom(setAuthUserAtom);
  const [, setUserSettings] = useAtom(setUserSettingsAtom);

  useEffect(() => {
    console.log("🔐 AuthProvider: Initializing...");

    try {
      const supabase = createClient();
      console.log("✅ AuthProvider: Supabase client created");

      // Get initial session
      supabase.auth
        .getSession()
        .then(({ data: { session }, error }) => {
          console.log("🔍 AuthProvider: Initial session check", {
            session,
            error,
          });

          if (error) {
            console.error("❌ AuthProvider: Session error:", error);
            setSession(null); // Ensure loading state resolves
            return;
          }

          setSession(session);

          if (session?.user) {
            console.log("👤 AuthProvider: User found, fetching data...");
            fetchUserData(session.user.id);
          } else {
            console.log("👤 AuthProvider: No user session");
          }
        })
        .catch((error) => {
          console.error("❌ AuthProvider: Failed to get session:", error);
          setSession(null); // Ensure loading state resolves
        });

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("🔄 AuthProvider: Auth state change", { event, session });
        setSession(session);

        if (session?.user) {
          await fetchUserData(session.user.id);
        } else {
          setAuthUser(null);
          setUserSettings(null);
        }
      });

      async function fetchUserData(userId: string) {
        try {
          console.log("📊 AuthProvider: Fetching user data for:", userId);

          // Fetch user profile
          const { data: userProfile, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("id", userId)
            .single();

          if (userError) {
            console.warn("⚠️ AuthProvider: User profile error:", userError);
            // Don't throw - user might not exist in public.users yet
          } else if (userProfile) {
            console.log("✅ AuthProvider: User profile loaded:", userProfile);
            setAuthUser({
              id: userProfile.id,
              email: userProfile.email,
              full_name: userProfile.full_name,
              avatar_url: userProfile.avatar_url,
            });
          }

          // Fetch user settings
          const { data: userSettings, error: settingsError } = await supabase
            .from("user_settings")
            .select("*")
            .eq("user_id", userId)
            .single();

          if (settingsError) {
            console.warn(
              "⚠️ AuthProvider: User settings error:",
              settingsError,
            );
            // Don't throw - settings might not exist yet
          } else if (userSettings) {
            console.log("✅ AuthProvider: User settings loaded:", userSettings);
            setUserSettings(userSettings);
          }
        } catch (error) {
          console.error("❌ AuthProvider: Error fetching user data:", error);
          // Don't let this break the auth flow
        }
      }

      return () => {
        console.log("🧹 AuthProvider: Cleanup");
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error(
        "❌ AuthProvider: Fatal error during initialization:",
        error,
      );
      // Ensure loading state resolves even if there's a fatal error
      setSession(null);
    }
  }, [setSession, setAuthUser, setUserSettings]);

  return <>{children}</>;
}
