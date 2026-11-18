import Link from "next/link";
import { ArrowLeft, Home, User } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppHeader({ title, backHref }: { title?: string; backHref?: string }) {
  return <header className="flex items-center justify-between gap-4 py-3 md:py-5">
    <div className="flex min-w-0 items-center gap-3">
      {backHref ? <Link href={backHref} className="touch grid shrink-0 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)]" aria-label="Volver"><ArrowLeft size={22} /></Link> : <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--primary)] text-white"><Home size={25} aria-hidden /></div>}
      <div className="min-w-0"><p className="truncate text-xl font-extrabold tracking-tight md:text-2xl">{title || "Oficina Digital"}</p><p className="muted truncate text-sm">Tu trabajo, más sencillo.</p></div>
    </div>
    <div className="flex gap-2"><ThemeToggle /><Link href="/app/profile" className="touch grid place-items-center rounded-full border border-[var(--border)] bg-[var(--surface)]" aria-label="Ver perfil"><User size={21} /></Link></div>
  </header>;
}
