import Link from "next/link";
import { CalendarPlus, ChevronLeft, ChevronRight, MapPin, ShieldAlert } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { AppNav } from "@/components/app-nav";
import { dateInTimeZone, addLocalDays, localDateRangeUtc, localWeekRangeUtc } from "@/lib/agenda/time";
import { listAppointments } from "@/lib/data/appointments";
import { optionalGoogleAvailability } from "@/lib/google/availability";
const fmt = new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Madrid" });
const tm = new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" });
export const metadata = { title: "Agenda" };

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ date?: string; view?: string }> }) {
  const params = await searchParams;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.date || "") ? params.date! : dateInTimeZone();
  const view = params.view === "week" ? "week" : "day";
  const range = view === "week" ? localWeekRangeUtc(date) : localDateRangeUtc(date);
  const [appointments, google] = await Promise.all([listAppointments(range.start, range.end), optionalGoogleAvailability(range.start, range.end)]);
  const step = view === "week" ? 7 : 1;
  return <main className="app-shell"><AppHeader title="Agenda" />
    <section className="mt-6 flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">Europe/Madrid</p><h1 className="text-3xl font-black">Tu agenda privada</h1></div><Link href="/app/agenda/new" className="touch flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 font-bold text-white"><CalendarPlus size={19} />Nueva cita</Link></section>
    {google.warning && <p role="alert" className="mt-4 flex gap-2 rounded-xl bg-amber-50 p-4 text-amber-950"><ShieldAlert className="shrink-0" />{google.warning}</p>}
    {google.blocks.length > 0 && <section aria-label="Ocupación personal" className="surface mt-4 rounded-2xl p-4"><p className="font-extrabold">Disponibilidad personal</p><p className="muted text-sm">Solo intervalos ocupado/libre; no se leen ni guardan detalles.</p><ol className="mt-3 grid gap-2">{google.blocks.map((block) => <li key={`${block.startsAt}-${block.endsAt}`} className="rounded-xl border border-dashed border-[var(--primary)] px-4 py-3"><strong>Ocupado · Personal</strong><span className="muted ml-2">{fmt.format(new Date(block.startsAt))} · {tm.format(new Date(block.startsAt))}–{tm.format(new Date(block.endsAt))}</span></li>)}</ol></section>}
    <section className="surface mt-5 rounded-3xl p-4 md:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex rounded-xl border border-[var(--border)] p-1"><Link className={`rounded-lg px-4 py-2 font-bold ${view === "day" ? "bg-[var(--surface-muted)]" : ""}`} href={`/app/agenda?date=${date}&view=day`}>Día</Link><Link className={`rounded-lg px-4 py-2 font-bold ${view === "week" ? "bg-[var(--surface-muted)]" : ""}`} href={`/app/agenda?date=${date}&view=week`}>Semana</Link></div><div className="flex items-center gap-2"><Link aria-label="Anterior" className="touch grid place-items-center rounded-xl border border-[var(--border)]" href={`/app/agenda?date=${addLocalDays(date, -step)}&view=${view}`}><ChevronLeft /></Link><time className="min-w-36 text-center font-extrabold">{view === "week" ? `Semana del ${fmt.format(new Date(range.start))}` : fmt.format(new Date(range.start))}</time><Link aria-label="Siguiente" className="touch grid place-items-center rounded-xl border border-[var(--border)]" href={`/app/agenda?date=${addLocalDays(date, step)}&view=${view}`}><ChevronRight /></Link></div></div>
      {appointments.length ? <ol className="mt-6 grid gap-3">{appointments.map((appointment) => <li key={appointment.id}><Link href={`/app/agenda/${appointment.id}`} className={`block rounded-2xl border border-[var(--border)] p-4 ${appointment.status === "cancelled" ? "opacity-60" : ""}`}><div className="flex flex-wrap justify-between gap-3"><span><strong className="block text-lg">{appointment.title}</strong><span className="muted text-sm">{fmt.format(new Date(appointment.startsAt))} · {tm.format(new Date(appointment.startsAt))}–{tm.format(new Date(appointment.endsAt))}</span></span><span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-bold">{appointment.status === "cancelled" ? "Cancelada" : appointment.contactName || "Sin contacto"}</span></div>{appointment.location && <span className="muted mt-2 flex items-center gap-1 text-sm"><MapPin size={15} />{appointment.location}</span>}</Link></li>)}</ol> : <div className="py-16 text-center"><CalendarPlus className="mx-auto text-[var(--primary)]" /><p className="mt-4 font-extrabold">No hay citas en este periodo.</p><p className="muted mt-1">Tu agenda está libre.</p></div>}
    </section><AppNav active="agenda" /></main>;
}
