# Nexo Study Compass

Build a polished, responsive Spanish-language personal school planner web app called "NEXO" (working name), designed for a Spanish ESO student. It must be genuinely usable, not just a landing page. Priorities: functionality, clarity, speed, mobile + desktop, no paid APIs and no subscriptions required for core features.

CORE PRODUCT:
1) Dashboard "Hoy": current date, next class/task, agenda timeline, quick-add task, today's priorities, training/English lesson blocks, progress summary. Use Europe/Madrid timezone.
2) Editable weekly school timetable: Monday-Friday, 6 class periods/day, editable subjects, start/end times, breaks, room/teacher optional, color categories. Allow add/edit/delete/reorder periods and copy a day. Persist locally in browser so it works without account/backend.
3) Tasks/homework: create task with title, subject, due date, estimated minutes, priority, status, notes. Mark complete, edit, delete, filter. Crucial rule: NEVER automatically carry an incomplete task to another day. Only show it as overdue/incomplete until the user explicitly reschedules it.
4) Study planner: weekly afternoon blocks, configurable availability, recurring subject priorities, adjustable duration, conflict-aware suggestions. Initial defaults based on profile: school starts 08:15, study starts 15:40; basketball Mon/Thu 19:00-20:30 and Tue 17:30-19:00; English B1 Wed 16:00-17:30. Mathematics B gets only 10 minutes/day by default because it is a strong subject; prioritize Physics/Chemistry and English, then Spanish Language and Geography/History; Technology lower priority; Music and Technology may be grouped Monday/Tuesday. All schedules and priorities editable. Do not invent homework or exams.
5) Goals & routines: configurable goals, recurring routines, streak/progress display. Include SPARIUM as a daily app reminder/routine. Include knee stretches only as an optional user-controlled routine and display "solo si no duele"; do not make medical claims.
6) AI / ChatGPT connection: no paid API, no fabricated direct ChatGPT API integration. Provide an "Ask ChatGPT" action on tasks/planner that composes a useful prompt from selected, non-sensitive schedule/task data and opens ChatGPT in a new tab if possible, plus a copy-prompt fallback. Make it clear user chooses what to share. Include buttons for: optimize today's study plan, explain a topic, create practice questions, plan the week. If opening external URLs isn't supported, copy prompt to clipboard. No API keys.
7) Settings: edit school hours, subjects, training, study preferences, language (Spanish default), export/import data as JSON, reset data with confirmation, light/dark theme.
8) First-run onboarding with defaults and ability to edit/skip; do not ask for account/payment. Store all primary data in localStorage, with robust validation and sensible empty states. Ensure reload persistence.
9) Responsive sidebar/nav on desktop and bottom nav on mobile. Pages: Hoy, Horario, Tareas, Plan de estudio, Objetivos, Ajustes.
10) Visual design: minimal, premium, calm, Apple-inspired, light neutral background, dark graphite text, restrained blue/indigo accent, clear typography, compact cards, excellent spacing, accessible contrast, polished interactions. No emoji-heavy UI. Spanish labels and realistic example data only where clearly marked as editable defaults.
TECHNICAL:
Use the default Lovable stack, TypeScript, Tailwind, shadcn/ui. Implement functioning CRUD, localStorage persistence, responsive UI and sensible error handling. Avoid requiring Supabase, authentication, paid integrations or external APIs for core functionality. Do not claim unimplemented features. Build the actual app and then check main flows for bugs.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1b653561-ecd5-4fad-9af5-454d9787cdc0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
