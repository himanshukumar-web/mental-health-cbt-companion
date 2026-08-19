"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function AndroidNativeHandler() {
  const router = useRouter();
  const lastBackPressRef = useRef<number>(0);
  const routerRef = useRef(router);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    let appListener: any;
    let keyboardShowListener: any;
    let keyboardHideListener: any;

    async function initNativePlugins() {
      if (typeof window === "undefined") return;

      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;

        document.documentElement.classList.add("native-android");

        const { App } = await import("@capacitor/app");
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        const { Keyboard } = await import("@capacitor/keyboard");
        const { SplashScreen } = await import("@capacitor/splash-screen");

        // 1. Hide Splash Screen cleanly
        try {
          await SplashScreen.hide();
        } catch {
          /* ignore */
        }

        // 2. Status bar styling for Android
        try {
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: "#0b0f1a" });
        } catch {
          /* ignore */
        }

        // 3. Keyboard height tracking
        keyboardShowListener = await Keyboard.addListener("keyboardWillShow", (info) => {
          document.documentElement.style.setProperty("--keyboard-height", `${info.keyboardHeight}px`);
          document.body.classList.add("keyboard-open");
        });

        keyboardHideListener = await Keyboard.addListener("keyboardWillHide", () => {
          document.documentElement.style.setProperty("--keyboard-height", "0px");
          document.body.classList.remove("keyboard-open");
        });

        // 4. Hardware Back Button Listener — natural SPA back navigation without reloads
        appListener = await App.addListener("backButton", ({ canGoBack }: { canGoBack: boolean }) => {
          // Dismiss any modal/overlay marked with data-dismiss-on-back
          const dismissible = document.querySelector<HTMLElement>("[data-dismiss-on-back='true']");
          if (dismissible) {
            dismissible.click();
            return;
          }

          const rawPath = (typeof window !== "undefined" ? window.location.pathname : "") || "/";
          const cleanPath = rawPath.replace(/\/index\.html$|\.html$|\/$/, "") || "/";

          // Critical top-level pages -> Press twice within 2s to exit app
          const isTopLevel = ["/", "/dashboard", "/login", "/role-select"].includes(cleanPath);

          if (isTopLevel) {
            const now = Date.now();
            if (now - lastBackPressRef.current < 2000) {
              App.exitApp();
            } else {
              lastBackPressRef.current = now;
              toast("Press back again to exit MindMate", {
                icon: "👋",
                duration: 2000,
                id: "exit-toast",
              });
            }
            return;
          }

          // Natural SPA back navigation without page reload
          if (canGoBack || (typeof window !== "undefined" && window.history.length > 1)) {
            routerRef.current.back();
          } else {
            routerRef.current.replace("/dashboard");
          }
        });
      } catch (err) {
        console.warn("[AndroidNativeHandler] Native plugins initialization skipped:", err);
      }
    }

    initNativePlugins();

    return () => {
      document.documentElement.classList.remove("native-android");
      if (appListener && typeof appListener.remove === "function") appListener.remove();
      if (keyboardShowListener && typeof keyboardShowListener.remove === "function") keyboardShowListener.remove();
      if (keyboardHideListener && typeof keyboardHideListener.remove === "function") keyboardHideListener.remove();
    };
  }, []);

  return null;
}
