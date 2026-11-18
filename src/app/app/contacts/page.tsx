import Link from "next/link";
import { Mail, Phone, Plus, Search } from "lucide-react";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { AppNav } from "@/components/app-nav";
import { listContacts } from "@/lib/data/contacts";
import { contactKinds } from "@/lib/contacts/validation";
import type { ContactKind } from "@/lib/types";

export const metadata = { title: "Contactos" };

const labels: Record<ContactKind, string> = { seller: "Vendedor", buyer: "Comprador", both: "Comprador y vendedor" };

export default async function ContactsPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string; page?: string; deleted?: string; intent?: string }> }) {
  const params = await searchParams;
  const query = (params.q || "").slice(0, 200);
  const kind = contactKinds.includes(params.type as ContactKind) ? params.type as ContactKind : "all";
  const requestedPage = /^\d+$/.test(params.page || "") ? Math.max(1, Number(params.page)) : 1;
  const result = await listContacts({ query, kind, page: requestedPage });
  const href = ({ type = kind, page = 1 }: { type?: string; page?: number } = {}) => {
    const next = new URLSearchParams({ ...(query ? { q: query } : {}), ...(type !== "all" ? { type } : {}), ...(page > 1 ? { page: String(page) } : {}) });
    const suffix = next.toString();
    return `/app/contacts${suffix ? `?${suffix}` : ""}`;
  };
  if (requestedPage > result.totalPages) redirect(href({ page: result.totalPages }));
  const { contacts } = result;
  return <main className="app-shell">
    <AppHeader title="Contactos" />
    <div className="mt-6 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Tu cartera</p><h1 className="mt-1 text-3xl font-black md:text-5xl">Contactos</h1><p className="muted mt-2">{result.total} {result.total === 1 ? "resultado" : "resultados"}{result.totalPages > 1 ? ` · Página ${result.page} de ${result.totalPages}` : ""}</p></div><Link href="/app/contacts/new" className="touch flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 font-bold text-white"><Plus size={20} /> Nuevo contacto</Link></div>
    {params.deleted && <p role="status" className="mt-5 rounded-xl bg-[var(--surface-muted)] p-4 font-semibold">Contacto eliminado correctamente.</p>}
    {params.intent === "note" && <p role="status" className="mt-5 rounded-xl bg-[var(--surface-muted)] p-4">Selecciona un contacto para añadir una anotación a su historial.</p>}
    <form className="surface mt-6 flex gap-2 rounded-2xl p-2" action="/app/contacts"><label htmlFor="contact-search" className="sr-only">Buscar por nombre, teléfono o correo</label><div className="relative flex-1"><Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={20} /><input id="contact-search" name="q" defaultValue={query} className="min-h-12 w-full rounded-xl bg-transparent pl-12 pr-4" placeholder="Nombre, teléfono o correo" /></div>{kind !== "all" && <input type="hidden" name="type" value={kind} />}<button className="touch rounded-xl bg-[var(--primary)] px-5 font-bold text-white">Buscar</button></form>
    <div className="mt-4 flex gap-2 overflow-x-auto pb-2" aria-label="Filtrar contactos">{[["all", "Todos"], ["seller", "Vendedores"], ["buyer", "Compradores"]].map(([value, label]) => <Link key={value} href={href({ type: value })} aria-current={kind === value ? "true" : undefined} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold ${kind === value ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--surface)]"}`}>{label}</Link>)}</div>
    {contacts.length ? <section aria-label="Listado de contactos" className="mt-5 grid gap-4 md:grid-cols-2">{contacts.map((contact) => <Link key={contact.id} href={`/app/contacts/${contact.id}`} className="surface rounded-2xl p-5 transition-transform hover:-translate-y-0.5"><div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-extrabold">{contact.firstName} {contact.lastName}</h2><span className="mt-2 inline-block rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-bold">{labels[contact.kind]}</span></div><span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--surface-muted)] font-black text-[var(--primary-strong)]">{contact.firstName[0]}{contact.lastName[0] || ""}</span></div><div className="muted mt-5 space-y-2 text-sm">{contact.email && <p className="flex items-center gap-2"><Mail size={16} />{contact.email}</p>}{contact.phone && <p className="flex items-center gap-2"><Phone size={16} />{contact.phone}</p>}{!contact.email && !contact.phone && <p>Sin datos de contacto</p>}</div></Link>)}</section> : <section className="surface mt-5 rounded-3xl p-8 text-center"><h2 className="text-xl font-extrabold">No hay contactos que coincidan</h2><p className="muted mt-2">Prueba otra búsqueda o crea un contacto nuevo.</p><Link href="/app/contacts/new" className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-[var(--primary)] px-5 font-bold text-white">Crear contacto</Link></section>}
    {result.totalPages > 1 && <nav aria-label="Paginación de contactos" className="mt-7 flex items-center justify-center gap-3"><Link href={href({ page: result.page - 1 })} aria-disabled={result.page === 1} className={`touch grid place-items-center rounded-xl border border-[var(--border)] px-5 font-bold ${result.page === 1 ? "pointer-events-none opacity-50" : "bg-[var(--surface)]"}`}>Anterior</Link><span className="muted text-sm" aria-live="polite">{result.page} / {result.totalPages}</span><Link href={href({ page: result.page + 1 })} aria-disabled={result.page === result.totalPages} className={`touch grid place-items-center rounded-xl border border-[var(--border)] px-5 font-bold ${result.page === result.totalPages ? "pointer-events-none opacity-50" : "bg-[var(--surface)]"}`}>Siguiente</Link></nav>}
    <AppNav active="contacts" />
  </main>;
}
