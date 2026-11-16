import Link from "next/link";
import { CalendarDays, CheckSquare2, Home, Menu, NotebookPen, Search, User, UserPlus, UsersRound } from "lucide-react";
import type { DashboardData } from "@/lib/types";
import { ThemeToggle } from "./theme-toggle";

const dateFormatter = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long" });

function greeting() {
  const hour = new Date().getHours();
  if (hour < 13) return "Buenos días";
  if (hour < 20) return "Buenas tardes";
  return "Buenas noches";
}

export function Dashboard({ data }: { data: DashboardData }) {
  const firstName = data.displayName.split(" ")[0];
  const cards = [
    { icon: CalendarDays, label: "Próximas citas", value: data.appointments, empty: "Sin citas para hoy" },
    { icon: CheckSquare2, label: "Gestiones pendientes", value: data.pending, empty: "Todo al día" },
  ];
  const actions = [
    { icon: UserPlus, label: "Nuevo cliente", note: "Disponible en el Hito 2" },
    { icon: Search, label: "Buscar cliente", note: "Disponible en el Hito 2" },
    { icon: CalendarDays, label: "Nueva cita", note: "Disponible en el Hito 4" },
    { icon: NotebookPen, label: "Nueva anotación", note: "Disponible en el Hito 3" },
  ];

  return <main className="app-shell">
    <header className="flex items-center justify-between gap-4 py-3 md:py-5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--primary)] text-white"><Home size={25} aria-hidden /></div>
        <div className="min-w-0"><p className="truncate text-xl font-extrabold tracking-tight md:text-2xl">Oficina Digital</p><p className="muted truncate text-sm">Tu trabajo, más sencillo.</p></div>
      </div>
      <div className="flex gap-2"><ThemeToggle /><Link href={data.isDemo ? "/login" : "/app/profile"} className="touch grid place-items-center rounded-full border border-[var(--border)] bg-[var(--surface)]" aria-label={data.isDemo ? "Iniciar sesión" : "Ver perfil"}><User size={21} /></Link></div>
    </header>

    {data.isDemo && <div role="status" className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-[var(--primary)] bg-[var(--surface-muted)] px-4 py-3 text-sm"><span><strong>Modo demostración.</strong> Los datos de esta vista son ficticios.</span><Link href="/login" className="font-bold text-[var(--primary-strong)] underline underline-offset-4">Acceder</Link></div>}

    <section className="surface relative overflow-hidden rounded-[2rem] p-6 md:p-10">
      <div className="absolute -right-14 -top-20 size-56 rounded-full bg-[var(--surface-muted)]" aria-hidden />
      <div className="relative max-w-3xl"><p className="eyebrow">{dateFormatter.format(new Date())}</p><h1 className="mt-3 text-4xl font-black tracking-[-.04em] md:text-6xl">{greeting()}, {firstName}.</h1><p className="muted mt-4 text-lg md:text-2xl">Aquí tienes lo importante para empezar el día con calma.</p></div>
    </section>

    <section aria-labelledby="activity-title" className="mt-8"><div className="mb-4 flex items-end justify-between"><div><p className="eyebrow">Tu día</p><h2 id="activity-title" className="mt-1 text-2xl font-extrabold md:text-3xl">De un vistazo</h2></div></div>
      <div className="grid gap-4 sm:grid-cols-2">{cards.map(({ icon: Icon, label, value, empty }) => <article key={label} className="surface rounded-3xl p-6"><Icon className="text-[var(--primary)]" size={27} aria-hidden /><p className="mt-8 text-4xl font-black">{value ?? "—"}</p><h3 className="mt-1 text-lg font-bold">{label}</h3><p className="muted mt-2 text-sm">{value === null ? "Se activará al incorporar la agenda" : value === 0 ? empty : data.isDemo ? "Datos de ejemplo" : "Actualizado con tus datos"}</p></article>)}</div>
    </section>

    <section aria-labelledby="quick-title" className="mt-9"><p className="eyebrow">Atajos</p><h2 id="quick-title" className="mt-1 text-2xl font-extrabold md:text-3xl">Accesos rápidos</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{actions.map(({ icon: Icon, label, note }) => <button key={label} type="button" disabled title={note} className="surface flex min-h-20 cursor-not-allowed items-center gap-4 rounded-2xl px-5 text-left opacity-70" aria-describedby={`note-${label.replaceAll(" ", "-")}`}><Icon className="shrink-0 text-[var(--primary)]" aria-hidden /><span><span className="block font-bold">{label}</span><span id={`note-${label.replaceAll(" ", "-")}`} className="muted block text-xs">Próximamente</span></span></button>)}</div></section>

    <nav aria-label="Navegación principal" className="fixed inset-x-0 bottom-0 z-10 border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_94%,transparent)] px-2 backdrop-blur-xl"><div className="mx-auto grid max-w-xl grid-cols-4">{[
      { icon: Home, label: "Inicio", active: true }, { icon: UsersRound, label: "Contactos" }, { icon: CalendarDays, label: "Agenda" }, { icon: Menu, label: "Más" },
    ].map(({ icon: Icon, label, active }) => <button key={label} type="button" disabled={!active} className={`flex min-h-20 flex-col items-center justify-center gap-1 text-xs font-semibold ${active ? "text-[var(--primary-strong)]" : "muted cursor-not-allowed"}`} aria-current={active ? "page" : undefined} title={active ? undefined : "Próximamente"}><Icon size={23} aria-hidden />{label}</button>)}</div></nav>
  </main>;
}
