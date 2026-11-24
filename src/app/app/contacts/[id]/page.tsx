import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, FolderOpen, Mail, Pencil, Phone, Upload } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { DeleteContactButton, NoteForm } from "@/components/contact-actions";
import { activateDriveFolderAction } from "@/app/app/contacts/actions";
import { requireUser } from "@/lib/data/auth";
import { getContact, getContactActivities } from "@/lib/data/contacts";
import { getContactDriveFolder, listContactDocuments } from "@/lib/data/drive";
import { DOCUMENT_ACCEPT } from "@/lib/documents/validation";
import { driveConnectionStatus } from "@/lib/google/drive-connection";
import type { ActivityKind, ContactKind } from "@/lib/types";

const kindLabels: Record<ContactKind, string> = { seller: "Vendedor", buyer: "Comprador", both: "Comprador y vendedor" };
const activityLabels: Record<ActivityKind, string> = { note: "Anotación", call: "Llamada", visit: "Visita", event: "Evento" };
const dateTime = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" });

type Notice = {
  created?: string; updated?: string; noted?: string; driveFolder?: string; driveError?: string;
  uploaded?: string; uploadError?: "size" | "type" | "file" | "contact" | "drive";
};

function uploadErrorMessage(code: Notice["uploadError"]) {
  if (code === "size") return "El archivo supera el límite de 15 MB.";
  if (code === "type") return "Ese formato no está admitido.";
  if (code === "file") return "Selecciona un archivo antes de continuar.";
  return "No se pudo subir el documento. Comprueba la conexión con Drive e inténtalo de nuevo.";
}

function fileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function ContactPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Notice> }) {
  const { id } = await params;
  const contact = await getContact(id);
  if (!contact) notFound();
  const [{ user }, activities, folder, documents, notice] = await Promise.all([
    requireUser(), getContactActivities(id), getContactDriveFolder(id), listContactDocuments(id), searchParams,
  ]);
  const drive = await driveConnectionStatus(user.id);
  const success = notice.created ? "Contacto creado correctamente." : notice.updated ? "Cambios guardados correctamente." : notice.noted ? "Anotación añadida al historial." : notice.driveFolder ? "Expediente activado en Google Drive." : notice.uploaded ? "Documento añadido al expediente." : null;
  return <main className="app-shell"><AppHeader title="Ficha de contacto" backHref="/app/contacts" />
    {success && <p role="status" className="mt-5 rounded-xl bg-[var(--surface-muted)] p-4 font-semibold">{success}</p>}
    {(notice.driveError || notice.uploadError) && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 font-semibold text-red-800">{notice.uploadError ? uploadErrorMessage(notice.uploadError) : "No se pudo activar o abrir el expediente. Revisa la conexión con Drive."}</p>}
    <section className="surface mt-6 rounded-[2rem] p-6 md:p-9"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start"><div><span className="inline-block rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-bold">{kindLabels[contact.kind]}</span><h1 className="mt-4 text-3xl font-black md:text-5xl">{contact.firstName} {contact.lastName}</h1><div className="muted mt-5 space-y-3">{contact.email && <p className="flex items-center gap-2"><Mail size={18} /><a href={`mailto:${contact.email}`} className="underline">{contact.email}</a></p>}{contact.phone && <p className="flex items-center gap-2"><Phone size={18} /><a href={`tel:${contact.phone}`} className="underline">{contact.phone}</a></p>}{!contact.email && !contact.phone && <p>Sin datos de contacto adicionales</p>}</div></div><Link href={`/app/contacts/${contact.id}/edit`} className="touch flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-5 font-bold"><Pencil size={18} /> Editar</Link></div></section>
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_.62fr]"><section className="surface rounded-3xl p-6"><p className="eyebrow">Conversaciones</p><h2 className="mt-1 text-2xl font-extrabold">Historial</h2>{activities.length ? <ol className="mt-6 space-y-4">{activities.map((activity) => <li key={activity.id} className="border-l-2 border-[var(--primary)] pl-4"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-bold">{activityLabels[activity.kind]}</span><time className="muted text-sm" dateTime={activity.occurredAt}>{dateTime.format(new Date(activity.occurredAt))}</time></div><p className="mt-2 whitespace-pre-wrap">{activity.body}</p><p className="muted mt-2 text-xs">Por {activity.authorName}</p></li>)}</ol> : <p className="muted mt-5">Todavía no hay actividad registrada.</p>}<NoteForm id={contact.id} /></section>
      <aside className="space-y-6"><section className="surface rounded-3xl p-6"><p className="eyebrow">Última anotación</p>{activities[0] ? <><p className="mt-3 line-clamp-5">{activities[0].body}</p><p className="muted mt-3 text-xs">{dateTime.format(new Date(activities[0].occurredAt))}</p></> : <p className="muted mt-3">Sin anotaciones todavía.</p>}</section>
        <section className="surface rounded-3xl p-6" aria-labelledby="documents-title"><FileText className="text-[var(--primary)]" aria-hidden /><h2 id="documents-title" className="mt-3 text-xl font-extrabold">Documentos</h2>
          {!drive.connected ? <><p className="muted mt-2 text-sm">Conecta tu cuenta para crear el expediente y añadir archivos sin abrir Drive.</p><Link href="/app/integrations/google" className="touch mt-5 inline-grid place-items-center rounded-xl bg-[var(--primary)] px-4 font-bold text-white">Conectar Google Drive</Link></> : <>
            {folder?.status === "ready" ? <a href={`/api/contacts/${contact.id}/folder/open`} target="_blank" rel="noreferrer" className="touch mt-4 flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-4 font-bold"><FolderOpen size={18} /> Abrir expediente</a> : <form action={activateDriveFolderAction} className="mt-4"><input type="hidden" name="id" value={contact.id} /><button className="touch flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 font-bold text-white"><FolderOpen size={18} /> Activar expediente</button></form>}
            <form action={`/api/contacts/${contact.id}/documents`} method="post" encType="multipart/form-data" className="mt-6 border-t border-[var(--border)] pt-5">
              <input type="hidden" name="operationReference" value={randomUUID()} />
              <label htmlFor="document" className="font-bold">Añadir documento</label>
              <input id="document" name="document" type="file" required accept={DOCUMENT_ACCEPT} className="mt-2 block w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-sm" />
              <p className="muted mt-2 text-xs">PDF, fotos y documentos habituales. Máximo 15 MB. Si hace falta, crearemos el expediente automáticamente.</p>
              <button className="touch mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 font-bold text-white"><Upload size={18} /> Subir a Drive</button>
            </form>
            {documents.length ? <ul className="mt-6 space-y-3" aria-label="Documentos del expediente">{documents.map((document) => <li key={document.id}><a href={`/api/documents/${document.id}/open`} target="_blank" rel="noreferrer" className="block rounded-xl border border-[var(--border)] p-3 hover:bg-[var(--surface-muted)]"><span className="block break-words font-bold">{document.name}</span><span className="muted mt-1 block text-xs">{fileSize(document.sizeBytes)} · {document.uploadedAt ? dateTime.format(new Date(document.uploadedAt)) : "Subido"}</span></a></li>)}</ul> : <p className="muted mt-5 text-sm">Todavía no hay documentos.</p>}
          </>}
        </section>
        <section className="surface rounded-3xl p-6"><h2 className="font-extrabold">Zona sensible</h2><p className="muted mb-4 mt-2 text-sm">Al eliminar el contacto también se elimina su historial y las referencias del expediente. Las carpetas y archivos de Drive no se borran.</p><DeleteContactButton id={contact.id} /></section></aside>
    </div>
  </main>;
}
