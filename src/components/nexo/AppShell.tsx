import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { CalendarDays, CheckSquare, GraduationCap, Home, Settings, Target, BookOpen } from "lucide-react";
import { useNexo } from "@/lib/nexo/store";
import { Onboarding } from "./Onboarding";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Hoy", icon: Home },
  { to: "/horario", label: "Horario", icon: CalendarDays },
  { to: "/tareas", label: "Tareas", icon: CheckSquare },
  { to: "/examenes", label: "Calendario de exámenes", short: "Exámenes", icon: GraduationCap },
  { to: "/plan", label: "Plan de estudio", short: "Plan", icon: BookOpen },
  { to: "/objetivos", label: "Objetivos", icon: Target },
  { to: "/ajustes", label: "Ajustes", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const data = useNexo();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle("dark", data.settings.theme === "dark");
  }, [mounted, data.settings.theme]);

  const isActive = (to: string) => (to === "/" ? path === "/" : path.startsWith(to));

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar px-3 py-6 md:flex">
        <div className="mb-8 px-3">
          <div className="flex items-center gap-2"><img src="/icons/icon.svg" alt="" width={28} height={28} className="size-7 rounded-md" /><div className="text-lg font-semibold tracking-tight">Nā Maka</div></div>
          <div className="mt-1 text-xs text-muted-foreground">Centro de estudios</div>
        </div>
        <nav className="flex flex-col gap-0.5" aria-label="Principal">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive(n.to)
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
              )}
            >
              <n.icon className={cn("size-4", isActive(n.to) && "text-primary")} />
              {n.label}
            </Link>
          ))}
        </nav>
        <p className="mt-auto px-3 text-xs leading-relaxed text-muted-foreground">
          Tus datos se guardan solo en este navegador.
        </p>
      </aside>

      <main className="pb-24 md:pb-10 md:pl-60">
        <div className="mx-auto w-full max-w-5xl px-4 pt-6 sm:px-6 md:pt-10">
          {mounted ? children : <div className="h-40 animate-pulse rounded-xl bg-muted" aria-label="Cargando" />}
        </div>
      </main>

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-7 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden"
      >
        {NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className={cn(
              "flex flex-col items-center gap-0.5 py-2 text-[10px]",
              isActive(n.to) ? "text-primary" : "text-muted-foreground",
            )}
          >
            <n.icon className="size-5" />
            {"short" in n ? n.short : n.label}
          </Link>
        ))}
      </nav>

      {mounted && !data.settings.onboarded && <Onboarding />}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Section({ title, action, children, className }: { title?: string | undefined; action?: ReactNode; children: ReactNode; className?: string | undefined }) {
  return (
    <section className={cn("surface p-4 sm:p-5", className)}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="text-sm font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">{children}</p>;
}
