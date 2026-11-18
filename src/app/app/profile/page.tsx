import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { updateDisplayName } from "@/app/app/profile/actions";

export const metadata = { title: "Mi perfil" };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const notice = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("display_name, created_at").eq("id", user.id).maybeSingle();
  return <main className="app-shell flex items-center justify-center"><section className="surface w-full max-w-lg rounded-[2rem] p-6 md:p-9"><p className="eyebrow">Cuenta protegida</p><h1 className="mt-2 text-3xl font-black">Mi perfil</h1>{notice.saved && <p role="status" className="mt-5 rounded-xl bg-[var(--surface-muted)] p-3 font-semibold">Nombre visible actualizado.</p>}{notice.error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-red-800">No se pudo guardar el nombre. Revisa el campo e inténtalo de nuevo.</p>}<form action={updateDisplayName} className="mt-7"><label htmlFor="displayName" className="font-bold">Nombre visible en el escritorio</label><input id="displayName" name="displayName" defaultValue={profile?.display_name || ""} required maxLength={120} autoComplete="name" className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4" /><p className="muted mt-2 text-sm">Te recomendamos usar solo tu nombre de pila.</p><button className="touch mt-4 w-full rounded-xl bg-[var(--primary)] px-5 font-bold text-white">Guardar nombre</button></form><dl className="mt-7"><div><dt className="muted text-sm">Correo</dt><dd className="mt-1 break-all font-bold">{user.email}</dd></div></dl><div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href="/app" className="touch grid flex-1 place-items-center rounded-xl border border-[var(--border)] font-bold">Volver</Link><form action={signOut} className="flex-1"><button className="touch w-full rounded-xl border border-[var(--border)] px-5 font-bold">Cerrar sesión</button></form></div></section></main>;
}
