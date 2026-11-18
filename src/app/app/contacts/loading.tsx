export default function ContactsLoading() {
  return <main className="app-shell" aria-busy="true"><div className="mt-5 h-14 animate-pulse rounded-2xl bg-[var(--surface-muted)]" /><div className="mt-8 h-12 w-48 animate-pulse rounded-xl bg-[var(--surface-muted)]" /><div className="mt-6 grid gap-4 md:grid-cols-2">{[1, 2, 3, 4].map((item) => <div key={item} className="h-44 animate-pulse rounded-2xl bg-[var(--surface-muted)]" />)}</div><p className="sr-only">Cargando contactos…</p></main>;
}
