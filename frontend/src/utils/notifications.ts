"use client";

/**
 * Smart Notification Engine — Browser Push Notifications & Scheduler.
 */

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    console.warn("Browser does not support notifications.");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

export function sendBrowserNotification(title: string, options?: NotificationOptions) {
  if (typeof window === "undefined" || !("Notification" in window)) return;

  if (Notification.permission === "granted") {
    new Notification(title, {
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "sera-notification",
      ...options,
    });
  }
}

export interface SmartReminderConfig {
  moodTime?: string;
  journalTime?: string;
  meditationTime?: string;
  waterIntervalMinutes?: number;
  sleepTime?: string;
}

/**
 * Schedule browser timers based on user reminder settings.
 */
export function scheduleSmartReminders(config: SmartReminderConfig) {
  if (typeof window === "undefined" || Notification.permission !== "granted") return;

  // Hydration periodic check (e.g. every 60 mins)
  if (config.waterIntervalMinutes && config.waterIntervalMinutes > 0) {
    const intervalMs = config.waterIntervalMinutes * 60 * 1000;
    setInterval(() => {
      sendBrowserNotification("Hydration Check 💧", {
        body: "Time for a quick glass of water to keep your body and mind hydrated!",
      });
    }, intervalMs);
  }
}
