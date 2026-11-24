import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { requireUser } from "@/lib/data/auth";
import { connectionStatus } from "@/lib/google/connection";
import { driveConnectionStatus } from "@/lib/google/drive-connection";
import { disconnectDrive, disconnectGoogle } from "./actions";

type Params = { connected?: string; disconnected?: string; error?: string; driveConnected?: string; driveDisconnected?: string; driveError?: string };

export default async function GoogleIntegration({ searchParams }: { searchParams: Promise<Params> }) {
  const [{ user }, params] = await Promise.all([requireUser(), searchParams]);
  const [calendar, drive] = await Promise.all([connectionStatus(user.id), driveConnectionStatus(user.id)]);
  return <main className="app-shell"><AppHeader title="Integraciones de Google" backHref="/app/profile" />
    <div className="mx-auto mt-6 grid max-w-4xl gap-6 lg:grid-cols-2">
      <section className="surface rounded-[2rem] p-6 md:p-9"><p className="eyebrow">Agenda</p><h1 className="mt-2 text-3xl font-black">Google Calendar</h1><p className="muted mt-3">Consulta únicamente bloques ocupado/libre y gestiona las citas creadas por Oficina Digital.</p>
        {(params.connected || params.disconnected) && <p role="status" className="mt-5 rounded-xl bg-[var(--surface-muted)] p-4">{params.connected ? "Google Calendar conectado." : "Calendar desconectado sin borrar calendarios ni eventos."}</p>}
        {params.error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-800">No se pudo completar la conexión con Calendar.</p>}
        <div className="mt-7 rounded-2xl border border-[var(--border)] p-5"><p className="font-extrabold">Estado: {calendar.connected ? "Conectado" : calendar.configured ? "No conectado" : "Pendiente de configuración"}</p></div>
        <div className="mt-6">{calendar.connected ? <form action={disconnectGoogle}><button className="touch rounded-xl border border-red-400 px-5 font-bold text-red-700">Desconectar Calendar</button></form> : <Link aria-disabled={!calendar.configured} href={calendar.configured ? "/api/integrations/google/connect" : "#"} className={`touch inline-grid place-items-center rounded-xl bg-[var(--primary)] px-5 font-bold text-white ${!calendar.configured ? "pointer-events-none opacity-50" : ""}`}>Conectar Google Calendar</Link>}</div>
      </section>
      <section className="surface rounded-[2rem] p-6 md:p-9"><p className="eyebrow">Expedientes</p><h2 className="mt-2 text-3xl font-black">Google Drive</h2><p className="muted mt-3">Crea carpetas y sube documentos desde cada ficha. Solo accedemos a archivos creados por Oficina Digital.</p>
        {(params.driveConnected || params.driveDisconnected) && <p role="status" className="mt-5 rounded-xl bg-[var(--surface-muted)] p-4">{params.driveConnected ? "Google Drive conectado." : "Drive desconectado sin borrar carpetas ni documentos."}</p>}
        {params.driveError && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-800">No se pudo completar la conexión con Drive.</p>}
        <div className="mt-7 rounded-2xl border border-[var(--border)] p-5"><p className="font-extrabold">Estado: {drive.connected ? "Conectado" : drive.configured ? "No conectado" : "Pendiente de configuración"}</p><p className="muted mt-2 text-sm">Permiso solicitado: crear y gestionar únicamente archivos de esta aplicación.</p></div>
        <div className="mt-6">{drive.connected ? <form action={disconnectDrive}><button className="touch rounded-xl border border-red-400 px-5 font-bold text-red-700">Desconectar Drive</button></form> : <Link aria-disabled={!drive.configured} href={drive.configured ? "/api/integrations/google/drive/connect" : "#"} className={`touch inline-grid place-items-center rounded-xl bg-[var(--primary)] px-5 font-bold text-white ${!drive.configured ? "pointer-events-none opacity-50" : ""}`}>Conectar Google Drive</Link>}</div>
      </section>
    </div>
  </main>;
}
