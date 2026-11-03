import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { update, useNexo } from "@/lib/nexo/store";
import { uid } from "@/lib/nexo/defaults";
import { formatShort } from "@/lib/nexo/time";
import { clearToken, connect, fetchWork, getClientId, getToken, setClientId, type GcWork } from "@/lib/nexo/classroom";

export function ClassroomSection() {
  const data = useNexo();
  const [cid, setCid] = useState("");
  const [saved, setSaved] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [list, setList] = useState<{ courses: number; work: GcWork[] } | null>(null);
  const [sel, setSel] = useState<Set<string>>(new Set());

  useEffect(() => {
    const c = getClientId();
    setCid(c); setSaved(c); setToken(getToken());
  }, []);

  const imported = new Set(data.tasks.map((t) => t.source).filter(Boolean));

  const load = async (t: string) => {
    setBusy(true); setError(""); setList(null); setSel(new Set());
    try {
      const r = await fetchWork(t);
      setList(r); setSel(new Set());
    } catch (e) {
      setError((e as Error).message);
      if (!getToken()) setToken(null);
    } finally { setBusy(false); }
  };
  const doConnect = async () => {
    setBusy(true); setError("");
    try {
      const t = await connect(saved);
      setToken(t);
      await load(t);
    } catch (e) { setError((e as Error).message); setBusy(false); }
  };
  const disconnect = () => { clearToken(); setToken(null); setList(null); setSel(new Set()); toast.success("Desconectado de Google Classroom"); };
  const doImport = () => {
    const items = list?.work.filter((w) => sel.has(w.key) && !imported.has(w.key)) ?? [];
    if (!items.length) return;
    const now = new Date().toISOString();
    update((d) => ({
      ...d,
      tasks: [...d.tasks, ...items.map((w) => ({
        id: uid(), title: w.title, subjectId: null, due: w.due, minutes: 30, priority: "media" as const, status: "pendiente" as const,
        notes: `Importada de Google Classroom (${w.courseName})${w.link ? `\n${w.link}` : ""}`, createdAt: now, completedAt: null, source: w.key,
      }))],
    }));
    setSel(new Set());
    toast.success(`${items.length} tarea(s) importada(s)`);
  };

  return (
    <div className="grid gap-4 text-sm">
      <p className="text-muted-foreground">Complemento opcional. Necesitas tu propio ID de cliente OAuth de Google (tipo «Aplicación web», con este sitio como origen autorizado y la API de Classroom activada). Solo lectura de cursos y tareas.</p>
      <form className="grid gap-1.5" onSubmit={(e) => { e.preventDefault(); const v = cid.trim(); setClientId(v); setSaved(v); if (!v) disconnect(); toast.success(v ? "ID de cliente guardado" : "ID de cliente eliminado"); }}>
        <Label htmlFor="gc-cid">ID de cliente OAuth</Label>
        <div className="flex gap-2">
          <Input id="gc-cid" value={cid} onChange={(e) => setCid(e.target.value)} placeholder="xxxx.apps.googleusercontent.com" />
          <Button type="submit" variant="outline">Guardar</Button>
        </div>
      </form>
      <p>Estado: <span className="font-medium">{!saved ? "No configurado" : token ? "Conectado" : "Configurado, sin conectar"}</span></p>
      {saved && (
        <div className="flex flex-wrap gap-2">
          {!token ? <Button onClick={doConnect} disabled={busy}>{busy ? "Conectando…" : "Conectar"}</Button> : (
            <>
              <Button variant="outline" onClick={() => load(token)} disabled={busy}>{busy ? "Cargando…" : "Ver tareas de Classroom"}</Button>
              <Button variant="ghost" onClick={disconnect}>Desconectar</Button>
            </>
          )}
        </div>
      )}
      {error && <p role="alert" className="text-destructive">{error}</p>}
      {list && (
        list.work.length === 0 ? <p className="text-muted-foreground">{list.courses} curso(s) encontrados, sin tareas con fecha de entrega.</p> : (
          <div className="grid gap-2">
            <ul className="grid max-h-72 gap-1 overflow-y-auto rounded-md border p-2">
              {list.work.map((w) => {
                const done = imported.has(w.key);
                return (
                  <li key={w.key}>
                    <label className={`flex items-center gap-2 ${done ? "text-muted-foreground" : ""}`}>
                      <Checkbox disabled={done} checked={done || sel.has(w.key)} onCheckedChange={(c) => { const n = new Set(sel); c ? n.add(w.key) : n.delete(w.key); setSel(n); }} />
                      <span className="min-w-0 flex-1 truncate">{w.title} <span className="text-xs text-muted-foreground">· {w.courseName}</span></span>
                      <span className="tabular shrink-0 text-xs">{done ? "Ya importada" : formatShort(w.due)}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
            <Button onClick={doImport} disabled={sel.size === 0}>Importar seleccionadas ({sel.size})</Button>
          </div>
        )
      )}
    </div>
  );
}
