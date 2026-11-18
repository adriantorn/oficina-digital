import Link from "next/link";
import { CalendarDays, Home, NotebookPen, Search, User, UserPlus, UsersRound } from "lucide-react";
import type { DashboardData } from "@/lib/types";
import { ThemeToggle } from "./theme-toggle";
import { AppNav } from "./app-nav";

const dateFormatter = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long" });
const shortDate = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" });

function greeting() {
  const hour = new Date().getHours();
  if (hour < 13) return "Buenos días";
  if (hour < 20) return "Buenas tardes";
  return "Buenas noches";
}

export function Dashboard({ data }: { data: DashboardData }) {
  const firstName = data.displayName.split(" ")[0];
  const realActions = [
    { icon: UserPlus, label: "Nuevo contacto", href: "/app/contacts/new" },
    { icon: Search, label: "Buscar contacto", href: "/app/contacts" },
    { icon: NotebookPen, label: "Nueva anotación", href: "/app/contacts?intent=note" },
  ];

  return <main className="app-shell">
    <header className="flex items-center justify-between gap-4 py-3 md:py-5">
      <div className="flex min-w-0 items-center gap-3"><div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--primary)] text-white"><Home size={25} aria-hidden /></div><div className="min-w-0"><p className="truncate text-xl font-extrabold tracking-tight md:text-2xl">Oficina Digital</p><p className="muted truncate text-sm">Tu trabajo, más sencillo.</p></div></div>
      <div className="flex gap-2"><ThemeToggle /><Link href={data.isDemo ? "/login" : "/app/profile"} className="touch grid place-items-center rounded-full border border-[var(--border)] bg-[var(--surface)]" aria-label={data.isDemo ? "Iniciar sesión" : "Ver perfil"}><User size={21} /></Link></div>
    </header>
    {data.isDemo && <div role="status" className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-[var(--primary)] bg-[var(--surface-muted)] px-4 py-3 text-sm"><span><strong>Modo demostración.</strong> Los datos son ficticios y no se guardan.</span><Link href="/login" className="font-bold text-[var(--primary-strong)] underline underline-offset-4">Acceder</Link></div>}
    <section className="surface relative overflow-hidden rounded-3xl p-5 md:rounded-[2rem] md:p-10"><div className="absolute -right-10 -top-14 size-36 rounded-full bg-[var(--surface-muted)] md:-right-14 md:-top-20 md:size-56" aria-hidden /><div className="relative max-w-3xl"><p className="eyebrow">{dateFormatter.format(new Date())}</p><h1 className="mt-2 text-3xl font-black tracking-[-.04em] md:mt-3 md:text-6xl">{greeting()}, {firstName}.</h1><p className="muted mt-2 text-base md:mt-4 md:text-2xl">Aquí tienes lo importante para hoy.</p></div></section>
    <section aria-labelledby="quick-title" className="mt-6 md:mt-9"><p className="eyebrow">Atajos</p><h2 id="quick-title" className="mt-1 text-2xl font-extrabold md:text-3xl">Accesos rápidos</h2><div className="mt-3 grid grid-cols-2 gap-3 md:mt-4">
      {!data.isDemo && realActions.map(({ icon: Icon, label, href }) => <Link key={label} href={href} className="surface flex min-h-16 items-center gap-3 rounded-2xl px-4 md:min-h-20 md:gap-4 md:px-5"><Icon className="shrink-0 text-[var(--primary)]" aria-hidden /><span className="font-bold leading-tight">{label}</span></Link>)}
      <button type="button" disabled className="surface flex min-h-16 cursor-not-allowed items-center gap-3 rounded-2xl px-4 text-left opacity-70 md:min-h-20 md:gap-4 md:px-5" title="Disponible cuando se integre la agenda"><CalendarDays className="shrink-0 text-[var(--primary)]" aria-hidden /><span><span className="block font-bold leading-tight">Nueva cita</span><span className="muted block text-xs">Próximamente</span></span></button>
      {data.isDemo && [UserPlus, Search, NotebookPen].map((Icon, index) => <button key={index} type="button" disabled className="surface flex min-h-16 cursor-not-allowed items-center gap-3 rounded-2xl px-4 text-left opacity-70 md:min-h-20 md:gap-4 md:px-5"><Icon className="shrink-0 text-[var(--primary)]" /><span><span className="block font-bold leading-tight">{["Nuevo contacto", "Buscar contacto", "Nueva anotación"][index]}</span><span className="muted hidden text-xs sm:block">Accede para gestionar datos reales</span></span></button>)}
    </div></section>
    <section aria-labelledby="activity-title" className="mt-7 md:mt-8"><p className="eyebrow">Tu oficina</p><h2 id="activity-title" className="mt-1 text-2xl font-extrabold md:text-3xl">De un vistazo</h2><div className="mt-3 grid grid-cols-2 gap-3 md:mt-4 md:gap-4">
      <article className="surface rounded-2xl p-4 md:rounded-3xl md:p-6"><UsersRound className="text-[var(--primary)]" size={25} aria-hidden /><p className="mt-4 text-3xl font-black md:mt-8 md:text-4xl">{data.contactCount}</p><h3 className="mt-1 font-bold md:text-lg">Contactos</h3><p className="muted mt-1 text-xs md:mt-2 md:text-sm">{data.isDemo ? "Datos de ejemplo" : "En tu cartera"}</p></article>
      <article className="surface rounded-2xl p-4 md:rounded-3xl md:p-6"><CalendarDays className="text-[var(--primary)]" size={25} aria-hidden /><p className="mt-4 text-3xl font-black md:mt-8 md:text-4xl">{data.appointments ?? "—"}</p><h3 className="mt-1 font-bold md:text-lg">Próximas citas</h3><p className="muted mt-1 text-xs md:mt-2 md:text-sm">Agenda futura</p></article>
    </div></section>
    {!data.isDemo && <section aria-labelledby="recent-title" className="mt-9"><div className="flex items-end justify-between gap-4"><div><p className="eyebrow">Actividad reciente</p><h2 id="recent-title" className="mt-1 text-2xl font-extrabold md:text-3xl">Contactos recientes</h2></div><Link href="/app/contacts" className="font-bold text-[var(--primary-strong)]">Ver todos</Link></div>
      {data.recentContacts.length ? <div className="mt-4 grid gap-3">{data.recentContacts.map((contact) => <Link key={contact.id} href={`/app/contacts/${contact.id}`} className="surface flex min-h-20 items-center justify-between gap-4 rounded-2xl px-5"><span><span className="block font-bold">{contact.firstName} {contact.lastName}</span><span className="muted block text-sm">{contact.email || contact.phone || "Sin datos de contacto"}</span></span><span className="muted shrink-0 text-sm">{shortDate.format(new Date(contact.updatedAt))}</span></Link>)}</div> : <div className="surface mt-4 rounded-2xl p-6"><p className="font-bold">Todavía no hay contactos.</p><p className="muted mt-1 text-sm">Crea el primero para empezar a organizar tu cartera.</p><Link href="/app/contacts/new" className="mt-4 inline-flex min-h-12 items-center rounded-xl bg-[var(--primary)] px-5 font-bold text-white">Añadir el primero</Link></div>}
    </section>}
    <AppNav active="home" demo={data.isDemo} />
  </main>;
}
