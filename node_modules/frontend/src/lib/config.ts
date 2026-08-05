export function getApiUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) return envUrl;
  if (typeof window !== "undefined") {
    const isCapacitor =
      (window as unknown as { Capacitor?: unknown }).Capacitor !== undefined ||
      window.location.protocol === "capacitor:";
    if (isCapacitor) {
      return "http://10.0.2.2:8000";
    }
    if (window.location.hostname !== "localhost") {
      return "https://mental-health-cbt-companion.onrender.com";
    }
  }
  return "http://localhost:8000";
}

export const API_URL = getApiUrl();
