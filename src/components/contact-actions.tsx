"use client";

import { useActionState } from "react";
import { addNoteAction, deleteContactAction, type NoteActionState } from "@/app/app/contacts/actions";

export function DeleteContactButton({ id }: { id: string }) {
  return <form action={deleteContactAction} onSubmit={(event) => { if (!window.confirm("¿Eliminar este contacto y todo su historial? Esta acción no se puede deshacer.")) event.preventDefault(); }}>
    <input type="hidden" name="id" value={id} />
    <button className="touch w-full rounded-xl border border-red-300 px-5 font-bold text-red-700">Eliminar contacto</button>
  </form>;
}

export function NoteForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState<NoteActionState, FormData>(addNoteAction, { message: "" });
  return <form action={action} className="mt-4">
    <input type="hidden" name="id" value={id} />
    <label htmlFor="note" className="font-bold">Nueva anotación</label>
    <textarea id="note" name="body" required maxLength={10000} rows={4} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4" placeholder="Escribe aquí el contexto de la conversación…" />
    {state.message && <p className="mt-2 text-sm text-red-700" role="alert">{state.message}</p>}
    <button disabled={pending} className="touch mt-3 rounded-xl bg-[var(--primary)] px-5 font-bold text-white disabled:opacity-60">{pending ? "Guardando…" : "Añadir al historial"}</button>
  </form>;
}
