import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Section, Empty } from "@/components/nexo/AppShell";
import { SubjectDot, SubjectSelect, SubjectTag } from "@/components/nexo/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { update, useNexo } from "@/lib/nexo/store";
import { uid } from "@/lib/nexo/defaults";
import { addDays, formatDate, formatLong, madridNow, minutesLabel, mondayOf } from "@/lib/nexo/time";
import type { Exam } from "@/lib/nexo/types";
import { cn } from "@/lib/utils";

const META = "Calendario mensual de exámenes: crea, edita y filtra por asignatura.";
export const Route = createFileRoute("/examenes")({
  head: () => ({
    meta: [
      { title: "Calendario de exámenes — NEXO" },
      { name: "description", content: META },
      { property: "og:title", content: "Calendario de exámenes — NEXO" },
      { property: "og:description", content: META },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Examenes,
});

const WEEK = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
type Draft = Omit<Exam, "id"> & { id?: string };

/** 42 ISO dates (6 weeks, Monday first) covering the month of `month` (YYYY-MM). */
export function monthGrid(month: string) {
  const start = mondayOf(`${month}-01`);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}
function shiftMonth(month: string, n: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y!, m! - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

function Examenes() {
  const data = useNexo();
  const today = madridNow().date;
  const [month, setMonth] = useState(today.slice(0, 7));
  const [selected, setSelected] = useState(today);
  const [filter, setFilter] = useState("__all");
  const [draft, setDraft] = useState<Draft | null>(null);

  const exams = useMemo(
    () =>
      data.exams
        .filter((e) => filter === "__all" || (filter === "__none" ? e.subjectId === null : e.subjectId === filter))
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
    [data.exams, filter],
  );
  const byDay = useMemo(() => {
    const m = new Map<string, Exam[]>();
    exams.forEach((e) => m.set(e.date, [...(m.get(e.date) ?? []), e]));
    return m;
  }, [exams]);
  const dayExams = byDay.get(selected) ?? [];
  const upcoming = exams.filter((e) => e.date >= today).slice(0, 6);

  const goToday = () => { setMonth(today.slice(0, 7)); setSelected(today); };
  const newExam = () => setDraft({ title: "", subjectId: null, date: selected, time: "", duration: 0, notes: "" });
  const save = () => {
    if (!draft) return;
    const title = draft.title.trim();
    if (!title) { toast.error("Escribe un título."); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) { toast.error("Elige una fecha."); return; }
    const exam: Exam = { ...draft, title, id: draft.id ?? uid(), duration: Math.max(0, Math.min(600, Math.round(draft.duration || 0))) };
    update((d) => ({ ...d, exams: draft.id ? d.exams.map((e) => (e.id === draft.id ? exam : e)) : [...d.exams, exam] }));
    setSelected(exam.date);
    setMonth(exam.date.slice(0, 7));
    setDraft(null);
    toast.success(draft.id ? "Examen actualizado" : "Examen guardado");
  };
  const remove = (e: Exam) => {
    if (!confirm(`¿Eliminar «${e.title}»?`)) return;
    update((d) => ({ ...d, exams: d.exams.filter((x) => x.id !== e.id) }));
    toast.success("Examen eliminado");
  };

  const ml = formatDate(`${month}-01`, { month: "long", year: "numeric" });
  const monthLabel = ml.charAt(0).toUpperCase() + ml.slice(1);

  return (
    <>
      <PageHeader
        title="Calendario de exámenes"
        subtitle="Tus exámenes se guardan en este navegador."
        actions={<Button onClick={newExam}><Plus className="size-4" />Nuevo examen</Button>}
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Section>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Mes anterior" onClick={() => setMonth(shiftMonth(month, -1))}><ChevronLeft className="size-4" /></Button>
            <h2 className="min-w-36 text-center text-sm font-semibold" aria-live="polite">{monthLabel}</h2>
            <Button variant="ghost" size="icon" aria-label="Mes siguiente" onClick={() => setMonth(shiftMonth(month, 1))}><ChevronRight className="size-4" /></Button>
            <Button variant="outline" size="sm" onClick={goToday}>Hoy</Button>
            <div className="ml-auto w-48">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger aria-label="Filtrar por asignatura"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">Todas las asignaturas</SelectItem>
                  <SelectItem value="__none">Sin asignatura</SelectItem>
                  {data.subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground" aria-hidden>
            {WEEK.map((w) => <div key={w} className="py-1">{w}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1" role="grid" aria-label={`Exámenes de ${monthLabel}`}>
            {monthGrid(month).map((d) => {
              const list = byDay.get(d) ?? [];
              const inMonth = d.startsWith(month);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelected(d)}
                  aria-pressed={d === selected}
                  aria-label={`${formatLong(d)}${list.length ? `, ${list.length} examen${list.length > 1 ? "es" : ""}` : ""}`}
                  className={cn(
                    "flex min-h-14 flex-col items-start gap-1 rounded-lg border p-1.5 text-left text-xs transition-colors sm:min-h-20",
                    inMonth ? "border-border" : "border-transparent text-muted-foreground/60",
                    d === selected ? "bg-accent ring-2 ring-primary" : "hover:bg-accent/60",
                    list.length > 0 && "font-medium",
                  )}
                >
                  <span className={cn("grid size-6 place-items-center rounded-full", d === today && "bg-primary text-primary-foreground")}>{Number(d.slice(8))}</span>
                  <span className="flex flex-wrap gap-0.5">
                    {list.slice(0, 4).map((e) => <SubjectDot key={e.id} data={data} id={e.subjectId} />)}
                  </span>
                  {list[0] && <span className="hidden w-full truncate sm:block">{list[0].title}</span>}
                </button>
              );
            })}
          </div>
        </Section>

        <div className="grid content-start gap-4">
          <Section title={formatLong(selected)} action={<Button size="sm" variant="ghost" onClick={newExam}><Plus className="size-4" />Añadir</Button>}>
            {dayExams.length === 0 ? <Empty>No hay exámenes este día.</Empty> : (
              <ul className="grid gap-2">
                {dayExams.map((e) => (
                  <li key={e.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium">{e.title}</p>
                        <SubjectTag data={data} id={e.subjectId} />
                        <p className="text-xs text-muted-foreground">
                          {e.time || "Sin hora"}{e.duration ? ` · ${minutesLabel(e.duration)}` : ""}
                        </p>
                        {e.notes && <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{e.notes}</p>}
                      </div>
                      <div className="flex shrink-0">
                        <Button size="icon" variant="ghost" aria-label={`Editar ${e.title}`} onClick={() => setDraft(e)}><Pencil className="size-4" /></Button>
                        <Button size="icon" variant="ghost" aria-label={`Eliminar ${e.title}`} onClick={() => remove(e)}><Trash2 className="size-4" /></Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
          <Section title="Próximos exámenes">
            {upcoming.length === 0 ? <Empty>No tienes exámenes próximos.</Empty> : (
              <ul className="grid gap-1">
                {upcoming.map((e) => (
                  <li key={e.id}>
                    <button type="button" className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent" onClick={() => { setSelected(e.date); setMonth(e.date.slice(0, 7)); }}>
                      <SubjectDot data={data} id={e.subjectId} />
                      <span className="flex-1 truncate">{e.title}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(e.date, { day: "numeric", month: "short" })}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Section>
          <Section title="Google Calendar">
            <p className="text-sm text-muted-foreground">Pendiente de configuración: todavía no está conectado. El calendario de exámenes funciona sin él.</p>
          </Section>
        </div>
      </div>

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{draft?.id ? "Editar examen" : "Nuevo examen"}</DialogTitle></DialogHeader>
          {draft && (
            <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); save(); }}>
              <div className="grid gap-1.5"><Label htmlFor="ex-title">Título</Label><Input id="ex-title" required value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Examen tema 3" /></div>
              <div className="grid gap-1.5"><Label htmlFor="ex-sub">Asignatura</Label><SubjectSelect id="ex-sub" data={data} value={draft.subjectId} onChange={(v) => setDraft({ ...draft, subjectId: v })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5"><Label htmlFor="ex-date">Fecha</Label><Input id="ex-date" type="date" required value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></div>
                <div className="grid gap-1.5"><Label htmlFor="ex-time">Hora (opcional)</Label><Input id="ex-time" type="time" value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} /></div>
              </div>
              <div className="grid gap-1.5"><Label htmlFor="ex-dur">Duración en minutos (opcional)</Label><Input id="ex-dur" type="number" min={0} max={600} value={draft.duration || ""} onChange={(e) => setDraft({ ...draft, duration: Number(e.target.value) || 0 })} /></div>
              <div className="grid gap-1.5"><Label htmlFor="ex-notes">Notas</Label><Textarea id="ex-notes" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></div>
              <DialogFooter><Button type="button" variant="outline" onClick={() => setDraft(null)}>Cancelar</Button><Button type="submit">Guardar</Button></DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
