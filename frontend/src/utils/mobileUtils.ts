/**
 * Shared Android Mobile Utility Functions
 */

export function getGreeting(): { text: string; subtext: string; icon: string } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good Morning", subtext: "Start your day with clarity", icon: "🌅" };
  if (hour < 17) return { text: "Good Afternoon", subtext: "Take a mindful break", icon: "☀️" };
  if (hour < 21) return { text: "Good Evening", subtext: "Reflect on your day", icon: "🌙" };
  return { text: "Good Night", subtext: "Rest and unwind", icon: "✨" };
}

export function formatMobileDate(dateInput?: string | number | Date): string {
  if (!dateInput) return "Today";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "Today";
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return "Today";
  }
}

export function formatMobileTime(timeStr?: string): string {
  if (!timeStr) return "";
  return timeStr;
}
