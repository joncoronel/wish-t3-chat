import { Inter } from "next/font/google";
// import { Providers } from "@/components/providers/providers";
import "./globals.css";

export const experimental_ppr = true;

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function RootLayout(children) {
  return (
    <html className="h-full">
      <body className={`${inter.variable} h-full font-sans antialiased`}>
        <div className="h-full">{children}</div>
      </body>
    </html>
  );
}
