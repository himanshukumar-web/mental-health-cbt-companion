import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import InstallPrompt from "@/components/InstallPrompt";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Sera — CBT Companion",
  description:
    "A compassionate, evidence-based CBT companion powered by multi-agent AI. Talk through your thoughts, feelings, and challenges in a safe, private space.",
  keywords: ["CBT", "mental health", "therapy companion", "AI", "cognitive behavioral therapy"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sera",
  },
  openGraph: {
    title: "Sera — Your CBT Companion",
    description: "Evidence-based mental health support powered by multi-agent AI.",
    type: "website",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0f1a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
      </head>
      <body>
        <AuthProvider>
          {children}
          <InstallPrompt />
        </AuthProvider>

        {/* Register Service Worker */}
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .then(function(reg) {
                    console.log('Sera SW registered:', reg.scope);
                  })
                  .catch(function(err) {
                    console.log('Sera SW registration failed:', err);
                  });
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
