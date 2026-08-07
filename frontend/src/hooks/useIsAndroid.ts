"use client";

import { useState, useEffect } from "react";

export function useIsAndroid() {
  const [isAndroid, setIsAndroid] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const search = window.location.search;
      if (search.includes("platform=android") || search.includes("mobile=true")) {
        return true;
      }
      if (typeof navigator !== "undefined") {
        const ua = navigator.userAgent || "";
        if (/Android/i.test(ua) && (/wv/i.test(ua) || /Capacitor/i.test(ua) || /Android/i.test(ua))) {
          // If in Capacitor WebView or mobile testing, default to true immediately
          if (typeof (window as any).Capacitor !== "undefined" || search.includes("platform=android")) {
            return true;
          }
        }
      }
      if (typeof (window as any).Capacitor !== "undefined") {
        const cap = (window as any).Capacitor;
        if (cap.isNativePlatform?.() || cap.getPlatform?.() === "android") {
          return true;
        }
      }
    }
    return false;
  });

  useEffect(() => {
    let isMounted = true;
    const detectAndroid = async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (Capacitor.isNativePlatform() || Capacitor.getPlatform() === "android") {
          if (isMounted) setIsAndroid(true);
          return;
        }
      } catch (err) {
        /* Ignore capacitor import error in pure web environments */
      }

      if (typeof navigator !== "undefined") {
        const ua = navigator.userAgent || "";
        if (/Android/i.test(ua) && (/wv/i.test(ua) || /Capacitor/i.test(ua))) {
          if (isMounted) setIsAndroid(true);
        }
      }
    };

    detectAndroid();
    return () => {
      isMounted = false;
    };
  }, []);

  return isAndroid;
}
