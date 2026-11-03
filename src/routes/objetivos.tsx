import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { PageHeader, Section, Empty } from "@/components/nexo/AppShell";
import { DayPicker } from "@/components/nexo/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { update, useNexo } from "@/lib/nexo/store";
import { uid } from "@/lib/nexo/defaults";
import { routineStreak } from "@/lib/nexo/planner";
import { useMadridNow } from "@/lib/nexo/time";

export const Route = createFileRoute("/objetivos")({
  head: () => ({ meta: [{ title: "Objetivos — NEXO" }, { name: "description", content: "Objetivos y rutinas con rachas." }, { property: "og:title", content: "Objetivos — NEXO" }, { property: "og:description", content: "Objetivos y rutinas con rachas." }] }),
  component: Objetivos,
});

function Objetivos() {
  const data = useNexo();
  const today = useMadridNow().date;
  const [g, setG] = useState({ title: "", target: 10, unit: "" });
  const [r, setR] = useState("");
  return (
    <>
      <PageHeader title="Objetivos y rutinas" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Rutinas">
          <ul className="grid gap-3">
            {data.routines.map((x) => (
              <li key={x.id} className="grid gap-2 rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <Checkbox checked={x.log.includes(today)} aria-label="Hecho hoy" onCheckedChange={(c) => update((d) => ({ ...d, routines: d.routines.map((y) => y.id === x.id ? { ...y, log: c ? [...y.log, today] : y.log.filter((z) => z !== today) } : y) }))} />
                  <span className="flex-1 text-sm font-medium">{x.title}{x.optional && <span className="ml-2 text-xs font-normal text-muted-foreground">opcional</span>}</span>
                  <span className="tabular text-xs text-muted-foreground">Racha: {routineStreak(x.log, x.days, today)}</span>
                  <Button variant="ghost" size="icon" aria-label="Eliminar" onClick={() => update((d) => ({ ...d, routines: d.routines.filter((y) => y.id !== x.id) }))}><Trash2 className="size-4" /></Button>
                </div>
                {x.note && <p className="text-xs text-muted-foreground">{x.note}</p>}
                <DayPicker value={x.days} onChange={(days) => update((d) => ({ ...d, routines: d.routines.map((y) => y.id === x.id ? { ...y, days } : y) }))} />
              </li>
            ))}
          </ul>
          <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!r.trim()) return; update((d) => ({ ...d, routines: [...d.routines, { id: uid(), title: r.trim(), note: "", days: [1, 2, 3, 4, 5, 6, 7], optional: false, log: [] }] })); setR(""); }}>
            <Input value={r} onChange={(e) => setR(e.target.value)} placeholder="Nueva rutina" /><Button type="submit"><Plus className="size-4" /></Button>
          </form>
        </Section>
        <Section title="Objetivos">
          {data.goals.length === 0 && <Empty>Aún no tienes objetivos.</Empty>}
          <ul className="grid gap-3">
            {data.goals.map((x) => (
              <li key={x.id} className="grid gap-2 rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-sm font-medium">{x.title}</span>
                  <span className="tabular text-xs text-muted-foreground">{x.progress}/{x.target} {x.unit}</span>
                  <Button variant="ghost" size="icon" aria-label="Restar" onClick={() => update((d) => ({ ...d, goals: d.goals.map((y) => y.id === x.id ? { ...y, progress: Math.max(0, y.progress - 1) } : y) }))}><Minus className="size-4" /></Button>
                  <Button variant="ghost" size="icon" aria-label="Sumar" onClick={() => update((d) => ({ ...d, goals: d.goals.map((y) => y.id === x.id ? { ...y, progress: y.progress + 1 } : y) }))}><Plus className="size-4" /></Button>
                  <Button variant="ghost" size="icon" aria-label="Eliminar" onClick={() => update((d) => ({ ...d, goals: d.goals.filter((y) => y.id !== x.id) }))}><Trash2 className="size-4" /></Button>
                </div>
                <Progress value={Math.min(100, (x.progress / x.target) * 100)} />
              </li>
            ))}
          </ul>
          <form className="mt-3 grid grid-cols-[1fr_5rem_6rem_auto] gap-2" onSubmit={(e) => { e.preventDefault(); if (!g.title.trim()) return; update((d) => ({ ...d, goals: [...d.goals, { id: uid(), title: g.title.trim(), target: Math.max(1, g.target), progress: 0, unit: g.unit, deadline: "" }] })); setG({ title: "", target: 10, unit: "" }); }}>
            <Input value={g.title} onChange={(e) => setG({ ...g, title: e.target.value })} placeholder="Nuevo objetivo" />
            <Input type="number" min={1} value={g.target} aria-label="Meta" onChange={(e) => setG({ ...g, target: Number(e.target.value) || 1 })} />
            <Input value={g.unit} placeholder="unidad" onChange={(e) => setG({ ...g, unit: e.target.value })} />
            <Button type="submit"><Plus className="size-4" /></Button>
          </form>
        </Section>
      </div>
    </>
  );
}
