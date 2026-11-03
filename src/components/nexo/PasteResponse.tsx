import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubjectSelect } from "./bits";
import { update, useNexo } from "@/lib/nexo/store";
import { uid } from "@/lib/nexo/defaults";
import { copyText } from "@/lib/nexo/chatgpt";
import { parsePasted } from "@/lib/nexo/paste";

type Target = "tarea" | "plan" | "practica";
const TARGETS: Array<[Target, string]> = [["tarea", "Tarea"], ["plan", "Entrada del plan"], ["practica", "Preguntas de práctica"]];

export function PasteResponse({ defaultSubject = null, onSaved }: { defaultSubject?: string | null; onSaved?: () => void }) {
  const data = useNexo();
  const [text, setText] = useState("");
  const [target, setTarget] = useState<Target>("tarea");
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [subject, setSubject] = useState<string | null>(defaultSubject);
  const [touched, setTouched] = useState(false);
  const parsed = useMemo(() => parsePasted(text), [text]);
  const shownTitle = touched ? title : parsed.title;
  const shownDue = touched ? due : (parsed.date ?? "");

  const confirm = () => {
    const t = shownTitle.trim();
    if (!t) { toast.error("Escribe un título antes de guardar."); return; }
    const now = new Date().toISOString();
    if (target === "tarea") {
      if (!shownDue) { toast.error("Las tareas necesitan fecha de entrega. Elige una."); return; }
      update((d) => ({ ...d, tasks: [...d.tasks, { id: uid(), title: t, subjectId: subject, due: shownDue, minutes: 30, priority: "media", status: "pendiente", notes: text.trim(), createdAt: now, completedAt: null }] }));
    } else {
      update((d) => ({ ...d, notes: [{ id: uid(), kind: target, title: t, body: text.trim(), subjectId: subject, createdAt: now }, ...d.notes] }));
    }
    toast.success(target === "tarea" ? "Tarea guardada" : "Guardado en Plan de estudio › Notas guardadas");
    setText(""); setTitle(""); setDue(""); setTouched(false);
    onSaved?.();
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="paste-text">Respuesta de ChatGPT</Label>
        <Textarea id="paste-text" rows={7} value={text} onChange={(e) => setText(e.target.value)} placeholder="Pega aquí la respuesta…" />
      </div>
      {text.trim() && !parsed.title && (
        <div className="rounded-md border border-dashed p-3 text-sm">
          <p className="mb-2 text-muted-foreground">No se ha podido interpretar el texto. Aquí lo tienes tal cual:</p>
          <pre className="max-h-40 overflow-auto whitespace-pre-wrap text-xs">{text}</pre>
          <Button size="sm" variant="outline" className="mt-2" onClick={async () => toast.success((await copyText(text)) ? "Texto copiado" : "No se pudo copiar")}><Copy className="size-4" /> Copiar</Button>
        </div>
      )}
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-medium">Guardar como</legend>
        <div className="flex flex-wrap gap-2">
          {TARGETS.map(([k, l]) => (
            <Button key={k} type="button" size="sm" variant={target === k ? "default" : "outline"} onClick={() => setTarget(k)}>{l}</Button>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="paste-title">Título</Label>
          <Input id="paste-title" value={shownTitle} onChange={(e) => { setTitle(e.target.value); if (!touched) setDue(shownDue); setTouched(true); }} />
        </div>
        <div className="grid gap-1.5">
          <Label>Asignatura</Label>
          <SubjectSelect data={data} value={subject} onChange={setSubject} noneLabel="General" />
        </div>
        {target === "tarea" && (
          <div className="grid gap-1.5">
            <Label htmlFor="paste-due">Fecha de entrega</Label>
            <Input id="paste-due" type="date" value={shownDue} onChange={(e) => { setDue(e.target.value); if (!touched) setTitle(shownTitle); setTouched(true); }} />
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">No se guarda nada hasta que pulses «Confirmar y guardar». Revisa la fecha: solo se rellena si aparece en el texto.</p>
      <Button onClick={confirm} disabled={!text.trim()}>Confirmar y guardar</Button>
    </div>
  );
}
