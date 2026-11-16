"use client";

import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  function toggle() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("oficina-theme", next);
  }
  return <button type="button" onClick={toggle} className="touch relative grid place-items-center rounded-full border border-[var(--border)] bg-[var(--surface)]" aria-label="Cambiar tema de color"><Moon size={21} className="block [[data-theme=dark]_&]:hidden" aria-hidden /><Sun size={21} className="hidden [[data-theme=dark]_&]:block" aria-hidden /></button>;
}
