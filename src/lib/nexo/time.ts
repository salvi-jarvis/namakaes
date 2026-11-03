import { useEffect, useState } from "react";

export const TZ = "Europe/Madrid";
const WD: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

export type MadridNow = { date: string; minutes: number; weekday: number };

export function madridNow(d: Date = new Date()): MadridNow {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  }).formatToParts(d);
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  let h = Number(g("hour"));
  if (h === 24) h = 0;
  return {
    date: `${g("year")}-${g("month")}-${g("day")}`,
    minutes: h * 60 + Number(g("minute")),
    weekday: WD[g("weekday")] ?? 1,
  };
}

export function useMadridNow() {
  const [now, setNow] = useState(() => madridNow());
  useEffect(() => {
    const t = setInterval(() => setNow(madridNow()), 30_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export const toMin = (s: string) => {
  const [h, m] = s.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};
export const toHHMM = (n: number) => {
  const c = Math.max(0, Math.min(24 * 60 - 1, Math.round(n)));
  return `${String(Math.floor(c / 60)).padStart(2, "0")}:${String(c % 60).padStart(2, "0")}`;
};

export function addDays(date: string, n: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function weekdayOf(date: string) {
  const d = new Date(`${date}T12:00:00Z`).getUTCDay();
  return d === 0 ? 7 : d;
}
export function mondayOf(date: string) {
  return addDays(date, 1 - weekdayOf(date));
}
export function formatDate(date: string, opts: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("es-ES", { timeZone: "UTC", ...opts }).format(new Date(`${date}T12:00:00Z`));
}
export const formatLong = (date: string) =>
  formatDate(date, { weekday: "long", day: "numeric", month: "long" });
export const formatShort = (date: string) => formatDate(date, { weekday: "short", day: "numeric", month: "short" });

export const DAY_NAMES = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
export const DAY_SHORT = ["", "L", "M", "X", "J", "V", "S", "D"];

export function minutesLabel(m: number) {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}
