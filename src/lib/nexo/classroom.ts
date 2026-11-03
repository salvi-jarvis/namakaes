// Optional Google Classroom add-on. Runs fully in the browser with the user's own OAuth client ID.
const CID_KEY = "nexo:gc:clientId";
const TOKEN_KEY = "nexo:gc:token";
export const GC_SCOPES = [
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
].join(" ");

export type GcWork = { key: string; courseId: string; courseName: string; id: string; title: string; due: string; link?: string };

export const getClientId = () => localStorage.getItem(CID_KEY) ?? "";
export const setClientId = (v: string) => (v ? localStorage.setItem(CID_KEY, v) : localStorage.removeItem(CID_KEY));
export function getToken(): string | null {
  try {
    const t = JSON.parse(localStorage.getItem(TOKEN_KEY) ?? "null") as { v: string; exp: number } | null;
    return t && t.exp > Date.now() ? t.v : null;
  } catch {
    return null;
  }
}
export const clearToken = () => {
  const t = getToken();
  localStorage.removeItem(TOKEN_KEY);
  const g = (window as unknown as { google?: any }).google;
  if (t && g?.accounts?.oauth2?.revoke) g.accounts.oauth2.revoke(t, () => {});
};

function loadGis(): Promise<any> {
  const w = window as unknown as { google?: any };
  if (w.google?.accounts?.oauth2) return Promise.resolve(w.google);
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => (w.google?.accounts?.oauth2 ? res(w.google) : rej(new Error("No se pudo cargar Google Identity Services.")));
    s.onerror = () => rej(new Error("No se pudo cargar Google Identity Services. Revisa tu conexión o bloqueadores."));
    document.head.appendChild(s);
  });
}

const ERRORS: Record<string, string> = {
  popup_closed: "Has cerrado la ventana de Google antes de terminar.",
  popup_failed_to_open: "El navegador bloqueó la ventana de Google. Permite ventanas emergentes.",
  access_denied: "Has denegado el acceso a Classroom.",
  invalid_client: "El ID de cliente no es válido.",
};

export async function connect(clientId: string): Promise<string> {
  const google = await loadGis();
  return new Promise((res, rej) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: GC_SCOPES,
      callback: (r: any) => {
        if (r.error) return rej(new Error(ERRORS[r.error] ?? `Google devolvió un error: ${r.error_description || r.error}`));
        localStorage.setItem(TOKEN_KEY, JSON.stringify({ v: r.access_token, exp: Date.now() + (Number(r.expires_in) || 3600) * 1000 - 60000 }));
        res(r.access_token);
      },
      error_callback: (e: any) => rej(new Error(ERRORS[e?.type] ?? "No se pudo conectar con Google. Comprueba el ID de cliente y los orígenes autorizados.")),
    });
    client.requestAccessToken();
  });
}

async function api<T>(token: string, path: string): Promise<T> {
  const r = await fetch(`https://classroom.googleapis.com/v1/${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (r.status === 401) throw new Error("La sesión de Google ha caducado. Vuelve a conectar.");
  if (r.status === 403) throw new Error("Google ha denegado el acceso. Activa la API de Classroom en tu proyecto de Google Cloud y revisa los permisos.");
  if (!r.ok) throw new Error(`Error de Classroom (${r.status}).`);
  return r.json();
}

const pad = (n: number) => String(n).padStart(2, "0");

type Course = { id: string; name: string };
type CourseWork = {
  id: string;
  title?: string;
  dueDate?: { year: number; month: number; day: number };
  alternateLink?: string;
};
type Page<T> = { courses?: T[]; courseWork?: T[]; nextPageToken?: string };

// Bound both items and requests; never label a truncated collection as complete.
async function fetchPages<T>(token: string, path: string, key: "courses" | "courseWork"): Promise<T[]> {
  const items: T[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < 20; page++) {
    const suffix = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : "";
    const response = await api<Page<T>>(token, `${path}${suffix}`);
    items.push(...(response[key] ?? []));
    pageToken = response.nextPageToken;
    if (items.length > 1000 || (items.length >= 1000 && pageToken)) {
      throw new Error("Classroom supera el límite de 1.000 elementos. No se han mostrado resultados incompletos.");
    }
    if (!pageToken) return items;
  }
  throw new Error("No se pudo completar la paginación de Classroom. No se han mostrado resultados incompletos.");
}

export async function fetchWork(token: string): Promise<{ courses: number; work: GcWork[] }> {
  const courses = await fetchPages<Course>(token, "courses?courseStates=ACTIVE&pageSize=50", "courses");
  const work: GcWork[] = [];
  for (const course of courses) {
    const courseWork = await fetchPages<CourseWork>(token, `courses/${encodeURIComponent(course.id)}/courseWork?pageSize=50`, "courseWork");
    for (const x of courseWork) {
      if (!x.dueDate?.year) continue; // only items with a real due date
      work.push({
        key: `classroom:${course.id}:${x.id}`,
        courseId: course.id,
        courseName: course.name,
        id: x.id,
        title: x.title || "Sin título",
        due: `${x.dueDate.year}-${pad(x.dueDate.month)}-${pad(x.dueDate.day)}`,
        ...(x.alternateLink ? { link: x.alternateLink } : {}),
      });
    }
  }
  work.sort((a, b) => a.due.localeCompare(b.due));
  return { courses: courses.length, work };
}
