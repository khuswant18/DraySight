import type { UrgencyLevel } from "../types.js";

export function daysUntilDate(
  lastFreeDay: string,
  now: Date = new Date()
): number {
  const parts = lastFreeDay.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    const lfd = new Date(lastFreeDay + "T00:00:00");
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((lfd.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  const lfdDate = new Date(parts[0], parts[1] - 1, parts[2]);
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffMs = lfdDate.getTime() - nowDate.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function calculateUrgency(
  lastFreeDay?: string,
  now: Date = new Date()
): { urgency: UrgencyLevel; daysRemaining?: number } {
  if (!lastFreeDay) {
    return { urgency: "UNKNOWN" };
  }

  const daysRemaining = daysUntilDate(lastFreeDay, now);

  if (daysRemaining <= 1) {
    return { urgency: "CRITICAL", daysRemaining: Math.max(0, daysRemaining) };
  }
  if (daysRemaining <= 2) {
    return { urgency: "URGENT", daysRemaining };
  }
  return { urgency: "NORMAL", daysRemaining };
}
