"use client";

import { useActionState } from "react";
import { createContactAction, updateContactAction, type ContactActionState } from "@/app/app/contacts/actions";
import type { ContactDetail, ContactKind } from "@/lib/types";

const initialState: ContactActionState = { message: "" };
const kinds: { value: ContactKind; label: string }[] = [
  { value: "seller", label: "Vendedor" },
  { value: "buyer", label: "Comprador" },
  { value: "both", label: "Ambos" },
];

export function ContactForm({ contact }: { contact?: ContactDetail }) {
  const [state, action, pending] = useActionState(contact ? updateContactAction : createContactAction, initialState);
  const fieldClass = "mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-[var(--text)]";
  return <form action={action} className="mt-7 space-y-5">
    {contact && <input type="hidden" name="id" value={contact.id} />}
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="font-bold">Nombre <span aria-hidden>*</span><input name="firstName" defaultValue={contact?.firstName} required maxLength={120} autoComplete="given-name" className={fieldClass} aria-describedby={state.errors?.firstName ? "firstName-error" : undefined} />{state.errors?.firstName && <span id="firstName-error" className="mt-2 block text-sm text-red-700" role="alert">{state.errors.firstName}</span>}</label>
      <label className="font-bold">Apellidos<input name="lastName" defaultValue={contact?.lastName} maxLength={160} autoComplete="family-name" className={fieldClass} aria-describedby={state.errors?.lastName ? "lastName-error" : undefined} />{state.errors?.lastName && <span id="lastName-error" className="mt-2 block text-sm text-red-700" role="alert">{state.errors.lastName}</span>}</label>
    </div>
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="font-bold">Correo<input name="email" type="email" defaultValue={contact?.email || ""} maxLength={320} autoComplete="email" className={fieldClass} aria-describedby={state.errors?.email ? "email-error" : undefined} />{state.errors?.email && <span id="email-error" className="mt-2 block text-sm text-red-700" role="alert">{state.errors.email}</span>}</label>
      <label className="font-bold">Teléfono<input name="phone" type="tel" defaultValue={contact?.phone || ""} maxLength={40} autoComplete="tel" className={fieldClass} aria-describedby={state.errors?.phone ? "phone-error" : undefined} />{state.errors?.phone && <span id="phone-error" className="mt-2 block text-sm text-red-700" role="alert">{state.errors.phone}</span>}</label>
    </div>
    <fieldset><legend className="font-bold">Tipo de contacto <span aria-hidden>*</span></legend><div className="mt-3 grid gap-3 sm:grid-cols-3">{kinds.map(({ value, label }) => <label key={value} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4"><input type="radio" name="kind" value={value} defaultChecked={(contact?.kind || "buyer") === value} /> <span className="font-semibold">{label}</span></label>)}</div>{state.errors?.kind && <p className="mt-2 text-sm text-red-700" role="alert">{state.errors.kind}</p>}</fieldset>
    {state.message && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">{state.message}</p>}
    <button disabled={pending} className="touch w-full rounded-xl bg-[var(--primary)] px-6 font-bold text-white disabled:opacity-60">{pending ? "Guardando…" : contact ? "Guardar cambios" : "Crear contacto"}</button>
  </form>;
}
