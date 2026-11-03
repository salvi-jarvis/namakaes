import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DayPicker, SubjectDot } from "./bits";
import { update, useNexo } from "@/lib/nexo/store";
import { uid } from "@/lib/nexo/defaults";
import { DAY_NAMES, toMin } from "@/lib/nexo/time";
import type { Activity, NexoData, SubjectPriority } from "@/lib/nexo/types";
import { Empty } from "./AppShell";

export function ActivitiesEditor() {
  const data = useNexo();
  const set = (id: string, patch: Partial<Activity>) =>
    update((d) => ({ ...d, activities: d.activities.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
  return (
    <div className="grid gap-3">
      {data.activities.length === 0 && <Empty>Sin actividades fijas.</Empty>}
      {data.activities.map((a) => {
        const bad = toMin(a.end) <= toMin(a.start);
        return (
          <div key={a.id} className="grid gap-3 rounded-lg border border-border p-3">
            <div className="flex gap-2">
              <Input aria-label="Nombre" value={a.name} onChange={(e) => set(a.id, { name: e.target.value || " " })} />
              <Select value={a.kind} onValueChange={(v) => set(a.id, { kind: v as Activity["kind"] })}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entreno">Entreno</SelectItem>
                  <SelectItem value="ingles">Inglés</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" aria-label="Eliminar actividad" onClick={() => update((d) => ({ ...d, activities: d.activities.filter((x) => x.id !== a.id) }))}>
                <Trash2 className="size-4" />
              </Button>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <DayPicker value={a.days} onChange={(days) => set(a.id, { days })} />
              <div className="flex items-end gap-2">
                <Input aria-label="Inicio" type="time" className="w-28" value={a.start} onChange={(e) => e.target.value && set(a.id, { start: e.target.value })} />
                <Input aria-label="Fin" type="time" className="w-28" value={a.end} onChange={(e) => e.target.value && set(a.id, { end: e.target.value })} />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs text-muted-foreground">Margen (min)</Label>
                <Input type="number" min={0} max={120} className="w-20" value={a.buffer} onChange={(e) => set(a.id, { buffer: Math.max(0, Math.min(120, Number(e.target.value) || 0)) })} />
              </div>
            </div>
            {bad && <p className="text-xs text-destructive">La hora de fin debe ser posterior al inicio.</p>}
          </div>
        );
      })}
      <Button
        variant="outline"
        className="justify-self-start"
        onClick={() => update((d) => ({ ...d, activities: [...d.activities, { id: uid(), name: "Nueva actividad", kind: "otro", days: [], start: "17:00", end: "18:00", buffer: 10 }] }))}
      >
        <Plus className="size-4" /> Añadir actividad
      </Button>
    </div>
  );
}

export function AvailabilityEditor() {
  const data = useNexo();
  const set = (k: string, patch: Partial<NexoData["study"]["availability"][string]>) =>
    update((d) => ({ ...d, study: { ...d.study, availability: { ...d.study.availability, [k]: { enabled: false, start: "16:00", end: "20:00", ...d.study.availability[k], ...patch } } } }));
  return (
    <div className="grid gap-2">
      {[1, 2, 3, 4, 5, 6, 7].map((n) => {
        const k = String(n);
        const a = data.study.availability[k] ?? { enabled: false, start: "16:00", end: "19:00" };
        return (
          <div key={k} className="flex flex-wrap items-center gap-3">
            <Switch checked={a.enabled} onCheckedChange={(c) => set(k, { ...a, enabled: c })} aria-label={`Estudiar el ${DAY_NAMES[n]}`} />
            <span className="w-24 text-sm">{DAY_NAMES[n]}</span>
            <Input type="time" aria-label="Desde" className="w-28" disabled={!a.enabled} value={a.start} onChange={(e) => e.target.value && set(k, { ...a, start: e.target.value })} />
            <span className="text-muted-foreground">–</span>
            <Input type="time" aria-label="Hasta" className="w-28" disabled={!a.enabled} value={a.end} onChange={(e) => e.target.value && set(k, { ...a, end: e.target.value })} />
          </div>
        );
      })}
      <div className="mt-3 flex flex-wrap gap-4">
        <div className="grid gap-1">
          <Label className="text-xs text-muted-foreground">Bloque máx. (min)</Label>
          <Input type="number" min={10} max={120} className="w-24" value={data.study.blockMinutes}
            onChange={(e) => update((d) => ({ ...d, study: { ...d.study, blockMinutes: Math.max(10, Math.min(120, Number(e.target.value) || 30)) } }))} />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs text-muted-foreground">Descanso (min)</Label>
          <Input type="number" min={0} max={60} className="w-24" value={data.study.breakMinutes}
            onChange={(e) => update((d) => ({ ...d, study: { ...d.study, breakMinutes: Math.max(0, Math.min(60, Number(e.target.value) || 0)) } }))} />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs text-muted-foreground">Tareas con entrega en (días)</Label>
          <Input type="number" min={0} max={7} className="w-24" value={data.study.taskLookaheadDays}
            onChange={(e) => update((d) => ({ ...d, study: { ...d.study, taskLookaheadDays: Math.max(0, Math.min(7, Number(e.target.value) || 0)) } }))} />
        </div>
      </div>
    </div>
  );
}

export function PrioritiesEditor() {
  const data = useNexo();
  const set = (sid: string, patch: Partial<SubjectPriority>) =>
    update((d) => ({ ...d, study: { ...d.study, priorities: d.study.priorities.map((p) => (p.subjectId === sid ? { ...p, ...patch } : p)) } }));
  const missing = data.subjects.filter((s) => !data.study.priorities.some((p) => p.subjectId === s.id));
  const list = [...data.study.priorities].filter((p) => data.subjects.some((s) => s.id === p.subjectId)).sort((a, b) => b.weight - a.weight);
  return (
    <div className="grid gap-2">
      {list.map((p) => {
        const s = data.subjects.find((x) => x.id === p.subjectId)!;
        return (
          <div key={p.subjectId} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
            <div className="flex items-center gap-2">
              <Switch checked={p.enabled} onCheckedChange={(c) => set(p.subjectId, { enabled: c })} aria-label={`Incluir ${s.name}`} />
              <SubjectDot data={data} id={s.id} />
              <span className="text-sm font-medium">{s.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Prioridad</Label>
              <Select value={String(p.weight)} onValueChange={(v) => set(p.subjectId, { weight: Number(v) })}>
                <SelectTrigger className="w-16"><SelectValue /></SelectTrigger>
                <SelectContent>{[5, 4, 3, 2, 1].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
              </Select>
              <Input type="number" min={0} max={240} step={5} className="w-20" aria-label="Minutos por día" value={p.minutes}
                onChange={(e) => set(p.subjectId, { minutes: Math.max(0, Math.min(240, Number(e.target.value) || 0)) })} />
              <span className="text-xs text-muted-foreground">min</span>
            </div>
            <div className="grid gap-1">
              <DayPicker value={p.days} onChange={(days) => set(p.subjectId, { days })} days={[1, 2, 3, 4, 5, 6, 7]} />
              <span className="text-[11px] text-muted-foreground">{p.days.length ? "Solo estos días" : "Todos los días disponibles"}</span>
            </div>
          </div>
        );
      })}
      {missing.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {missing.map((s) => (
            <Button key={s.id} size="sm" variant="outline"
              onClick={() => update((d) => ({ ...d, study: { ...d.study, priorities: [...d.study.priorities, { subjectId: s.id, weight: 3, minutes: 20, days: [], enabled: true }] } }))}>
              <Plus className="size-3" /> {s.name}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
