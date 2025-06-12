"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { JotaiProvider } from "./jotai-provider";
import { AuthProvider } from "./auth-provider";
import type { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <JotaiProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          {children}
          <Toaster position="top-right" expand={false} richColors closeButton />
        </AuthProvider>
      </ThemeProvider>
    </JotaiProvider>
  );
}
