"use client";

export default function ContactsError({ reset }: { reset: () => void }) {
  return <main className="app-shell grid place-items-center"><section className="surface max-w-lg rounded-3xl p-8 text-center"><h1 className="text-2xl font-black">No hemos podido cargar tus contactos</h1><p className="muted mt-3">Comprueba la conexión y vuelve a intentarlo.</p><button onClick={reset} className="touch mt-5 rounded-xl bg-[var(--primary)] px-5 font-bold text-white">Reintentar</button></section></main>;
}
