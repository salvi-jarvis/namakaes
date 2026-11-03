import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Section } from "@/components/nexo/AppShell";
import { ClassroomSection } from "@/components/nexo/ClassroomSection";
import { ActivitiesEditor, AvailabilityEditor } from "@/components/nexo/StudyEditors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { getData, parseData, resetData, setData, update, useNexo } from "@/lib/nexo/store";
import { uid } from "@/lib/nexo/defaults";
import { COLOR_CLASSES } from "@/lib/nexo/colors";
import { COLOR_KEYS, type ColorKey } from "@/lib/nexo/types";

export const Route = createFileRoute("/ajustes")({
  head: () => ({ meta: [{ title: "Ajustes — NEXO" }, { name: "description", content: "Preferencias, asignaturas y copia de seguridad." }, { property: "og:title", content: "Ajustes — NEXO" }, { property: "og:description", content: "Preferencias, asignaturas y copia de seguridad." }] }),
  component: Ajustes,
});

function Ajustes() {
  const data = useNexo();
  const file = useRef<HTMLInputElement>(null);
  const [newSub, setNewSub] = useState("");
  const s = data.settings;
  const setS = (p: Partial<typeof s>) => update((d) => ({ ...d, settings: { ...d.settings, ...p } }));

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(getData(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `nexo-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const importJson = async (f: File) => {
    try {
      const { data: d, repaired } = parseData(JSON.parse(await f.text()));
      setData({ ...d, settings: { ...d.settings, onboarded: true } });
      toast.success(repaired ? "Importado. Algunas secciones no válidas se restauraron por defecto." : "Datos importados");
    } catch {
      toast.error("El archivo no es un JSON válido.");
    }
  };

  return (
    <>
      <PageHeader title="Ajustes" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="General">
          <div className="grid gap-4">
            <div className="grid gap-1.5"><Label htmlFor="s-name">Nombre</Label><Input id="s-name" value={s.name} onChange={(e) => setS({ name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5"><Label htmlFor="s-in">Entrada</Label><Input id="s-in" type="time" value={s.schoolStart} onChange={(e) => e.target.value && setS({ schoolStart: e.target.value })} /></div>
              <div className="grid gap-1.5"><Label htmlFor="s-out">Salida</Label><Input id="s-out" type="time" value={s.schoolEnd} onChange={(e) => e.target.value && setS({ schoolEnd: e.target.value })} /></div>
            </div>
            <div className="grid gap-1.5"><Label>Idioma</Label>
              <Select value="es"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="es">Español</SelectItem></SelectContent></Select>
              <p className="text-xs text-muted-foreground">Por ahora solo está disponible en español.</p>
            </div>
            <label className="flex items-center justify-between text-sm">Tema oscuro<Switch checked={s.theme === "dark"} onCheckedChange={(c) => setS({ theme: c ? "dark" : "light" })} /></label>
          </div>
        </Section>
        <Section title="Asignaturas">
          <ul className="grid gap-2">
            {data.subjects.map((x) => (
              <li key={x.id} className="flex gap-2">
                <Select value={x.color} onValueChange={(v) => update((d) => ({ ...d, subjects: d.subjects.map((y) => y.id === x.id ? { ...y, color: v as ColorKey } : y) }))}>
                  <SelectTrigger className="w-16" aria-label="Color"><span className={`size-3 rounded-full ${COLOR_CLASSES[x.color].dot}`} /></SelectTrigger>
                  <SelectContent>{COLOR_KEYS.map((c) => <SelectItem key={c} value={c}><span className="flex items-center gap-2"><span className={`size-3 rounded-full ${COLOR_CLASSES[c].dot}`} />{COLOR_CLASSES[c].label}</span></SelectItem>)}</SelectContent>
                </Select>
                <Input value={x.name} aria-label="Nombre" onChange={(e) => e.target.value.trim() && update((d) => ({ ...d, subjects: d.subjects.map((y) => y.id === x.id ? { ...y, name: e.target.value } : y) }))} />
                <Button variant="ghost" size="icon" aria-label="Eliminar" onClick={() => confirm(`¿Eliminar ${x.name}?`) && update((d) => ({ ...d, subjects: d.subjects.filter((y) => y.id !== x.id), study: { ...d.study, priorities: d.study.priorities.filter((p) => p.subjectId !== x.id) } }))}><Trash2 className="size-4" /></Button>
              </li>
            ))}
          </ul>
          <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!newSub.trim()) return; update((d) => ({ ...d, subjects: [...d.subjects, { id: uid(), name: newSub.trim(), color: "azul" }] })); setNewSub(""); }}>
            <Input value={newSub} onChange={(e) => setNewSub(e.target.value)} placeholder="Nueva asignatura" /><Button type="submit"><Plus className="size-4" /></Button>
          </form>
        </Section>
        <Section title="Entrenos y actividades"><ActivitiesEditor /></Section>
        <Section title="Preferencias de estudio"><AvailabilityEditor /></Section>
        <Section title="Google Classroom" className="lg:col-span-2"><ClassroomSection /></Section>
        <Section title="Datos" className="lg:col-span-2">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportJson}>Exportar JSON</Button>
            <Button variant="outline" onClick={() => file.current?.click()}>Importar JSON</Button>
            <input ref={file} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = ""; }} />
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="destructive">Restablecer datos</Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>¿Borrar todo?</AlertDialogTitle><AlertDialogDescription>Se eliminarán tareas, horario y ajustes de este navegador. Exporta antes si quieres conservarlos.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => { resetData(); toast.success("Datos restablecidos"); }}>Borrar</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </Section>
      </div>
    </>
  );
}
