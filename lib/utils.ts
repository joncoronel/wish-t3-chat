import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a consistent conversation title from a message
 * Uses the first 6 words with ellipsis if longer
 */
export function generateConversationTitle(message: string): string {
  if (!message || message.trim().length === 0) {
    return "New Conversation";
  }

  const words = message.trim().split(/\s+/);
  const title = words.slice(0, 6).join(" ");

  return words.length > 6 ? `${title}...` : title;
}
