import { COLOR_CLASSES } from "@/lib/nexo/colors";
import type { NexoData } from "@/lib/nexo/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DAY_SHORT, DAY_NAMES } from "@/lib/nexo/time";
import { cn } from "@/lib/utils";

export function SubjectDot({ data, id, className }: { data: NexoData; id: string | null; className?: string }) {
  const s = data.subjects.find((x) => x.id === id);
  return <span className={cn("inline-block size-2 shrink-0 rounded-full", s ? COLOR_CLASSES[s.color].dot : "bg-muted-foreground/40", className)} />;
}

export function SubjectTag({ data, id }: { data: NexoData; id: string | null }) {
  const s = data.subjects.find((x) => x.id === id);
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <SubjectDot data={data} id={id} />
      {s?.name ?? "Sin asignatura"}
    </span>
  );
}

export function SubjectSelect({
  data,
  value,
  onChange,
  noneLabel = "Sin asignatura",
  id,
}: {
  data: NexoData;
  value: string | null;
  onChange: (v: string | null) => void;
  noneLabel?: string;
  id?: string;
}) {
  return (
    <Select value={value ?? "__none"} onValueChange={(v) => onChange(v === "__none" ? null : v)}>
      <SelectTrigger id={id}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none">{noneLabel}</SelectItem>
        {data.subjects.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            <span className="flex items-center gap-2">
              <span className={cn("size-2 rounded-full", COLOR_CLASSES[s.color].dot)} />
              {s.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function DayPicker({ value, onChange, days = [1, 2, 3, 4, 5, 6, 7] }: { value: number[]; onChange: (v: number[]) => void; days?: number[] }) {
  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label="Días">
      {days.map((d) => {
        const on = value.includes(d);
        return (
          <button
            key={d}
            type="button"
            aria-pressed={on}
            aria-label={DAY_NAMES[d]}
            onClick={() => onChange(on ? value.filter((x) => x !== d) : [...value, d].sort())}
            className={cn(
              "size-8 rounded-full text-xs font-medium transition-colors",
              on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent",
            )}
          >
            {DAY_SHORT[d]}
          </button>
        );
      })}
    </div>
  );
}
