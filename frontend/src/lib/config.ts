export function getApiUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) return envUrl;
  if (typeof window !== "undefined") {
    const isCapacitor =
      (window as unknown as { Capacitor?: unknown }).Capacitor !== undefined ||
      window.location.protocol === "capacitor:";
    if (isCapacitor) {
      return "https://mental-health-cbt-companion.onrender.com";
    }
    if (window.location.hostname !== "localhost") {
      return "https://mental-health-cbt-companion.onrender.com";
    }
  }
  return "https://mental-health-cbt-companion.onrender.com";
}

export const API_URL = getApiUrl();
