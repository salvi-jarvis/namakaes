import { z } from "zod";

export const COLOR_KEYS = ["azul", "indigo", "teal", "verde", "ambar", "coral", "rosa", "grafito"] as const;
export type ColorKey = (typeof COLOR_KEYS)[number];

const hhmm = z.string().regex(/^\d{2}:\d{2}$/);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const SubjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  color: z.enum(COLOR_KEYS),
});
export const PeriodSchema = z.object({
  id: z.string(),
  kind: z.enum(["clase", "recreo"]),
  start: hhmm,
  end: hhmm,
  subjectId: z.string().nullable(),
  room: z.string().optional().default(""),
  teacher: z.string().optional().default(""),
});
export const TimetableSchema = z.object({
  "1": z.array(PeriodSchema),
  "2": z.array(PeriodSchema),
  "3": z.array(PeriodSchema),
  "4": z.array(PeriodSchema),
  "5": z.array(PeriodSchema),
});
export const TaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  subjectId: z.string().nullable(),
  due: isoDate,
  minutes: z.number().int().min(0).max(1440),
  priority: z.enum(["alta", "media", "baja"]),
  status: z.enum(["pendiente", "en_curso", "hecha"]),
  notes: z.string().default(""),
  createdAt: z.string(),
  completedAt: z.string().nullable().default(null),
  source: z.string().optional(),
});
export const NoteSchema = z.object({
  id: z.string(),
  kind: z.enum(["plan", "practica"]),
  title: z.string().min(1),
  body: z.string(),
  subjectId: z.string().nullable(),
  createdAt: z.string(),
});
export const ActivitySchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  kind: z.enum(["entreno", "ingles", "otro"]),
  days: z.array(z.number().int().min(1).max(7)),
  start: hhmm,
  end: hhmm,
  buffer: z.number().int().min(0).max(120),
});
export const PrioritySchema = z.object({
  subjectId: z.string(),
  weight: z.number().int().min(1).max(5),
  minutes: z.number().int().min(0).max(240),
  days: z.array(z.number().int().min(1).max(7)),
  enabled: z.boolean(),
});
export const StudySchema = z.object({
  blockMinutes: z.number().int().min(10).max(120),
  breakMinutes: z.number().int().min(0).max(60),
  taskLookaheadDays: z.number().int().min(0).max(7),
  availability: z.record(z.string(), z.object({ enabled: z.boolean(), start: hhmm, end: hhmm })),
  priorities: z.array(PrioritySchema),
});
export const GoalSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  target: z.number().min(1),
  progress: z.number().min(0),
  unit: z.string().default(""),
  deadline: z.string().default(""),
});
export const RoutineSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  note: z.string().default(""),
  days: z.array(z.number().int().min(1).max(7)),
  optional: z.boolean(),
  log: z.array(isoDate),
});
export const SettingsSchema = z.object({
  name: z.string().default(""),
  schoolStart: hhmm,
  schoolEnd: hhmm,
  theme: z.enum(["light", "dark"]),
  language: z.enum(["es"]),
  onboarded: z.boolean(),
});

export const ExamSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  subjectId: z.string().nullable(),
  date: isoDate,
  time: z.string().regex(/^(\d{2}:\d{2})?$/).default(""),
  duration: z.number().int().min(0).max(600).default(0),
  notes: z.string().default(""),
});

export const DataSchema = z.object({
  version: z.literal(1),
  settings: SettingsSchema,
  subjects: z.array(SubjectSchema),
  timetable: TimetableSchema,
  tasks: z.array(TaskSchema),
  activities: z.array(ActivitySchema),
  study: StudySchema,
  goals: z.array(GoalSchema),
  routines: z.array(RoutineSchema),
  notes: z.array(NoteSchema).default([]),
  exams: z.array(ExamSchema).default([]),
});

export type Subject = z.infer<typeof SubjectSchema>;
export type Period = z.infer<typeof PeriodSchema>;
export type Timetable = z.infer<typeof TimetableSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type Activity = z.infer<typeof ActivitySchema>;
export type SubjectPriority = z.infer<typeof PrioritySchema>;
export type Study = z.infer<typeof StudySchema>;
export type Goal = z.infer<typeof GoalSchema>;
export type Routine = z.infer<typeof RoutineSchema>;
export type Settings = z.infer<typeof SettingsSchema>;
export type Note = z.infer<typeof NoteSchema>;
export type Exam = z.infer<typeof ExamSchema>;
export type NexoData = z.infer<typeof DataSchema>;
export type Weekday = "1" | "2" | "3" | "4" | "5";
