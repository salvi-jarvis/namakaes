import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubjectSelect } from "./bits";
import { update, useNexo } from "@/lib/nexo/store";
import { uid } from "@/lib/nexo/defaults";
import { madridNow } from "@/lib/nexo/time";
import type { Task } from "@/lib/nexo/types";

type Draft = Omit<Task, "id" | "createdAt" | "completedAt">;

export function TaskDialog({ open, onOpenChange, task }: { open: boolean; onOpenChange: (o: boolean) => void; task?: Task | null }) {
  const data = useNexo();
  const blank = (): Draft => ({ title: "", subjectId: null, due: madridNow().date, minutes: 30, priority: "media", status: "pendiente", notes: "" });
  const [d, setD] = useState<Draft>(blank);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open) {
      setD(task ? { ...task } : blank());
      setErr("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task]);

  const save = () => {
    if (!d.title.trim()) return setErr("Escribe un título.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.due)) return setErr("Elige una fecha de entrega válida.");
    const minutes = Math.max(0, Math.min(1440, Math.round(Number(d.minutes) || 0)));
    update((s) => {
      if (task) {
        return {
          ...s,
          tasks: s.tasks.map((t) =>
            t.id === task.id
              ? { ...t, ...d, title: d.title.trim(), minutes, completedAt: d.status === "hecha" ? t.completedAt ?? new Date().toISOString() : null }
              : t,
          ),
        };
      }
      const nt: Task = {
        ...d,
        title: d.title.trim(),
        minutes,
        id: uid(),
        createdAt: new Date().toISOString(),
        completedAt: d.status === "hecha" ? new Date().toISOString() : null,
      };
      return { ...s, tasks: [...s.tasks, nt] };
    });
    toast.success(task ? "Tarea actualizada" : "Tarea creada");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? "Editar tarea" : "Nueva tarea"}</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="t-title">Título</Label>
            <Input id="t-title" autoFocus value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} placeholder="Ej.: Ejercicios página 54" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="t-sub">Asignatura</Label>
              <SubjectSelect id="t-sub" data={data} value={d.subjectId} onChange={(v) => setD({ ...d, subjectId: v })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="t-due">Entrega</Label>
              <Input id="t-due" type="date" value={d.due} onChange={(e) => setD({ ...d, due: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="t-min">Minutos estimados</Label>
              <Input id="t-min" type="number" min={0} max={1440} step={5} value={d.minutes} onChange={(e) => setD({ ...d, minutes: Number(e.target.value) })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Prioridad</Label>
              <Select value={d.priority} onValueChange={(v) => setD({ ...d, priority: v as Task["priority"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label>Estado</Label>
              <Select value={d.status} onValueChange={(v) => setD({ ...d, status: v as Task["status"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="en_curso">En curso</SelectItem>
                  <SelectItem value="hecha">Hecha</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="t-notes">Notas</Label>
            <Textarea id="t-notes" rows={3} value={d.notes} onChange={(e) => setD({ ...d, notes: e.target.value })} />
          </div>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
