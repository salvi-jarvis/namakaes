import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, ExternalLink, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubjectSelect } from "./bits";
import { PasteResponse } from "./PasteResponse";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNexo } from "@/lib/nexo/store";
import { madridNow } from "@/lib/nexo/time";
import { PROMPT_LABELS, buildPrompt, chatGptUrl, copyText, type PromptKind, type ShareOptions } from "@/lib/nexo/chatgpt";

export function AskAIDialog({
  open,
  onOpenChange,
  kind,
  initialTopic = "",
  initialSubject = null,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  kind: PromptKind;
  initialTopic?: string;
  initialSubject?: string | null;
}) {
  const data = useNexo();
  const [share, setShare] = useState<ShareOptions>({ horario: true, tareas: true, actividades: true, plan: true });
  const [topic, setTopic] = useState(initialTopic);
  const [subject, setSubject] = useState<string | null>(initialSubject);
  const [text, setText] = useState("");
  const [edited, setEdited] = useState(false);

  useEffect(() => {
    if (open) {
      setTopic(initialTopic);
      setSubject(initialSubject);
      setEdited(false);
      if (kind === "explicar" || kind === "practicar") setShare({ horario: false, tareas: false, actividades: false, plan: false });
      else setShare({ horario: true, tareas: true, actividades: true, plan: true });
    }
  }, [open, kind, initialTopic, initialSubject]);

  useEffect(() => {
    if (open && !edited) setText(buildPrompt(data, kind, share, madridNow().date, topic, subject));
  }, [open, edited, data, kind, share, topic, subject]);

  const needsTopic = kind === "explicar" || kind === "practicar";
  const opts: Array<[keyof ShareOptions, string]> = [
    ["horario", "Clases de hoy"],
    ["tareas", "Tareas pendientes (títulos, fechas)"],
    ["actividades", "Actividades fijas (entrenos, inglés)"],
    ["plan", "Plan sugerido y prioridades"],
  ];

  const open_ = async () => {
    await copyText(text);
    const w = window.open(chatGptUrl(text), "_blank", "noopener,noreferrer");
    toast.success(w ? "Prompt copiado. Se abrió ChatGPT en otra pestaña." : "No se pudo abrir la pestaña. El prompt está copiado: pégalo en ChatGPT.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Sparkles className="size-4 text-primary" />{PROMPT_LABELS[kind]}</DialogTitle>
          <DialogDescription>
            NEXO no envía nada por su cuenta. Tú eliges qué datos incluir; el texto se abre en ChatGPT (tu propia cuenta) o se copia al portapapeles.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="prompt">
        <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="prompt">Crear prompt</TabsTrigger><TabsTrigger value="pegar">Pegar respuesta de ChatGPT</TabsTrigger></TabsList>
        <TabsContent value="prompt" className="grid gap-4">
        <div className="grid gap-4">
          {needsTopic && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>Asignatura</Label>
                <SubjectSelect data={data} value={subject} onChange={(v) => { setSubject(v); setEdited(false); }} noneLabel="General" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ai-topic">Tema</Label>
                <Input id="ai-topic" value={topic} onChange={(e) => { setTopic(e.target.value); setEdited(false); }} placeholder="Ej.: Leyes de Newton" />
              </div>
            </div>
          )}
          <fieldset className="grid gap-2">
            <legend className="mb-1 text-sm font-medium">Datos a compartir</legend>
            {opts.map(([k, l]) => (
              <label key={k} className="flex items-center gap-2 text-sm">
                <Checkbox checked={share[k]} onCheckedChange={(c) => { setShare({ ...share, [k]: !!c }); setEdited(false); }} />
                {l}
              </label>
            ))}
            <p className="text-xs text-muted-foreground">Nunca se incluyen tu nombre ni tus notas privadas.</p>
          </fieldset>
          <div className="grid gap-1.5">
            <Label htmlFor="ai-text">Prompt (puedes editarlo)</Label>
            <Textarea id="ai-text" rows={9} className="font-mono text-xs" value={text} onChange={(e) => { setText(e.target.value); setEdited(true); }} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={async () => toast.success((await copyText(text)) ? "Prompt copiado" : "No se pudo copiar")}>
            <Copy className="size-4" /> Copiar
          </Button>
          <Button onClick={open_}>
            <ExternalLink className="size-4" /> Abrir en ChatGPT
          </Button>
        </DialogFooter>
        </TabsContent>
        <TabsContent value="pegar"><PasteResponse defaultSubject={subject} onSaved={() => onOpenChange(false)} /></TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export function AskAIButtons({ kinds = ["optimizar", "explicar", "practicar", "semana"] as PromptKind[] }) {
  const [kind, setKind] = useState<PromptKind | null>(null);
  return (
    <>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {kinds.map((k) => (
          <Button key={k} variant="outline" className="justify-start" onClick={() => setKind(k)}>
            <Sparkles className="size-4 text-primary" /> {PROMPT_LABELS[k]}
          </Button>
        ))}
      </div>
      <AskAIDialog open={!!kind} onOpenChange={(o) => !o && setKind(null)} kind={kind ?? "optimizar"} />
    </>
  );
}
