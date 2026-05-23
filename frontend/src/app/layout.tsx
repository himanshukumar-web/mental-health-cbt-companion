import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "Sera — CBT Companion",
  description:
    "A compassionate, evidence-based CBT companion powered by multi-agent AI. Talk through your thoughts, feelings, and challenges in a safe, private space.",
  keywords: ["CBT", "mental health", "therapy companion", "AI", "cognitive behavioral therapy"],
  openGraph: {
    title: "Sera — Your CBT Companion",
    description: "Evidence-based mental health support powered by multi-agent AI.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
