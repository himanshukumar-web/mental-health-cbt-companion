"use client";

import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already running as PWA
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as any).standalone === true;
    setIsStandalone(standalone);
    if (standalone) return;

    // Check if user previously dismissed
    const dismissed = localStorage.getItem("sera_install_dismissed");
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      // Show again after 7 days
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    // Detect iOS (Safari)
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // iOS Safari doesn't fire beforeinstallprompt, show manual guide
    if (isIOSDevice) {
      // Only show if not in standalone mode
      const inSafari = /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS/.test(navigator.userAgent);
      if (inSafari) {
        setTimeout(() => setShowBanner(true), 3000);
      }
      return;
    }

    // Android / Desktop Chrome — capture the install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 2000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt, isIOS]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    setShowIOSGuide(false);
    localStorage.setItem("sera_install_dismissed", String(Date.now()));
  }, []);

  // Don't render anything if already installed or banner not shown
  if (isStandalone || !showBanner) return null;

  // iOS instruction modal
  if (showIOSGuide) {
    return (
      <>
        <div
          onClick={handleDismiss}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            zIndex: 9998, backdropFilter: "blur(4px)",
          }}
        />
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999,
          background: "var(--bg-secondary, #111827)",
          borderTop: "0.5px solid rgba(34,197,94,0.3)",
          borderRadius: "20px 20px 0 0",
          padding: "28px 24px env(safe-area-inset-bottom, 16px)",
          animation: "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.4)",
        }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: "linear-gradient(135deg, #a7f3d0, #6ee7b7)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, margin: "0 auto 14px",
              boxShadow: "0 0 24px rgba(34,197,94,0.25)",
            }}>🌿</div>
            <h3 style={{
              fontSize: 18, fontWeight: 700, color: "var(--text-primary, #e8edf5)",
              fontFamily: "var(--font-display, 'Outfit', sans-serif)", marginBottom: 4,
            }}>Install Sera App</h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary, #8b95a7)" }}>
              Follow these steps to add Sera to your home screen
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
            {[
              { step: "1", icon: "⬆️", text: "Tap the Share button at the bottom of Safari" },
              { step: "2", icon: "➕", text: "Scroll down and tap \"Add to Home Screen\"" },
              { step: "3", icon: "✅", text: "Tap \"Add\" to install Sera" },
            ].map((item) => (
              <div key={item.step} style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "12px 16px", borderRadius: 12,
                background: "var(--bg-glass, rgba(255,255,255,0.04))",
                border: "0.5px solid var(--border-secondary, rgba(255,255,255,0.06))",
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: "rgba(34,197,94,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 700, color: "#86efac",
                }}>{item.icon}</div>
                <span style={{
                  fontSize: 14, color: "var(--text-primary, #e8edf5)", lineHeight: 1.5,
                }}>{item.text}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleDismiss}
            style={{
              width: "100%", padding: "14px", borderRadius: 12, border: "none",
              background: "var(--bg-glass, rgba(255,255,255,0.04))",
              color: "var(--text-secondary, #8b95a7)",
              fontSize: 14, fontWeight: 500, cursor: "pointer",
            }}
          >
            Got it
          </button>
        </div>
      </>
    );
  }

  // Standard install banner
  return (
    <div style={{
      position: "fixed", bottom: 16, left: 16, right: 16, zIndex: 9999,
      maxWidth: 420, margin: "0 auto",
      background: "var(--bg-secondary, #111827)",
      border: "0.5px solid rgba(34,197,94,0.3)",
      borderRadius: 16, padding: "16px 18px",
      display: "flex", alignItems: "center", gap: 14,
      boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 24px rgba(34,197,94,0.08)",
      animation: "slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: "linear-gradient(135deg, #a7f3d0, #6ee7b7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20, boxShadow: "0 0 16px rgba(34,197,94,0.25)",
      }}>🌿</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 600,
          color: "var(--text-primary, #e8edf5)", marginBottom: 2,
        }}>Install Sera</div>
        <div style={{
          fontSize: 12, color: "var(--text-secondary, #8b95a7)",
          lineHeight: 1.4,
        }}>Add to home screen for quick access</div>
      </div>

      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button
          onClick={handleInstall}
          style={{
            padding: "8px 16px", borderRadius: 10, border: "none",
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer",
            boxShadow: "0 2px 10px rgba(34,197,94,0.3)",
          }}
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          style={{
            width: 32, height: 32, borderRadius: 8, border: "none",
            background: "transparent",
            color: "var(--text-tertiary, #4b5563)",
            fontSize: 16, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
