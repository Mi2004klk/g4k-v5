import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthGuard } from "@/components/auth-guard";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { GlobalCommand } from "@/components/global-command";
import { OfflineIndicator } from "@/components/offline-indicator";
import { PWARegistry } from "@/components/pwa-registry";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "G4K Workplace OS",
  description: "Gen2k Conglomerate Workplace Management System",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#09090b",
};

import { ErrorBoundary } from "@/components/error-boundary";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-zinc-950 text-zinc-100`}>
        <ErrorBoundary>
          <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthGuard>{children}</AuthGuard>
          <Toaster />
          <GlobalCommand />
          <OfflineIndicator />
          <PWARegistry />
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
