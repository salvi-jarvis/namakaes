import type { NexoData } from "./types";
import { buildDayPlan, fmtRange, isOverdue } from "./planner";
import { DAY_NAMES, addDays, formatLong, minutesLabel, weekdayOf } from "./time";

export type PromptKind = "optimizar" | "explicar" | "practicar" | "semana";
export type ShareOptions = { horario: boolean; tareas: boolean; actividades: boolean; plan: boolean };

export const PROMPT_LABELS: Record<PromptKind, string> = {
  optimizar: "Optimizar el plan de hoy",
  explicar: "Explicar un tema",
  practicar: "Crear preguntas de práctica",
  semana: "Planificar la semana",
};

const sub = (d: NexoData, id: string | null) => d.subjects.find((s) => s.id === id)?.name ?? "General";

export function buildPrompt(d: NexoData, kind: PromptKind, share: ShareOptions, today: string, topic: string, subjectId: string | null) {
  const lines: string[] = [];
  const wd = weekdayOf(today);
  const intro = "Soy estudiante de ESO en España. Responde en español, de forma clara y práctica.";
  if (kind === "optimizar")
    lines.push(intro, `Ayúdame a optimizar mi plan de estudio para hoy (${formatLong(today)}). Propón un horario realista con descansos y prioridades.`);
  if (kind === "semana")
    lines.push(intro, "Ayúdame a planificar mi semana de estudio por las tardes, respetando mis actividades fijas y repartiendo bien las asignaturas.");
  if (kind === "explicar")
    lines.push(intro, `Explícame este tema de ${sub(d, subjectId)} paso a paso, con un ejemplo y un pequeño resumen final: ${topic || "[escribe el tema]"}.`);
  if (kind === "practicar")
    lines.push(intro, `Crea 8 preguntas de práctica de ${sub(d, subjectId)} sobre: ${topic || "[escribe el tema]"}. Mezcla dificultad, y pon las soluciones al final.`);

  const days = kind === "semana" ? [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(today, i)) : [today];

  if (share.horario && wd <= 5 && kind !== "semana") {
    const p = d.timetable[String(wd) as "1"].filter((x) => x.kind === "clase" && x.subjectId);
    if (p.length) lines.push("", "Clases de hoy:", ...p.map((x) => `- ${x.start}–${x.end} ${sub(d, x.subjectId)}`));
  }
  if (share.actividades) {
    const acts = days.flatMap((day) =>
      d.activities.filter((a) => a.days.includes(weekdayOf(day))).map((a) => `- ${DAY_NAMES[weekdayOf(day)]}: ${a.name} ${a.start}–${a.end}`),
    );
    if (acts.length) lines.push("", "Actividades fijas:", ...acts);
  }
  if (share.tareas) {
    const pend = d.tasks
      .filter((t) => t.status !== "hecha")
      .filter((t) => (kind === "explicar" || kind === "practicar" ? !subjectId || t.subjectId === subjectId : true))
      .slice(0, 15)
      .map((t) => `- ${t.title} (${sub(d, t.subjectId)}), entrega ${t.due}${isOverdue(t, today) ? " [atrasada]" : ""}, ~${minutesLabel(t.minutes)}, prioridad ${t.priority}`);
    if (pend.length) lines.push("", "Tareas pendientes:", ...pend);
  }
  if (share.plan && (kind === "optimizar" || kind === "semana")) {
    for (const day of days) {
      const plan = buildDayPlan(d, day, today);
      const av = d.study.availability[String(weekdayOf(day))];
      if (!av?.enabled) continue;
      lines.push("", `Plan sugerido ${DAY_NAMES[weekdayOf(day)]} (disponible ${av.start}–${av.end}):`);
      plan.blocks.forEach((b) => lines.push(`- ${fmtRange(b.start, b.end)} ${b.label}`));
    }
    const pr = d.study.priorities.filter((p) => p.enabled).sort((a, b) => b.weight - a.weight);
    lines.push("", "Prioridades por asignatura (1–5):", ...pr.map((p) => `- ${sub(d, p.subjectId)}: ${p.weight}, ${p.minutes} min/día`));
  }
  return lines.join("\n");
}

export function chatGptUrl(prompt: string) {
  return `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`;
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}
