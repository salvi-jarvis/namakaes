import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Section, Empty } from "@/components/nexo/AppShell";
import { SubjectSelect } from "@/components/nexo/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { update, useNexo } from "@/lib/nexo/store";
import { uid } from "@/lib/nexo/defaults";
import { COLOR_CLASSES } from "@/lib/nexo/colors";
import { DAY_NAMES, toMin, toHHMM, useMadridNow } from "@/lib/nexo/time";
import type { Period, Weekday } from "@/lib/nexo/types";

export const Route = createFileRoute("/horario")({
  head: () => ({ meta: [{ title: "Horario — NEXO" }, { name: "description", content: "Horario semanal de clases editable." }, { property: "og:title", content: "Horario — NEXO" }, { property: "og:description", content: "Horario semanal de clases editable." }] }),
  component: Horario,
});

function Horario() {
  const data = useNexo();
  const wd = useMadridNow().weekday;
  const [day, setDay] = useState<Weekday>(String(wd <= 5 ? wd : 1) as Weekday);
  const periods = data.timetable[day];
  const setP = (fn: (p: Period[]) => Period[]) => update((d) => ({ ...d, timetable: { ...d.timetable, [day]: fn(d.timetable[day]) } }));
  const patch = (id: string, v: Partial<Period>) => setP((p) => p.map((x) => (x.id === id ? { ...x, ...v } : x)));
  const move = (i: number, dir: number) => setP((p) => { const a = [...p]; const j = i + dir; if (j < 0 || j >= a.length) return a; [a[i], a[j]] = [a[j]!, a[i]!]; return a; });
  const add = (kind: Period["kind"]) => setP((p) => { const last = p[p.length - 1]; const s = last ? toMin(last.end) : toMin(data.settings.schoolStart); return [...p, { id: uid(), kind, start: toHHMM(s), end: toHHMM(s + (kind === "recreo" ? 30 : 55)), subjectId: null, room: "", teacher: "" }]; });

  return (
    <>
      <PageHeader title="Horario" subtitle="Los periodos vienen sin asignatura: asígnalas tú." />
      <Tabs value={day} onValueChange={(v) => setDay(v as Weekday)} className="mb-4">
        <TabsList>{(["1", "2", "3", "4", "5"] as Weekday[]).map((d) => <TabsTrigger key={d} value={d}>{DAY_NAMES[+d]}</TabsTrigger>)}</TabsList>
      </Tabs>
      <Section title={DAY_NAMES[+day]} action={
        <Select value="" onValueChange={(target) => { update((d) => ({ ...d, timetable: { ...d.timetable, [target]: d.timetable[day].map((p) => ({ ...p, id: uid() })) } })); toast.success(`Copiado a ${DAY_NAMES[+target]}`); }}>
          <SelectTrigger className="h-8 w-40"><Copy className="size-3" /><SelectValue placeholder="Copiar día a…" /></SelectTrigger>
          <SelectContent>{["1", "2", "3", "4", "5"].filter((d) => d !== day).map((d) => <SelectItem key={d} value={d}>{DAY_NAMES[+d]}</SelectItem>)}</SelectContent>
        </Select>}>
        {periods.length === 0 && <Empty>Sin periodos.</Empty>}
        <ul className="grid gap-2">
          {periods.map((p, i) => {
            const s = data.subjects.find((x) => x.id === p.subjectId);
            return (
              <li key={p.id} className={`grid gap-2 rounded-lg border border-border border-l-4 p-3 md:grid-cols-[auto_1fr_auto] md:items-center ${s ? COLOR_CLASSES[s.color].bar : "border-l-border"} ${p.kind === "recreo" ? "bg-muted" : ""}`}>
                <div className="flex gap-2">
                  <Input type="time" aria-label="Inicio" className="w-28" value={p.start} onChange={(e) => e.target.value && patch(p.id, { start: e.target.value })} />
                  <Input type="time" aria-label="Fin" className="w-28" value={p.end} onChange={(e) => e.target.value && patch(p.id, { end: e.target.value })} />
                </div>
                {p.kind === "recreo" ? <span className="text-sm text-muted-foreground">Recreo</span> : (
                  <div className="grid gap-2 sm:grid-cols-3">
                    <SubjectSelect data={data} value={p.subjectId} onChange={(v) => patch(p.id, { subjectId: v })} />
                    <Input placeholder="Aula (opcional)" value={p.room} onChange={(e) => patch(p.id, { room: e.target.value })} />
                    <Input placeholder="Profesor/a (opcional)" value={p.teacher} onChange={(e) => patch(p.id, { teacher: e.target.value })} />
                  </div>
                )}
                <div className="flex">
                  <Button variant="ghost" size="icon" aria-label="Subir" onClick={() => move(i, -1)}><ArrowUp className="size-4" /></Button>
                  <Button variant="ghost" size="icon" aria-label="Bajar" onClick={() => move(i, 1)}><ArrowDown className="size-4" /></Button>
                  <Button variant="ghost" size="icon" aria-label="Eliminar" onClick={() => setP((x) => x.filter((y) => y.id !== p.id))}><Trash2 className="size-4" /></Button>
                </div>
                {toMin(p.end) <= toMin(p.start) && <p className="text-xs text-destructive">Fin anterior al inicio.</p>}
              </li>
            );
          })}
        </ul>
        <div className="mt-3 flex gap-2">
          <Button variant="outline" onClick={() => add("clase")}><Plus className="size-4" /> Clase</Button>
          <Button variant="outline" onClick={() => add("recreo")}><Plus className="size-4" /> Recreo</Button>
        </div>
      </Section>
    </>
  );
}
