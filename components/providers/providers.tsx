"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Provider as JotaiProvider } from "jotai";

import type { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <NuqsAdapter>
      <JotaiProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-right" expand={false} richColors closeButton />
        </ThemeProvider>
      </JotaiProvider>
    </NuqsAdapter>
  );
}
