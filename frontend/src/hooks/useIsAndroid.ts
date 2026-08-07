"use client";

import { useState, useEffect } from "react";

export function useIsAndroid() {
  const [isAndroid, setIsAndroid] = useState<boolean>(false);

  useEffect(() => {
    const detectAndroid = async () => {
      // 1. Check URL query override for testing in browser (e.g. ?platform=android or ?mobile=true)
      if (typeof window !== "undefined") {
        const search = window.location.search;
        if (search.includes("platform=android") || search.includes("mobile=true")) {
          setIsAndroid(true);
          return;
        }
      }

      // 2. Check Capacitor Native Platform
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (Capacitor.isNativePlatform() || Capacitor.getPlatform() === "android") {
          setIsAndroid(true);
          return;
        }
      } catch (err) {
        /* Ignore capacitor import error in pure web environments */
      }

      // 3. Optional userAgent check for Android WebView
      if (typeof navigator !== "undefined") {
        const ua = navigator.userAgent || "";
        if (/Android/i.test(ua) && /wv|Capacitor/i.test(ua)) {
          setIsAndroid(true);
        }
      }
    };

    detectAndroid();
  }, []);

  return isAndroid;
}
