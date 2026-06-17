/**
 * layout.tsx
 * Root layout for Rehearse — light theme, toast provider.
 */

import type { Metadata } from "next";
import { ToastContainer } from "@/components/Toast";
import { ToastProvider } from "@/hooks/useToast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rehearse | AI Sales Training",
  description: "Rehearse — AI sales training simulation platform for universities",
};

/**
 * Root HTML wrapper for all routes.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  return (
    <html lang="en">
      <body className="min-h-screen bg-page text-text-primary antialiased">
        <ToastProvider>
          {children}
          <ToastContainer />
        </ToastProvider>
      </body>
    </html>
  );
}
