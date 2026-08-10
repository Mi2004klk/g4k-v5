import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import { Providers } from "@/components/providers";
import { WebVitals } from "@/components/web-vitals";
import { OfflineIndicator } from "@/components/offline-indicator";
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

export const metadata: Metadata = {
  title: {
    template: "%s | Games4Kings Workplace OS",
    default: "Games4Kings Workplace OS",
  },
  description: "Gen2k Conglomerate Workplace Management System",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#8A2BE2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${sora.variable} h-full antialiased min-h-full flex flex-col`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    },
                    function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <WebVitals />
        <Providers>
          {children}
          <OfflineIndicator />
        </Providers>
      </body>
    </html>
  );
}
