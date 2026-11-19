import { isUuid } from "@/lib/contacts/validation";
import { zonedDateTimeToUtc } from "./time";
import type { AppointmentType } from "@/lib/types";

const types = new Set<AppointmentType>(["visit", "valuation", "call", "meeting", "other"]);
const reminders = new Set([15, 30, 60]);

export type AppointmentInput = {
  title: string; description: string | null; appointmentType: AppointmentType;
  startsAt: string; endsAt: string; timeZone: string; location: string | null;
  reminderMinutes: number | null; contactId: string | null;
};
export type AppointmentErrors = Partial<Record<"title" | "date" | "startTime" | "endTime" | "timeZone" | "appointmentType" | "contactId" | "description" | "location" | "reminderMinutes", string>>;

export function validateAppointment(formData: FormData): { input?: AppointmentInput; errors: AppointmentErrors } {
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const appointmentType = String(formData.get("appointmentType") || "") as AppointmentType;
  const date = String(formData.get("date") || "");
  const startTime = String(formData.get("startTime") || "");
  const endTime = String(formData.get("endTime") || "");
  const timeZone = String(formData.get("timeZone") || "Europe/Madrid");
  const location = String(formData.get("location") || "").trim() || null;
  const contactIdRaw = String(formData.get("contactId") || "");
  const contactId = contactIdRaw || null;
  const reminderRaw = String(formData.get("reminderMinutes") || "");
  const reminderMinutes = reminderRaw ? Number(reminderRaw) : null;
  const errors: AppointmentErrors = {};
  if (!title || title.length > 160) errors.title = "Escribe un título de hasta 160 caracteres.";
  if (description && description.length > 5000) errors.description = "La descripción no puede superar 5.000 caracteres.";
  if (!types.has(appointmentType)) errors.appointmentType = "Selecciona un tipo de cita.";
  if (!timeZone || timeZone.length > 64) errors.timeZone = "La zona horaria no es válida.";
  if (location && location.length > 500) errors.location = "La ubicación no puede superar 500 caracteres.";
  if (contactId && !isUuid(contactId)) errors.contactId = "El contacto no es válido.";
  if (reminderMinutes !== null && !reminders.has(reminderMinutes)) errors.reminderMinutes = "Selecciona un recordatorio válido.";
  const startsAt = zonedDateTimeToUtc(date, startTime, timeZone);
  const endsAt = zonedDateTimeToUtc(date, endTime, timeZone);
  if (!startsAt) errors.startTime = "La fecha u hora inicial no existe en esta zona horaria.";
  if (!endsAt) errors.endTime = "La fecha u hora final no existe en esta zona horaria.";
  if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) errors.endTime = "La hora final debe ser posterior a la inicial.";
  if (Object.keys(errors).length || !startsAt || !endsAt) return { errors };
  return { input: { title, description, appointmentType, startsAt, endsAt, timeZone, location, reminderMinutes, contactId }, errors };
}
