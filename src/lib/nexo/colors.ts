import type { ColorKey } from "./types";

// Literal class strings so Tailwind keeps them.
export const COLOR_CLASSES: Record<ColorKey, { dot: string; soft: string; bar: string; label: string }> = {
  azul: { dot: "bg-cat-azul", soft: "bg-cat-azul/12", bar: "border-l-cat-azul", label: "Azul" },
  indigo: { dot: "bg-cat-indigo", soft: "bg-cat-indigo/12", bar: "border-l-cat-indigo", label: "Índigo" },
  teal: { dot: "bg-cat-teal", soft: "bg-cat-teal/12", bar: "border-l-cat-teal", label: "Turquesa" },
  verde: { dot: "bg-cat-verde", soft: "bg-cat-verde/12", bar: "border-l-cat-verde", label: "Verde" },
  ambar: { dot: "bg-cat-ambar", soft: "bg-cat-ambar/14", bar: "border-l-cat-ambar", label: "Ámbar" },
  coral: { dot: "bg-cat-coral", soft: "bg-cat-coral/12", bar: "border-l-cat-coral", label: "Coral" },
  rosa: { dot: "bg-cat-rosa", soft: "bg-cat-rosa/12", bar: "border-l-cat-rosa", label: "Rosa" },
  grafito: { dot: "bg-cat-grafito", soft: "bg-cat-grafito/12", bar: "border-l-cat-grafito", label: "Grafito" },
};
