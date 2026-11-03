import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Section, Empty } from "@/components/nexo/AppShell";
import { SubjectDot, SubjectTag } from "@/components/nexo/bits";
import { AskAIButtons } from "@/components/nexo/AskAI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { update, useNexo } from "@/lib/nexo/store";
import { uid } from "@/lib/nexo/defaults";
import { buildDayPlan, fmtRange, isOverdue } from "@/lib/nexo/planner";
import { formatLong, mondayOf, toMin, useMadridNow } from "@/lib/nexo/time";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hoy — NEXO" },
      { name: "description", content: "Tu día escolar: clases, tareas y estudio." },
      { property: "og:title", content: "Hoy — NEXO" },
      { property: "og:description", content: "Tu día escolar: clases, tareas y estudio." },
    ],
  }),
  component: Hoy,
});

type Item = { start: number; end: number; title: string; kind: string; subjectId: string | null };

function Hoy() {
  const data = useNexo();
  const now = useMadridNow();
  const [title, setTitle] = useState("");
  const today = now.date;
  const items: Item[] = [];
  if (now.weekday <= 5)
    data.timetable[String(now.weekday) as "1"].forEach((p) =>
      items.push({ start: toMin(p.start), end: toMin(p.end), kind: p.kind === "recreo" ? "Recreo" : "Clase", subjectId: p.subjectId,
        title: p.kind === "recreo" ? "Recreo" : data.subjects.find((s) => s.id === p.subjectId)?.name ?? "Clase sin asignar" }));
  data.activities.filter((a) => a.days.includes(now.weekday)).forEach((a) =>
    items.push({ start: toMin(a.start), end: toMin(a.end), title: a.name, kind: a.kind === "ingles" ? "Inglés" : a.kind === "entreno" ? "Entreno" : "Actividad", subjectId: null }));
  buildDayPlan(data, today, today).blocks.forEach((b) => items.push({ start: b.start, end: b.end, title: b.label, kind: "Estudio", subjectId: b.subjectId }));
  items.sort((a, b) => a.start - b.start);
  const next = items.find((i) => i.end > now.minutes);

  const open = data.tasks.filter((t) => t.status !== "hecha");
  const overdue = open.filter((t) => isOverdue(t, today));
  const dueToday = open.filter((t) => t.due === today);
  const mon = mondayOf(today);
  const weekTasks = data.tasks.filter((t) => t.due >= mon && t.due <= today || (t.completedAt ?? "").slice(0, 10) >= mon);
  const doneWeek = weekTasks.filter((t) => t.status === "hecha").length;
  const routinesToday = data.routines.filter((r) => r.days.includes(now.weekday));

  const add = () => {
    if (!title.trim()) return;
    update((d) => ({ ...d, tasks: [...d.tasks, { id: uid(), title: title.trim(), subjectId: null, due: today, minutes: 30, priority: "media", status: "pendiente", notes: "", createdAt: new Date().toISOString(), completedAt: null }] }));
    setTitle("");
    toast.success("Tarea añadida para hoy");
  };
  const toggle = (id: string) => update((d) => ({ ...d, tasks: d.tasks.map((t) => t.id === id ? { ...t, status: t.status === "hecha" ? "pendiente" : "hecha", completedAt: t.status === "hecha" ? null : new Date().toISOString() } : t) }));

  return (
    <>
      <PageHeader title={data.settings.name ? `Hola, ${data.settings.name}` : "Hoy"} subtitle={<span className="capitalize">{formatLong(today)}</span>} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="grid gap-4 lg:col-span-2">
          <Section title="Ahora / siguiente">
            {next ? (
              <div className="flex items-center gap-3">
                <SubjectDot data={data} id={next.subjectId} className="size-3" />
                <div>
                  <div className="font-medium">{next.title}</div>
                  <div className="tabular text-sm text-muted-foreground">{next.kind} · {fmtRange(next.start, next.end)}{next.start <= now.minutes ? " · en curso" : ""}</div>
                </div>
              </div>
            ) : <p className="text-sm text-muted-foreground">No queda nada programado hoy.</p>}
          </Section>
          <Section title="Agenda">
            {items.length === 0 ? <Empty>Nada en la agenda de hoy.</Empty> : (
              <ol className="grid gap-1">
                {items.map((i, k) => (
                  <li key={k} className={`flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm ${i.end <= now.minutes ? "opacity-50" : ""}`}>
                    <span className="tabular w-24 shrink-0 text-muted-foreground">{fmtRange(i.start, i.end)}</span>
                    <SubjectDot data={data} id={i.subjectId} />
                    <span className="flex-1 truncate">{i.title}</span>
                    <span className="text-xs text-muted-foreground">{i.kind}</span>
                  </li>
                ))}
              </ol>
            )}
          </Section>
          <Section title="Pregunta a ChatGPT"><AskAIButtons /></Section>
        </div>
        <div className="grid content-start gap-4">
          <Section title="Añadir tarea rápida">
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); add(); }}>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título (para hoy)" aria-label="Título de la tarea" />
              <Button type="submit" size="icon" aria-label="Añadir"><Plus className="size-4" /></Button>
            </form>
          </Section>
          <Section title="Prioridades de hoy" action={<Link to="/tareas" className="text-xs text-primary">Ver todas</Link>}>
            {overdue.length + dueToday.length === 0 ? <Empty>Sin tareas para hoy.</Empty> : (
              <ul className="grid gap-2">
                {[...overdue, ...dueToday].map((t) => (
                  <li key={t.id} className="flex items-start gap-2">
                    <Checkbox className="mt-0.5" checked={false} onCheckedChange={() => toggle(t.id)} aria-label={`Completar ${t.title}`} />
                    <div className="min-w-0">
                      <div className="truncate text-sm">{t.title}</div>
                      <div className="flex gap-2"><SubjectTag data={data} id={t.subjectId} />{isOverdue(t, today) && <span className="text-xs text-destructive">Atrasada</span>}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
          <Section title="Rutinas de hoy">
            {routinesToday.length === 0 ? <Empty>Sin rutinas.</Empty> : routinesToday.map((r) => (
              <label key={r.id} className="flex items-center gap-2 py-1 text-sm">
                <Checkbox checked={r.log.includes(today)} onCheckedChange={(c) => update((d) => ({ ...d, routines: d.routines.map((x) => x.id === r.id ? { ...x, log: c ? [...x.log, today] : x.log.filter((y) => y !== today) } : x) }))} />
                {r.title}{r.note && <span className="text-xs text-muted-foreground">· {r.note}</span>}
              </label>
            ))}
          </Section>
          <Section title="Progreso semanal">
            <div className="mb-2 text-sm text-muted-foreground">{doneWeek} de {weekTasks.length} tareas completadas</div>
            <Progress value={weekTasks.length ? (doneWeek / weekTasks.length) * 100 : 0} />
          </Section>
        </div>
      </div>
    </>
  );
}
