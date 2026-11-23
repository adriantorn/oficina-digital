"use client";

import { useActionState, useState } from "react";
import { createAppointmentAction, updateAppointmentAction, type AppointmentActionState } from "@/app/app/agenda/actions";
import { localInputValues } from "@/lib/agenda/time";
import type { AppointmentDraft } from "@/lib/agenda/draft";
import type { AppointmentDetail, ContactSummary } from "@/lib/types";

const initialState: AppointmentActionState = { message: "" };
const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);

function initialDraft(appointment?: AppointmentDetail, defaultContactId?: string): AppointmentDraft {
  const zone = appointment?.timeZone || "Europe/Madrid";
  const start = appointment ? localInputValues(appointment.startsAt, zone) : null;
  const end = appointment ? localInputValues(appointment.endsAt, zone) : null;
  return {
    title: appointment?.title || "", date: start?.date || tomorrow,
    startTime: start?.time || "10:00", endTime: end?.time || "11:00", timeZone: zone,
    appointmentType: appointment?.appointmentType || "visit", contactId: appointment?.contactId || defaultContactId || "",
    location: appointment?.location || "", reminderMinutes: appointment?.reminderMinutes ? String(appointment.reminderMinutes) : "",
    description: appointment?.description || "",
  };
}

export function AppointmentForm({ appointment, contacts, defaultContactId }: { appointment?: AppointmentDetail; contacts: ContactSummary[]; defaultContactId?: string }) {
  const [state, action, pending] = useActionState(appointment ? updateAppointmentAction : createAppointmentAction, initialState);
  const draft = state.draft || initialDraft(appointment, defaultContactId);
  const formKey = state.draft ? JSON.stringify(state.draft) : `initial-${appointment?.id || "new"}`;
  return <AppointmentFields key={formKey} appointment={appointment} contacts={contacts} initial={draft} state={state} action={action} pending={pending} />;
}

function AppointmentFields({ appointment, contacts, initial, state, action, pending }: { appointment?: AppointmentDetail; contacts: ContactSummary[]; initial: AppointmentDraft; state: AppointmentActionState; action: (formData: FormData) => void; pending: boolean }) {
  const [draft, setDraft] = useState(initial);
  const [confirmed, setConfirmed] = useState(false);
  const fieldClass = "mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4";
  const update = (field: keyof AppointmentDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setConfirmed(false);
  };

  return <form action={action} className="mt-7 space-y-5">
    {appointment && <input type="hidden" name="id" value={appointment.id} />}
    <input type="hidden" name="timeZone" value={draft.timeZone} />
    <label className="block font-bold">Título *<input className={fieldClass} name="title" required maxLength={160} value={draft.title} onChange={(event) => update("title", event.target.value)} />{state.errors?.title && <small className="block text-red-700">{state.errors.title}</small>}</label>
    <div className="grid gap-5 sm:grid-cols-3">
      <label className="font-bold">Fecha *<input className={fieldClass} type="date" name="date" required value={draft.date} onChange={(event) => update("date", event.target.value)} /></label>
      <label className="font-bold">Inicio *<input className={fieldClass} type="time" name="startTime" required value={draft.startTime} onChange={(event) => update("startTime", event.target.value)} />{state.errors?.startTime && <small className="block text-red-700">{state.errors.startTime}</small>}</label>
      <label className="font-bold">Fin *<input className={fieldClass} type="time" name="endTime" required value={draft.endTime} onChange={(event) => update("endTime", event.target.value)} />{state.errors?.endTime && <small className="block text-red-700">{state.errors.endTime}</small>}</label>
    </div>
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="font-bold">Tipo<select className={fieldClass} name="appointmentType" value={draft.appointmentType} onChange={(event) => update("appointmentType", event.target.value)}><option value="visit">Visita</option><option value="valuation">Valoración</option><option value="call">Llamada</option><option value="meeting">Reunión</option><option value="other">Otro</option></select></label>
      <label className="font-bold">Contacto<select className={fieldClass} name="contactId" value={draft.contactId} onChange={(event) => update("contactId", event.target.value)}><option value="">Sin contacto</option>{contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.firstName} {contact.lastName}</option>)}</select></label>
    </div>
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="font-bold">Ubicación<input className={fieldClass} name="location" maxLength={500} value={draft.location} onChange={(event) => update("location", event.target.value)} /></label>
      <label className="font-bold">Recordatorio<select className={fieldClass} name="reminderMinutes" value={draft.reminderMinutes} onChange={(event) => update("reminderMinutes", event.target.value)}><option value="">Sin recordatorio</option><option value="15">15 minutos antes</option><option value="30">30 minutos antes</option><option value="60">1 hora antes</option></select></label>
    </div>
    <label className="block font-bold">Descripción<textarea className={`${fieldClass} min-h-28 py-3`} name="description" maxLength={5000} value={draft.description} onChange={(event) => update("description", event.target.value)} /></label>
    {state.conflict && <label className="flex items-start gap-3 rounded-xl border border-amber-500 bg-amber-50 p-4 text-amber-950"><input className="mt-1" type="checkbox" name="confirmOverlap" value="yes" required checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span><strong>Horario solapado.</strong> {state.conflict}</span></label>}
    {state.message && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-800">{state.message}</p>}
    <button disabled={pending} className="touch w-full rounded-xl bg-[var(--primary)] px-6 font-bold text-white disabled:opacity-60">{pending ? "Guardando…" : appointment ? "Guardar cambios" : "Crear cita"}</button>
  </form>;
}
