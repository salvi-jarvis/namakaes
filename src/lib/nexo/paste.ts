/** Extract a title (first meaningful line) and an explicit date from pasted text. Never invents a date. */
export function parsePasted(text: string): { title: string; date: string | null } {
  const lines = text.split(/\r?\n/).map((l) => l.replace(/^[#>*\-\d.)\s]+/, "").replace(/\*\*/g, "").trim()).filter(Boolean);
  const title = (lines[0] ?? "").slice(0, 120);
  let date: string | null = null;
  const iso = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  const es = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  if (iso) date = `${iso[1]}-${iso[2]}-${iso[3]}`;
  else if (es) date = `${es[3]}-${es[2]!.padStart(2, "0")}-${es[1]!.padStart(2, "0")}`;
  if (date && Number.isNaN(new Date(date + "T00:00:00").getTime())) date = null;
  return { title, date };
}
