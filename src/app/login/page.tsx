import Link from "next/link";
import { signIn } from "./actions";
import { hasSupabaseEnv } from "@/lib/env";

export const metadata = { title: "Acceder" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (!hasSupabaseEnv()) {
    return <main className="app-shell flex items-center justify-center"><section className="surface w-full max-w-lg rounded-[2rem] p-7"><p className="eyebrow">Configuración pendiente</p><h1 className="mt-2 text-3xl font-black">Conecta Supabase para acceder</h1><p className="muted mt-4 leading-7">El modo real necesita las variables de <code>.env.local</code>. Mientras tanto puedes recorrer la experiencia sin credenciales.</p><Link href="/demo" className="touch mt-7 grid place-items-center rounded-xl bg-[var(--primary)] px-5 font-bold text-white">Abrir demostración</Link></section></main>;
  }
  const { error } = await searchParams;
  return <main className="app-shell flex items-center justify-center"><section className="surface w-full max-w-md rounded-[2rem] p-7 md:p-9"><p className="eyebrow">Oficina Digital</p><h1 className="mt-2 text-3xl font-black">Qué alegría verte</h1><p className="muted mt-2">Accede a tu espacio de trabajo privado.</p>{error && <p role="alert" className="mt-5 rounded-xl border border-red-400 bg-red-50 p-3 text-sm text-red-900">{error}</p>}<form action={signIn} className="mt-7 space-y-5"><label className="block"><span className="text-sm font-bold">Correo electrónico</span><input name="email" type="email" autoComplete="email" required className="touch mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4" /></label><label className="block"><span className="text-sm font-bold">Contraseña</span><input name="password" type="password" autoComplete="current-password" minLength={6} required className="touch mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4" /></label><button className="touch w-full rounded-xl bg-[var(--primary)] px-5 font-bold text-white">Iniciar sesión</button></form><Link href="/demo" className="muted mt-6 block text-center text-sm underline underline-offset-4">Ver modo demostración</Link></section></main>;
}
