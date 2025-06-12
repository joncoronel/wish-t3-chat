import { atom } from "jotai";

// UI state atoms
export const sidebarOpenAtom = atom<boolean>(true);
export const themeAtom = atom<"light" | "dark">("dark");
export const isMobileAtom = atom<boolean>(false);

// Modal states
export const isNewChatModalOpenAtom = atom<boolean>(false);
export const isSettingsModalOpenAtom = atom<boolean>(false);
export const isShareModalOpenAtom = atom<boolean>(false);

// Search state
export const searchQueryAtom = atom<string>("");
export const isSearchingAtom = atom<boolean>(false);

// Loading states
export const isPageLoadingAtom = atom<boolean>(false);
export const loadingMessageAtom = atom<string>("");

// Toast notifications
export interface ToastMessage {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  description?: string;
  duration?: number;
}

export const toastMessagesAtom = atom<ToastMessage[]>([]);

// Actions
export const toggleSidebarAtom = atom(null, (get, set) => {
  const isOpen = get(sidebarOpenAtom);
  set(sidebarOpenAtom, !isOpen);
});

export const addToastAtom = atom(
  null,
  (get, set, toast: Omit<ToastMessage, "id">) => {
    const currentToasts = get(toastMessagesAtom);
    const newToast: ToastMessage = {
      ...toast,
      id: Math.random().toString(36).substr(2, 9),
    };
    set(toastMessagesAtom, [...currentToasts, newToast]);
  },
);

export const removeToastAtom = atom(null, (get, set, toastId: string) => {
  const currentToasts = get(toastMessagesAtom);
  set(
    toastMessagesAtom,
    currentToasts.filter((toast) => toast.id !== toastId),
  );
});
