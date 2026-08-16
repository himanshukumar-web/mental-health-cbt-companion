import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import InstallPrompt from "@/components/InstallPrompt";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import ToastProvider from "@/components/ui/ToastProvider";
import Script from "next/script";
import BackendPrewarmer from "@/components/BackendPrewarmer";
import AndroidNativeHandler from "@/components/AndroidNativeHandler";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "MindMate — AI Mental Wellness Companion",
  description:
    "A compassionate, evidence-based CBT companion powered by multi-agent AI. Talk through your thoughts, feelings, and challenges in a safe, private space.",
  keywords: ["CBT", "mental health", "therapy companion", "AI", "cognitive behavioral therapy", "MindMate"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MindMate",
  },
  openGraph: {
    title: "MindMate — AI Mental Wellness Companion",
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

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL
  ? new URL(process.env.NEXT_PUBLIC_API_URL).origin
  : "https://mental-health-cbt-companion.onrender.com";

const SUPABASE_ORIGIN = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
  : null;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="preconnect" href={API_ORIGIN} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={API_ORIGIN} />
        {SUPABASE_ORIGIN && (
          <>
            <link rel="preconnect" href={SUPABASE_ORIGIN} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={SUPABASE_ORIGIN} />
          </>
        )}
      </head>
      <body className={`${inter.className}`}>
        <ErrorBoundary>
          <AuthProvider>
            <AndroidNativeHandler />
            <BackendPrewarmer />
            <ToastProvider />
            {children}
            <InstallPrompt />
          </AuthProvider>
        </ErrorBoundary>

        {/* Register Service Worker */}
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .then(function(reg) {
                    console.log('MindMate SW registered:', reg.scope);
                  })
                  .catch(function(err) {
                    console.log('MindMate SW registration failed:', err);
                  });
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
