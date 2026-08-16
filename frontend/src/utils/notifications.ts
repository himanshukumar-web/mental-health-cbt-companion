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
      tag: "mindmate-notification",
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
  healthMeasureTime?: string;
}

// Track active interval IDs to prevent duplicates
const _activeIntervals: { [key: string]: ReturnType<typeof setInterval> | ReturnType<typeof setTimeout> } = {};

function clearExistingReminder(key: string) {
  if (_activeIntervals[key]) {
    clearInterval(_activeIntervals[key]);
    clearTimeout(_activeIntervals[key]);
    delete _activeIntervals[key];
  }
}

/**
 * Schedule browser timers based on user reminder settings.
 * Prevents duplicate reminders by clearing previous timers.
 */
export function scheduleSmartReminders(config: SmartReminderConfig) {
  if (typeof window === "undefined" || Notification.permission !== "granted") return;

  // Hydration periodic check (e.g. every 60 mins)
  clearExistingReminder("water");
  if (config.waterIntervalMinutes && config.waterIntervalMinutes > 0) {
    const intervalMs = config.waterIntervalMinutes * 60 * 1000;
    _activeIntervals["water"] = setInterval(() => {
      sendBrowserNotification("Hydration Check 💧", {
        body: "Time for a quick glass of water to keep your body and mind hydrated!",
      });
    }, intervalMs);
  }

  // Health Measure daily reminder
  clearExistingReminder("healthMeasure");
  if (config.healthMeasureTime) {
    const scheduleHealthMeasure = () => {
      const now = new Date();
      const [hours, minutes] = config.healthMeasureTime!.split(":").map(Number);
      const target = new Date();
      target.setHours(hours, minutes, 0, 0);

      // If the target time has already passed today, schedule for tomorrow
      if (target.getTime() <= now.getTime()) {
        target.setDate(target.getDate() + 1);
      }

      const delay = target.getTime() - now.getTime();

      _activeIntervals["healthMeasure"] = setTimeout(() => {
        // Check if today's measure is already completed
        const todayStr = new Date().toLocaleDateString("en-CA");
        const storageKeys = Object.keys(localStorage);
        const alreadyDone = storageKeys.some(
          (k) => k.startsWith("healthMeasure_") && k.endsWith(`_${todayStr}`)
        );

        if (!alreadyDone) {
          sendBrowserNotification("Daily Health Measure 🩺", {
            body: "Time for your daily wellness check-in! Track how you're feeling today.",
            tag: "health-measure-daily",
          });
        }

        // Re-schedule for the next day
        scheduleHealthMeasure();
      }, delay);
    };

    scheduleHealthMeasure();
  }
}
