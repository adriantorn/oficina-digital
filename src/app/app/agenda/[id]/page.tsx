import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, MapPin, Pencil, UserRound } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { cancelAppointmentAction, retryGoogleSyncAction } from "@/app/app/agenda/actions";
import { getAppointment } from "@/lib/data/appointments";
const dt = new Intl.DateTimeFormat("es-ES", { dateStyle: "full", timeStyle: "short", timeZone: "Europe/Madrid" });

export default async function AppointmentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string; updated?: string; cancelled?: string; retried?: string }> }) {
  const { id } = await params; const [appointment, notice] = await Promise.all([getAppointment(id), searchParams]);
  if (!appointment) notFound();
  return <main className="app-shell"><AppHeader title="Detalle de cita" backHref="/app/agenda" />
    {(notice.created || notice.updated || notice.cancelled || notice.retried) && <p role="status" className="mt-5 rounded-xl bg-[var(--surface-muted)] p-4 font-semibold">{notice.created ? "Cita creada correctamente." : notice.updated ? "Cambios guardados correctamente." : notice.cancelled ? "Cita cancelada localmente." : "Sincronización reintentada."}</p>}
    <section className="surface mt-6 rounded-[2rem] p-6 md:p-9"><div className="flex flex-wrap justify-between gap-5"><div><span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-bold">{appointment.status === "cancelled" ? "Cancelada" : appointment.appointmentType}</span><h1 className="mt-4 text-3xl font-black md:text-5xl">{appointment.title}</h1><p className="muted mt-5 flex gap-2"><CalendarClock />{dt.format(new Date(appointment.startsAt))} — {dt.format(new Date(appointment.endsAt))}</p>{appointment.contactName && <Link className="muted mt-3 flex gap-2 underline" href={`/app/contacts/${appointment.contactId}`}><UserRound />{appointment.contactName}</Link>}{appointment.location && <p className="muted mt-3 flex gap-2"><MapPin />{appointment.location}</p>}</div>{appointment.status !== "cancelled" && <Link href={`/app/agenda/${appointment.id}/edit`} className="touch flex items-center gap-2 rounded-xl border border-[var(--border)] px-5 font-bold"><Pencil size={18} />Editar</Link>}</div>
      {appointment.description && <p className="mt-7 whitespace-pre-wrap border-t border-[var(--border)] pt-6">{appointment.description}</p>}
      <div className="muted mt-7 border-t border-[var(--border)] pt-5 text-sm"><p>Recordatorio: {appointment.reminderMinutes ? `${appointment.reminderMinutes} minutos antes` : "desactivado"}</p><p>Google Calendar: {appointment.googleSyncStatus === "synced" ? "sincronizada" : appointment.googleSyncStatus === "error" ? "error pendiente de reintento" : "solo local"}</p>{appointment.googleSyncError && <p role="alert" className="mt-2 text-red-700">{appointment.googleSyncError}</p>}</div>
      <div className="mt-6 flex flex-wrap gap-3">{appointment.status !== "cancelled" && <form action={cancelAppointmentAction}><input type="hidden" name="id" value={appointment.id} /><button className="touch rounded-xl border border-red-400 px-5 font-bold text-red-700">Cancelar cita</button></form>}{appointment.googleSyncStatus === "error" && <form action={retryGoogleSyncAction}><input type="hidden" name="id" value={appointment.id} /><button className="touch rounded-xl bg-[var(--primary)] px-5 font-bold text-white">Reintentar sincronización</button></form>}</div>
    </section></main>;
}
