import { atom } from "jotai";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";
import type { AuthUser, UserSettings } from "@/types";

// Auth state atoms
export const sessionAtom = atom<Session | null>(null);
export const userAtom = atom<SupabaseUser | null>(null);
export const authUserAtom = atom<AuthUser | null>(null);
export const userSettingsAtom = atom<UserSettings | null>(null);
export const isAuthLoadingAtom = atom<boolean>(true);

// Derived atoms
export const isAuthenticatedAtom = atom((get) => get(sessionAtom) !== null);

// Actions
export const setSessionAtom = atom(
  null,
  (get, set, session: Session | null) => {
    set(sessionAtom, session);
    set(userAtom, session?.user ?? null);
    set(isAuthLoadingAtom, false);
  },
);

export const setAuthUserAtom = atom(
  null,
  (get, set, authUser: AuthUser | null) => {
    set(authUserAtom, authUser);
  },
);

export const setUserSettingsAtom = atom(
  null,
  (get, set, settings: UserSettings | null) => {
    set(userSettingsAtom, settings);
  },
);
