import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, Mail, Pencil, Phone } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { DeleteContactButton, NoteForm } from "@/components/contact-actions";
import { getContact, getContactActivities } from "@/lib/data/contacts";
import type { ActivityKind, ContactKind } from "@/lib/types";

const kindLabels: Record<ContactKind, string> = { seller: "Vendedor", buyer: "Comprador", both: "Comprador y vendedor" };
const activityLabels: Record<ActivityKind, string> = { note: "Anotación", call: "Llamada", visit: "Visita", event: "Evento" };
const dateTime = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" });

export default async function ContactPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string; updated?: string; noted?: string }> }) {
  const { id } = await params;
  const contact = await getContact(id);
  if (!contact) notFound();
  const activities = await getContactActivities(id);
  const notice = await searchParams;
  return <main className="app-shell"><AppHeader title="Ficha de contacto" backHref="/app/contacts" />
    {(notice.created || notice.updated || notice.noted) && <p role="status" className="mt-5 rounded-xl bg-[var(--surface-muted)] p-4 font-semibold">{notice.created ? "Contacto creado correctamente." : notice.updated ? "Cambios guardados correctamente." : "Anotación añadida al historial."}</p>}
    <section className="surface mt-6 rounded-[2rem] p-6 md:p-9"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start"><div><span className="inline-block rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-bold">{kindLabels[contact.kind]}</span><h1 className="mt-4 text-3xl font-black md:text-5xl">{contact.firstName} {contact.lastName}</h1><div className="muted mt-5 space-y-3">{contact.email && <p className="flex items-center gap-2"><Mail size={18} /><a href={`mailto:${contact.email}`} className="underline">{contact.email}</a></p>}{contact.phone && <p className="flex items-center gap-2"><Phone size={18} /><a href={`tel:${contact.phone}`} className="underline">{contact.phone}</a></p>}{!contact.email && !contact.phone && <p>Sin datos de contacto adicionales</p>}</div></div><Link href={`/app/contacts/${contact.id}/edit`} className="touch flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-5 font-bold"><Pencil size={18} /> Editar</Link></div></section>
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_.62fr]"><section className="surface rounded-3xl p-6"><p className="eyebrow">Conversaciones</p><h2 className="mt-1 text-2xl font-extrabold">Historial</h2>{activities.length ? <ol className="mt-6 space-y-4">{activities.map((activity) => <li key={activity.id} className="border-l-2 border-[var(--primary)] pl-4"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-bold">{activityLabels[activity.kind]}</span><time className="muted text-sm" dateTime={activity.occurredAt}>{dateTime.format(new Date(activity.occurredAt))}</time></div><p className="mt-2 whitespace-pre-wrap">{activity.body}</p><p className="muted mt-2 text-xs">Por {activity.authorName}</p></li>)}</ol> : <p className="muted mt-5">Todavía no hay actividad registrada.</p>}<NoteForm id={contact.id} /></section>
      <aside className="space-y-6"><section className="surface rounded-3xl p-6"><p className="eyebrow">Última anotación</p>{activities[0] ? <><p className="mt-3 line-clamp-5">{activities[0].body}</p><p className="muted mt-3 text-xs">{dateTime.format(new Date(activities[0].occurredAt))}</p></> : <p className="muted mt-3">Sin anotaciones todavía.</p>}</section><section className="surface rounded-3xl p-6"><FileText className="text-[var(--primary)]" aria-hidden /><h2 className="mt-3 font-extrabold">Documentación</h2><p className="muted mt-2 text-sm">La organización con Google Drive estará disponible en una fase posterior. No hay ninguna conexión activa ni archivos ficticios.</p></section><section className="surface rounded-3xl p-6"><h2 className="font-extrabold">Zona sensible</h2><p className="muted mb-4 mt-2 text-sm">Al eliminar el contacto también se elimina su historial.</p><DeleteContactButton id={contact.id} /></section></aside>
    </div>
  </main>;
}
