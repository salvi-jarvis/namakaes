import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { getData, update } from "@/lib/nexo/store";
import { COLOR_CLASSES } from "@/lib/nexo/colors";
import { cn } from "@/lib/utils";

export function Onboarding() {
  const init = getData();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(init.settings.name);
  const [schoolStart, setSchoolStart] = useState(init.settings.schoolStart);
  const [studyStart, setStudyStart] = useState(init.study.availability["1"]?.start ?? "15:40");
  const [keep, setKeep] = useState<string[]>(init.subjects.map((s) => s.id));

  const finish = (apply: boolean) =>
    update((d) => {
      if (!apply) return { ...d, settings: { ...d.settings, onboarded: true } };
      const availability = { ...d.study.availability };
      for (const k of ["1", "2", "3", "4", "5"]) availability[k] = { enabled: true, end: "20:00", ...availability[k], start: studyStart };
      return {
        ...d,
        settings: { ...d.settings, name: name.trim(), schoolStart, onboarded: true },
        subjects: d.subjects.filter((s) => keep.includes(s.id)),
        study: { ...d.study, availability, priorities: d.study.priorities.filter((p) => keep.includes(p.subjectId)) },
      };
    });

  return (
    <Dialog open onOpenChange={(o) => !o && finish(false)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{["Bienvenido a NEXO", "Tu horario", "Tus asignaturas"][step]}</DialogTitle>
          <DialogDescription>
            {[
              "Un planificador escolar que funciona en tu navegador. Sin cuenta ni pagos.",
              "Valores iniciales editables. Podrás cambiarlos en cualquier momento.",
              "Desmarca las que no tengas. Luego podrás añadir o renombrar.",
            ][step]}
          </DialogDescription>
        </DialogHeader>

        {step === 0 && (
          <div className="grid gap-1.5">
            <Label htmlFor="ob-name">¿Cómo te llamas? (opcional)</Label>
            <Input id="ob-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        )}
        {step === 1 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="ob-school">Entrada al instituto</Label>
              <Input id="ob-school" type="time" value={schoolStart} onChange={(e) => setSchoolStart(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ob-study">Inicio de estudio</Label>
              <Input id="ob-study" type="time" value={studyStart} onChange={(e) => setStudyStart(e.target.value)} />
            </div>
            <p className="col-span-2 text-xs text-muted-foreground">
              Incluye por defecto baloncesto (L y J 19:00–20:30, M 17:30–19:00) e Inglés B1 (X 16:00–17:30). Edítalo en Plan de estudio.
            </p>
          </div>
        )}
        {step === 2 && (
          <div className="grid max-h-64 gap-2 overflow-y-auto">
            {init.subjects.map((s) => (
              <label key={s.id} className="flex items-center gap-3 text-sm">
                <Checkbox
                  checked={keep.includes(s.id)}
                  onCheckedChange={(c) => setKeep(c ? [...keep, s.id] : keep.filter((x) => x !== s.id))}
                />
                <span className={cn("size-2 rounded-full", COLOR_CLASSES[s.color].dot)} />
                {s.name}
              </label>
            ))}
          </div>
        )}

        <div className="mt-2 flex items-center justify-between">
          <Button variant="ghost" onClick={() => finish(false)}>Omitir</Button>
          <div className="flex gap-2">
            {step > 0 && <Button variant="outline" onClick={() => setStep(step - 1)}>Atrás</Button>}
            {step < 2 ? <Button onClick={() => setStep(step + 1)}>Siguiente</Button> : <Button onClick={() => finish(true)}>Empezar</Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
