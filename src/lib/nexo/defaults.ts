import type { NexoData, Period, Subject } from "./types";

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

const SUBJECTS: Array<[string, string, Subject["color"]]> = [
  ["mat", "Matemáticas B", "azul"],
  ["fyq", "Física y Química", "indigo"],
  ["ing", "Inglés", "teal"],
  ["len", "Lengua Castellana", "coral"],
  ["geo", "Geografía e Historia", "ambar"],
  ["bio", "Biología y Geología", "verde"],
  ["tec", "Tecnología", "grafito"],
  ["mus", "Música", "rosa"],
  ["edf", "Educación Física", "verde"],
];

function defaultDay(): Period[] {
  const slots: Array<[string, string, "clase" | "recreo"]> = [
    ["08:15", "09:10", "clase"],
    ["09:10", "10:05", "clase"],
    ["10:05", "11:00", "clase"],
    ["11:00", "11:30", "recreo"],
    ["11:30", "12:25", "clase"],
    ["12:25", "13:20", "clase"],
    ["13:20", "14:15", "clase"],
  ];
  return slots.map(([start, end, kind]) => ({
    id: uid(),
    kind,
    start,
    end,
    subjectId: null,
    room: "",
    teacher: "",
  }));
}

export function createDefaults(): NexoData {
  const avail = (start: string, end: string, enabled = true) => ({ enabled, start, end });
  return {
    version: 1,
    settings: {
      name: "",
      schoolStart: "08:15",
      schoolEnd: "14:15",
      theme: "light",
      language: "es",
      onboarded: false,
    },
    subjects: SUBJECTS.map(([id, name, color]) => ({ id, name, color })),
    timetable: { "1": defaultDay(), "2": defaultDay(), "3": defaultDay(), "4": defaultDay(), "5": defaultDay() },
    tasks: [],
    exams: [],
    activities: [
      { id: uid(), name: "Baloncesto", kind: "entreno", days: [1, 4], start: "19:00", end: "20:30", buffer: 20 },
      { id: uid(), name: "Baloncesto", kind: "entreno", days: [2], start: "17:30", end: "19:00", buffer: 20 },
      { id: uid(), name: "Inglés B1", kind: "ingles", days: [3], start: "16:00", end: "17:30", buffer: 15 },
    ],
    study: {
      blockMinutes: 30,
      breakMinutes: 5,
      taskLookaheadDays: 2,
      availability: {
        "1": avail("15:40", "21:00"),
        "2": avail("15:40", "21:00"),
        "3": avail("15:40", "21:00"),
        "4": avail("15:40", "21:00"),
        "5": avail("15:40", "19:00"),
        "6": avail("10:30", "12:30", false),
        "7": avail("17:00", "19:00", false),
      },
      priorities: [
        { subjectId: "fyq", weight: 5, minutes: 40, days: [], enabled: true },
        { subjectId: "ing", weight: 5, minutes: 30, days: [], enabled: true },
        { subjectId: "len", weight: 4, minutes: 25, days: [], enabled: true },
        { subjectId: "geo", weight: 4, minutes: 25, days: [], enabled: true },
        { subjectId: "bio", weight: 3, minutes: 20, days: [], enabled: true },
        { subjectId: "mat", weight: 2, minutes: 10, days: [], enabled: true },
        { subjectId: "tec", weight: 1, minutes: 20, days: [1, 2], enabled: true },
        { subjectId: "mus", weight: 1, minutes: 15, days: [1, 2], enabled: true },
      ],
    },
    goals: [],
    routines: [
      { id: uid(), title: "SPARIUM", note: "Abrir la app y completar la sesión del día", days: [1, 2, 3, 4, 5, 6, 7], optional: false, log: [] },
      { id: uid(), title: "Estiramientos de rodilla", note: "Solo si no duele", days: [1, 2, 3, 4, 5, 6, 7], optional: true, log: [] },
    ],
    notes: [],
  };
}
