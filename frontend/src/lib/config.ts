export function getApiUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.trim() !== "") return envUrl.trim();

  if (typeof window !== "undefined") {
    const isCapacitor =
      (window as unknown as { Capacitor?: unknown }).Capacitor !== undefined ||
      window.location.protocol === "capacitor:";
    if (isCapacitor) {
      return "https://mental-health-cbt-companion.onrender.com";
    }
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:8000";
    }
    return "https://mental-health-cbt-companion.onrender.com";
  }

  return process.env.NODE_ENV === "development"
    ? "http://localhost:8000"
    : "https://mental-health-cbt-companion.onrender.com";
}

export const API_URL = getApiUrl();
