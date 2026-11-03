import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Section } from "@/components/nexo/AppShell";
import { SubjectDot } from "@/components/nexo/bits";
import { AskAIButtons } from "@/components/nexo/AskAI";
import { ActivitiesEditor, AvailabilityEditor, PrioritiesEditor } from "@/components/nexo/StudyEditors";
import { update, useNexo } from "@/lib/nexo/store";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { buildDayPlan, fmtRange } from "@/lib/nexo/planner";
import { DAY_NAMES, addDays, mondayOf, toMin, useMadridNow, weekdayOf } from "@/lib/nexo/time";

export const Route = createFileRoute("/plan")({
  head: () => ({ meta: [{ title: "Plan de estudio — NEXO" }, { name: "description", content: "Plan semanal de estudio por las tardes." }, { property: "og:title", content: "Plan de estudio — NEXO" }, { property: "og:description", content: "Plan semanal de estudio por las tardes." }] }),
  component: Plan,
});

function Plan() {
  const data = useNexo();
  const today = useMadridNow().date;
  const mon = mondayOf(today);
  const days = [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(mon, i)).filter((d) => data.study.availability[String(weekdayOf(d))]?.enabled || weekdayOf(d) <= 5);
  return (
    <>
      <PageHeader title="Plan de estudio" subtitle="Sugerencias automáticas que respetan tus actividades. No se inventan deberes ni exámenes." />
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {days.map((d) => {
          const wd = weekdayOf(d);
          const plan = buildDayPlan(data, d, today);
          const acts = data.activities.filter((a) => a.days.includes(wd));
          const rows = [
            ...plan.blocks.map((b) => ({ s: b.start, e: b.end, t: b.label, sub: b.subjectId, fixed: false })),
            ...acts.map((a) => ({ s: toMin(a.start), e: toMin(a.end), t: a.name, sub: null, fixed: true })),
          ].sort((a, b) => a.s - b.s);
          return (
            <Section key={d} title={`${DAY_NAMES[wd]}${d === today ? " · hoy" : ""}`}>
              {rows.length === 0 ? <p className="text-sm text-muted-foreground">Sin estudio previsto.</p> : (
                <ul className="grid gap-1 text-sm">
                  {rows.map((r, i) => (
                    <li key={i} className={`flex items-center gap-2 ${r.fixed ? "font-medium text-primary" : ""}`}>
                      <span className="tabular w-24 shrink-0 text-xs text-muted-foreground">{fmtRange(r.s, r.e)}</span>
                      <SubjectDot data={data} id={r.sub} /><span className="truncate">{r.t}</span>
                    </li>
                  ))}
                </ul>
              )}
              {plan.unscheduled.length > 0 && <p className="mt-2 text-xs text-warning">Sin hueco: {plan.unscheduled.map((u) => `${u.label} (${u.minutes} min)`).join(", ")}</p>}
            </Section>
          );
        })}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Prioridades por asignatura"><PrioritiesEditor /></Section>
        <div className="grid content-start gap-4">
          <Section title="Disponibilidad"><AvailabilityEditor /></Section>
          <Section title="Actividades fijas"><ActivitiesEditor /></Section>
          <Section title="Pregunta a ChatGPT"><AskAIButtons kinds={["optimizar", "semana"]} /></Section>
          <Section title="Notas guardadas">
            {data.notes.length === 0 ? <p className="text-sm text-muted-foreground">Aún no hay notas. Guarda respuestas de ChatGPT desde «Pegar respuesta».</p> : (
              <ul className="grid gap-2">
                {data.notes.map((n) => (
                  <li key={n.id} className="rounded-md border p-2 text-sm">
                    <details>
                      <summary className="flex cursor-pointer items-center gap-2"><SubjectDot data={data} id={n.subjectId} /><span className="flex-1 truncate font-medium">{n.title}</span><span className="text-xs text-muted-foreground">{n.kind === "plan" ? "Plan" : "Práctica"}</span>
                        <Button variant="ghost" size="icon" aria-label="Eliminar nota" onClick={(e) => { e.preventDefault(); if (confirm("¿Eliminar esta nota?")) update((d) => ({ ...d, notes: d.notes.filter((x) => x.id !== n.id) })); }}><Trash2 className="size-4" /></Button>
                      </summary>
                      <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap font-sans text-xs">{n.body}</pre>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}
