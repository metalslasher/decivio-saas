import type { InterviewSettings } from "@/lib/hiring/types";

// Interview slots are stored as Europe/Kyiv local time strings "YYYY-MM-DDTHH:mm" (no offset),
// so they never shift between the server (UTC) and the employer's or candidate's device.

const SLOT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
export const MAX_SLOTS = 40;

export function isValidSlot(value: unknown): value is string {
  return typeof value === "string" && SLOT_PATTERN.test(value) && !Number.isNaN(Date.parse(`${value}:00Z`));
}

export function kyivNowLocal(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Kyiv",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/** Adds days to a "YYYY-MM-DD" date, calendar-wise. */
export function addDaysToDate(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function parseInterviewSettings(value: unknown): InterviewSettings | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as { location?: unknown; slots?: unknown };
  const location = typeof raw.location === "string" ? raw.location.trim().slice(0, 200) : "";
  const slots = Array.isArray(raw.slots) ? Array.from(new Set(raw.slots.filter(isValidSlot))).sort().slice(0, MAX_SLOTS) : [];
  return { location, slots };
}

export function futureSlots(settings: InterviewSettings | null, taken: string[] = [], now = kyivNowLocal()) {
  if (!settings) return [];
  const busy = new Set(taken);
  return settings.slots.filter((slot) => slot > now && !busy.has(slot));
}

const WEEKDAYS = ["нд", "пн", "вт", "ср", "чт", "пт", "сб"];
const MONTHS = ["січ", "лют", "бер", "квіт", "трав", "черв", "лип", "серп", "вер", "жовт", "лист", "груд"];

/** "пт, 20 жовт · 14:00" — formatted from the stored local string, no timezone conversion. */
export function formatSlot(slot: string) {
  const [date, time] = slot.split("T");
  const [year, month, day] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return `${WEEKDAYS[weekday]}, ${day} ${MONTHS[month - 1]} · ${time}`;
}
