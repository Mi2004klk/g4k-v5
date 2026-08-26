"use client";

import { Inter, Sora } from "next/font/google";
import { AppIcon } from "@g4k/ui/components";
import { Button } from "@g4k/ui/components";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  display: "swap",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-display",
  display: "swap",
  subsets: ["latin"],
});

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable} h-full antialiased min-h-full flex flex-col`}>
      <body className="min-h-full flex flex-col bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 font-sans">
        <div className="flex h-screen w-full flex-col items-center justify-center p-4 text-center">
          <div className="bg-rose-50 dark:bg-rose-950/30 p-6 rounded-full shadow-inner border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 mb-6">
            <AppIcon name="warning" size="hero" className="w-16 h-16" />
          </div>
          
          <div className="space-y-2 max-w-md">
            <h1 className="text-3xl font-display font-bold tracking-tight">
              System Error
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              A critical error occurred while loading this page. Our team has been notified.
            </p>
          </div>

          <div className="pt-6 flex items-center gap-3">
            <Button onClick={() => reset()} className="gap-2 font-semibold shadow-sm h-11 px-8 rounded-full bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200">
              <AppIcon name="refresh" size="sm" />
              Try Again
            </Button>
            <Button asChild variant="outline" className="gap-2 font-semibold shadow-sm h-11 px-6 rounded-full">
              <a href="/dashboard">Return to Dashboard</a>
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
