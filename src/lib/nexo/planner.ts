import type { NexoData, Task } from "./types";
import { addDays, toHHMM, toMin, weekdayOf } from "./time";

export type PlanBlock = {
  start: number;
  end: number;
  label: string;
  subjectId: string | null;
  taskId?: string | undefined;
};
export type DayPlan = {
  blocks: PlanBlock[];
  free: Array<[number, number]>;
  unscheduled: Array<{ label: string; minutes: number }>;
};

export function freeSlots(data: NexoData, weekday: number): Array<[number, number]> {
  const av = data.study.availability[String(weekday)];
  if (!av?.enabled) return [];
  let slots: Array<[number, number]> = [[toMin(av.start), toMin(av.end)]];
  const busy = data.activities
    .filter((a) => a.days.includes(weekday))
    .map((a) => [toMin(a.start) - a.buffer, toMin(a.end) + a.buffer] as [number, number]);
  for (const [bs, be] of busy) {
    const next: Array<[number, number]> = [];
    for (const [s, e] of slots) {
      if (be <= s || bs >= e) next.push([s, e]);
      else {
        if (bs > s) next.push([s, bs]);
        if (be < e) next.push([be, e]);
      }
    }
    slots = next;
  }
  return slots.filter(([s, e]) => e - s >= 10);
}

const PRI = { alta: 0, media: 1, baja: 2 } as const;

export function isOverdue(t: Task, today: string) {
  return t.status !== "hecha" && t.due < today;
}

/** Conflict-aware suggestion for one day. Never includes overdue tasks (they are never moved automatically). */
export function buildDayPlan(data: NexoData, date: string, today: string): DayPlan {
  const wd = weekdayOf(date);
  const free = freeSlots(data, wd);
  const subjectName = (id: string | null) => data.subjects.find((s) => s.id === id)?.name ?? "General";

  const demands: Array<{ label: string; minutes: number; subjectId: string | null; taskId?: string }> = [];
  const horizon = addDays(date, data.study.taskLookaheadDays);
  data.tasks
    .filter((t) => t.status !== "hecha" && t.due >= date && t.due >= today && t.due <= horizon && t.minutes > 0)
    .sort((a, b) => (a.due === b.due ? PRI[a.priority] - PRI[b.priority] : a.due < b.due ? -1 : 1))
    .forEach((t) => demands.push({ label: t.title, minutes: t.minutes, subjectId: t.subjectId, taskId: t.id }));

  [...data.study.priorities]
    .filter((p) => p.enabled && p.minutes > 0 && (p.days.length === 0 || p.days.includes(wd)))
    .filter((p) => data.subjects.some((s) => s.id === p.subjectId))
    .sort((a, b) => b.weight - a.weight)
    .forEach((p) => demands.push({ label: `Repaso: ${subjectName(p.subjectId)}`, minutes: p.minutes, subjectId: p.subjectId }));

  const blocks: PlanBlock[] = [];
  const unscheduled: DayPlan["unscheduled"] = [];
  const { blockMinutes, breakMinutes } = data.study;
  let si = 0;
  let cursor = free[0]?.[0] ?? 0;

  for (const d of demands) {
    let left = d.minutes;
    while (left > 0 && si < free.length) {
      const slotEnd = free[si]![1];
      const room = slotEnd - cursor;
      const piece = Math.min(left, blockMinutes, room);
      if (piece < Math.min(10, left)) {
        si++;
        cursor = free[si]?.[0] ?? 0;
        continue;
      }
      blocks.push({ start: cursor, end: cursor + piece, label: d.label, subjectId: d.subjectId, taskId: d.taskId });
      left -= piece;
      cursor += piece + breakMinutes;
      if (cursor >= slotEnd) {
        si++;
        cursor = free[si]?.[0] ?? 0;
      }
    }
    if (left > 0) unscheduled.push({ label: d.label, minutes: left });
  }
  return { blocks, free, unscheduled };
}

export const fmtRange = (s: number, e: number) => `${toHHMM(s)}–${toHHMM(e)}`;

export function routineStreak(log: string[], days: number[], today: string) {
  const set = new Set(log);
  let streak = 0;
  let d = set.has(today) ? today : addDays(today, -1);
  for (let i = 0; i < 400; i++) {
    if (days.includes(weekdayOf(d))) {
      if (!set.has(d)) break;
      streak++;
    }
    d = addDays(d, -1);
  }
  return streak;
}
