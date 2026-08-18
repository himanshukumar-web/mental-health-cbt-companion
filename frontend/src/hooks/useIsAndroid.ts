"use client";

import { useState, useEffect } from "react";

let cachedIsAndroid: boolean | null = null;

function checkIsAndroidSync(): boolean {
  if (cachedIsAndroid !== null) return cachedIsAndroid;
  if (typeof window !== "undefined") {
    const search = window.location.search;
    if (search.includes("platform=android") || search.includes("mobile=true")) {
      cachedIsAndroid = true;
      return true;
    }
    if (typeof (window as any).Capacitor !== "undefined") {
      const cap = (window as any).Capacitor;
      if (cap.isNativePlatform?.() || cap.getPlatform?.() === "android" || cap.platform === "android") {
        cachedIsAndroid = true;
        return true;
      }
    }
    if (typeof navigator !== "undefined") {
      const ua = navigator.userAgent || "";
      if (/Android/i.test(ua) || /wv/i.test(ua) || /Capacitor/i.test(ua)) {
        cachedIsAndroid = true;
        return true;
      }
    }
  }
  return false;
}

export function useIsAndroid() {
  const [isAndroid, setIsAndroid] = useState<boolean>(() => checkIsAndroidSync());

  useEffect(() => {
    if (cachedIsAndroid === true) return;
    let isMounted = true;
    const detectAndroid = async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (Capacitor.isNativePlatform() || Capacitor.getPlatform() === "android") {
          cachedIsAndroid = true;
          if (isMounted) setIsAndroid(true);
          return;
        }
      } catch {
        /* Ignore capacitor import error in pure web environments */
      }

      if (typeof navigator !== "undefined") {
        const ua = navigator.userAgent || "";
        if (/Android/i.test(ua) || /wv/i.test(ua) || /Capacitor/i.test(ua)) {
          cachedIsAndroid = true;
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
