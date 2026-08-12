"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function AndroidNativeHandler() {
  const pathname = usePathname();
  const router = useRouter();
  const lastBackPressRef = useRef<number>(0);

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

        // 4. Hardware Back Button Listener
        appListener = await App.addListener("backButton", ({ canGoBack }) => {
          const path = window.location.pathname;

          // Critical top-level pages -> Press twice to exit
          const isTopLevel = ["/dashboard", "/login", "/"].includes(path);

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

          // Special case: AI Chat -> Go back to Dashboard
          if (path === "/chat") {
            router.push("/dashboard");
            return;
          }

          // Navigate back
          if (canGoBack) {
            router.back();
          } else {
            router.push("/dashboard");
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
  }, [pathname, router]);

  return null;
}
