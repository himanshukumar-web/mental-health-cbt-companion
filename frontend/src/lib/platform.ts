/**
 * Platform detection helper for distinguishing between native Capacitor app (Android/iOS)
 * and standard Web / Desktop browser environments.
 */

export function isCapacitorNative(): boolean {
  if (typeof window === "undefined") return false;

  // 1. Direct Capacitor bridge check
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string; platform?: string } }).Capacitor;
  if (cap) {
    if (typeof cap.isNativePlatform === "function" && cap.isNativePlatform()) {
      return true;
    }
    if (typeof cap.getPlatform === "function") {
      const p = cap.getPlatform();
      if (p === "android" || p === "ios") return true;
    }
    if (cap.platform === "android" || cap.platform === "ios") {
      return true;
    }
  }

  // 2. Custom capacitor protocol check
  if (window.location.protocol === "capacitor:") {
    return true;
  }

  // 3. Check for explicit platform query parameter used in Android builds or dev previews
  if (window.location.search.includes("platform=android-native")) {
    return true;
  }

  return false;
}
