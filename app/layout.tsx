import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Wish T3 Chat - AI Chat Application",
  description:
    "A feature-rich AI chat application built for the T3 Chat Clone competition",
  keywords: ["AI", "Chat", "OpenAI", "Claude", "Gemini", "T3"],
  authors: [{ name: "T3 Chat Clone Team" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className={`${inter.variable} h-full font-sans antialiased`}>
        <Providers>
          <div className="h-full">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
