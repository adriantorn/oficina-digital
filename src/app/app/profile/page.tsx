import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

export const metadata = { title: "Mi perfil" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("display_name, created_at").eq("id", user.id).maybeSingle();
  return <main className="app-shell flex items-center justify-center"><section className="surface w-full max-w-lg rounded-[2rem] p-6 md:p-9"><p className="eyebrow">Cuenta protegida</p><h1 className="mt-2 text-3xl font-black">Mi perfil</h1><dl className="mt-7 space-y-5"><div><dt className="muted text-sm">Nombre</dt><dd className="mt-1 font-bold">{profile?.display_name || "Sin completar"}</dd></div><div><dt className="muted text-sm">Correo</dt><dd className="mt-1 font-bold break-all">{user.email}</dd></div></dl><div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href="/app" className="touch grid flex-1 place-items-center rounded-xl border border-[var(--border)] font-bold">Volver</Link><form action={signOut} className="flex-1"><button className="touch w-full rounded-xl bg-[var(--primary)] px-5 font-bold text-white">Cerrar sesión</button></form></div></section></main>;
}
