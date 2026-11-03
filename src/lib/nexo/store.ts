import { useSyncExternalStore } from "react";
import { createDefaults } from "./defaults";
import { DataSchema, type NexoData } from "./types";

const KEY = "nexo:data:v1";
let state: NexoData | null = null;
const listeners = new Set<() => void>();

/** Validate unknown JSON; invalid sections fall back to defaults instead of wiping everything. */
export function parseData(raw: unknown): { data: NexoData; repaired: boolean } {
  const defaults = createDefaults();
  const full = DataSchema.safeParse(raw);
  if (full.success) return { data: full.data, repaired: false };
  if (!raw || typeof raw !== "object") return { data: defaults, repaired: true };
  const obj = raw as Record<string, unknown>;
  const shape = DataSchema.shape;
  const out: Record<string, unknown> = { version: 1 };
  for (const k of Object.keys(shape) as Array<keyof typeof shape>) {
    if (k === "version") continue;
    const r = shape[k].safeParse(obj[k]);
    out[k] = r.success ? r.data : defaults[k];
  }
  return { data: out as NexoData, repaired: true };
}

function load(): NexoData {
  if (typeof window === "undefined") return createDefaults();
  try {
    const s = window.localStorage.getItem(KEY);
    if (!s) return createDefaults();
    return parseData(JSON.parse(s)).data;
  } catch {
    return createDefaults();
  }
}

export function getData(): NexoData {
  if (!state) state = load();
  return state;
}

export function setData(next: NexoData) {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage full or blocked: keep in-memory state
  }
  listeners.forEach((l) => l());
}

export function update(fn: (d: NexoData) => NexoData) {
  setData(fn(getData()));
}

export function resetData() {
  setData(createDefaults());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

let serverSnap: NexoData | null = null;
export function useNexo(): NexoData {
  return useSyncExternalStore(subscribe, getData, () => (serverSnap ??= createDefaults()));
}
