import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { PageHeader, Section, Empty } from "@/components/nexo/AppShell";
import { SubjectSelect, SubjectTag } from "@/components/nexo/bits";
import { TaskDialog } from "@/components/nexo/TaskDialog";
import { AskAIDialog } from "@/components/nexo/AskAI";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { update, useNexo } from "@/lib/nexo/store";
import { isOverdue } from "@/lib/nexo/planner";
import { formatShort, minutesLabel, useMadridNow } from "@/lib/nexo/time";
import type { Task } from "@/lib/nexo/types";

export const Route = createFileRoute("/tareas")({
  head: () => ({ meta: [{ title: "Tareas — NEXO" }, { name: "description", content: "Deberes y tareas escolares." }, { property: "og:title", content: "Tareas — NEXO" }, { property: "og:description", content: "Deberes y tareas escolares." }] }),
  component: Tareas,
});

function Tareas() {
  const data = useNexo();
  const today = useMadridNow().date;
  const [filter, setFilter] = useState("abiertas");
  const [subject, setSubject] = useState<string | null>(null);
  const [edit, setEdit] = useState<Task | null>(null);
  const [open, setOpen] = useState(false);
  const [ai, setAi] = useState<Task | null>(null);

  const list = data.tasks
    .filter((t) => !subject || t.subjectId === subject)
    .filter((t) => filter === "todas" ? true : filter === "hechas" ? t.status === "hecha" : filter === "atrasadas" ? isOverdue(t, today) : t.status !== "hecha")
    .sort((a, b) => a.due.localeCompare(b.due));

  const groups: Array<[string, Task[]]> = [
    ["Atrasadas — no se mueven solas", list.filter((t) => isOverdue(t, today))],
    ["Hoy", list.filter((t) => t.due === today && !isOverdue(t, today))],
    ["Próximas", list.filter((t) => t.due > today && t.status !== "hecha")],
    ["Completadas", list.filter((t) => t.status === "hecha")],
  ];

  return (
    <>
      <PageHeader title="Tareas" subtitle="Las tareas incompletas nunca pasan solas a otro día: tú decides cuándo reprogramarlas."
        actions={<Button onClick={() => { setEdit(null); setOpen(true); }}><Plus className="size-4" /> Nueva tarea</Button>} />
      <div className="mb-4 flex flex-wrap gap-2">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="abiertas">Pendientes</SelectItem>
            <SelectItem value="atrasadas">Atrasadas</SelectItem>
            <SelectItem value="hechas">Hechas</SelectItem>
            <SelectItem value="todas">Todas</SelectItem>
          </SelectContent>
        </Select>
        <div className="w-56"><SubjectSelect data={data} value={subject} onChange={setSubject} noneLabel="Todas las asignaturas" /></div>
      </div>
      {list.length === 0 ? <Empty>No hay tareas con este filtro.</Empty> : (
        <div className="grid gap-4">
          {groups.filter(([, g]) => g.length).map(([name, g]) => (
            <Section key={name} title={`${name} (${g.length})`}>
              <ul className="divide-y divide-border">
                {g.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center gap-3 py-2.5">
                    <Checkbox checked={t.status === "hecha"} aria-label="Completar"
                      onCheckedChange={(c) => update((d) => ({ ...d, tasks: d.tasks.map((x) => x.id === t.id ? { ...x, status: c ? "hecha" : "pendiente", completedAt: c ? new Date().toISOString() : null } : x) }))} />
                    <div className="min-w-0 flex-1">
                      <div className={`text-sm font-medium ${t.status === "hecha" ? "text-muted-foreground line-through" : ""}`}>{t.title}</div>
                      <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                        <SubjectTag data={data} id={t.subjectId} />
                        <span className={isOverdue(t, today) ? "text-destructive" : ""}>{formatShort(t.due)}</span>
                        <span>{minutesLabel(t.minutes)}</span><span>Prioridad {t.priority}</span>
                        {t.status === "en_curso" && <span className="text-primary">En curso</span>}
                      </div>
                    </div>
                    {isOverdue(t, today) && (
                      <Input type="date" aria-label="Reprogramar" className="h-8 w-36" min={today} defaultValue=""
                        onChange={(e) => e.target.value && update((d) => ({ ...d, tasks: d.tasks.map((x) => x.id === t.id ? { ...x, due: e.target.value } : x) }))}
                        title="Reprogramar" />
                    )}
                    <div className="flex">
                      <Button variant="ghost" size="icon" aria-label="Preguntar a ChatGPT" onClick={() => setAi(t)}><Sparkles className="size-4" /></Button>
                      <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => { setEdit(t); setOpen(true); }}><Pencil className="size-4" /></Button>
                      <Button variant="ghost" size="icon" aria-label="Eliminar" onClick={() => confirm("¿Eliminar esta tarea?") && update((d) => ({ ...d, tasks: d.tasks.filter((x) => x.id !== t.id) }))}><Trash2 className="size-4" /></Button>
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          ))}
        </div>
      )}
      <TaskDialog open={open} onOpenChange={setOpen} task={edit} />
      <AskAIDialog open={!!ai} onOpenChange={(o) => !o && setAi(null)} kind="explicar" initialTopic={ai?.title ?? ""} initialSubject={ai?.subjectId ?? null} />
    </>
  );
}
