import Link from "next/link";
import { CalendarDays, Home, Menu, UsersRound } from "lucide-react";

export function AppNav({ active, demo = false }: { active: "home" | "contacts" | "agenda"; demo?: boolean }) {
  const items = [
    { icon: Home, label: "Inicio", href: "/app", key: "home" },
    { icon: UsersRound, label: "Contactos", href: "/app/contacts", key: "contacts" },
    { icon: CalendarDays, label: "Agenda", href: "/app/agenda", key: "agenda" },
  ] as const;
  return <nav aria-label="Navegación principal" className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_94%,transparent)] px-2 backdrop-blur-xl">
    <div className="mx-auto grid max-w-xl grid-cols-4">
      {items.map(({ icon: Icon, label, href, key }) => demo && key === "contacts" ? <button key={key} type="button" disabled className="muted flex min-h-20 cursor-not-allowed flex-col items-center justify-center gap-1 text-xs font-semibold" title="Accede para gestionar contactos"><Icon size={23} aria-hidden />{label}</button> : <Link key={key} href={href} className={`flex min-h-20 flex-col items-center justify-center gap-1 text-xs font-semibold ${active === key ? "text-[var(--primary-strong)]" : "muted"}`} aria-current={active === key ? "page" : undefined}><Icon size={23} aria-hidden />{label}</Link>)}
      <button type="button" disabled className="muted flex min-h-20 cursor-not-allowed flex-col items-center justify-center gap-1 text-xs font-semibold" title="Próximamente"><Menu size={23} aria-hidden />Más</button>
    </div>
  </nav>;
}
