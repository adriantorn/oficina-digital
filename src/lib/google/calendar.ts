import "server-only";
import { accessToken, getConnection } from "./connection";
import type { AppointmentDetail, BusyBlock } from "@/lib/types";

const API = "https://www.googleapis.com/calendar/v3";

export class GoogleCalendarError extends Error {
  constructor(message: string, public status: number, public retryable = false) { super(message); }
}

async function request(url: string, init: RequestInit, attempts = 3): Promise<Response> {
  let response: Response | null = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    response = await fetch(url, init);
    if (response.ok || ![429, 500, 502, 503, 504].includes(response.status)) return response;
    if (attempt < attempts - 1) await new Promise((resolve) => setTimeout(resolve, 50 * 2 ** attempt));
  }
  return response!;
}

function eventBody(input: AppointmentDetail) {
  return {
    summary: input.title, description: input.description, location: input.location,
    start: { dateTime: input.startsAt, timeZone: input.timeZone },
    end: { dateTime: input.endsAt, timeZone: input.timeZone },
    extendedProperties: { private: { oficinaDigitalId: input.id } },
  };
}

export async function createOfficeCalendar(token: string) {
  const response = await request(`${API}/calendars`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ summary: "Oficina Digital", timeZone: "Europe/Madrid" }) });
  if (!response.ok) throw new GoogleCalendarError("No se pudo crear el calendario laboral.", response.status, response.status >= 500);
  return (await response.json() as { id: string }).id;
}

export async function canReuseOfficeCalendar(token: string, calendarId: string) {
  const response = await request(`${API}/calendars/${encodeURIComponent(calendarId)}`, { headers: { Authorization: `Bearer ${token}` } }, 1);
  return response.ok;
}

export async function resolveOfficeCalendar(token: string, previousCalendarId?: string | null) {
  if (previousCalendarId && await canReuseOfficeCalendar(token, previousCalendarId)) return { calendarId: previousCalendarId, reused: true };
  return { calendarId: await createOfficeCalendar(token), reused: false };
}

export async function getPersonalBusyBlocks(ownerId: string, timeMin: string, timeMax: string, timeZone = "Europe/Madrid"): Promise<BusyBlock[]> {
  const token = await accessToken(ownerId);
  const response = await request(`${API}/freeBusy`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ timeMin, timeMax, timeZone, items: [{ id: "primary" }] }) });
  if (!response.ok) throw new GoogleCalendarError("No se pudo consultar la disponibilidad personal.", response.status, response.status >= 500 || response.status === 429);
  const json = await response.json() as { calendars?: Record<string, { busy?: { start: string; end: string }[]; errors?: unknown[] }> };
  const primary = json.calendars?.primary;
  if (!primary || primary.errors?.length) throw new GoogleCalendarError("Google devolvió un error al consultar la disponibilidad personal.", 502, true);
  return (primary.busy || []).map((block) => ({ startsAt: block.start, endsAt: block.end, source: "google" }));
}

export async function syncGoogleEvent(ownerId: string, input: AppointmentDetail) {
  const token = await accessToken(ownerId);
  const connection = await getConnection(ownerId);
  if (!connection?.calendar_id) throw new GoogleCalendarError("Calendario laboral no disponible.", 404);
  const calendarUrl = `${API}/calendars/${encodeURIComponent(connection.calendar_id)}/events`;
  const deterministicId = input.id.replaceAll("-", "");
  const externalId = input.googleEventId || undefined;
  const id = externalId || deterministicId;
  const headers: Record<string, string> = { Authorization: `Bearer ${token}`, "content-type": "application/json" };
  const knownEtag = input.googleEventEtag;
  if (knownEtag) headers["If-Match"] = knownEtag;

  if (externalId) {
    const update = await request(`${calendarUrl}/${encodeURIComponent(id)}?sendUpdates=none`, { method: "PUT", headers, body: JSON.stringify({ id, ...eventBody(input) }) });
    if (update.status === 412) throw new GoogleCalendarError("El evento cambió en Google. Revisa la cita antes de reintentar.", 412);
    if (!update.ok) throw new GoogleCalendarError("No se pudo actualizar el evento en Google.", update.status, update.status >= 500 || update.status === 429);
    const data = await update.json() as { id: string; etag?: string };
    return { externalId: data.id, etag: data.etag || null };
  }

  const create = await request(`${calendarUrl}?sendUpdates=none`, { method: "POST", headers, body: JSON.stringify({ id: deterministicId, ...eventBody(input) }) });
  if (create.status === 409) {
    const existing = await request(`${calendarUrl}/${deterministicId}`, { headers: { Authorization: `Bearer ${token}` } }, 1);
    if (!existing.ok) throw new GoogleCalendarError("Existe un conflicto de identificador en Google.", existing.status);
    const current = await existing.json() as { id: string; etag?: string; extendedProperties?: { private?: { oficinaDigitalId?: string } } };
    if (current.extendedProperties?.private?.oficinaDigitalId !== input.id) throw new GoogleCalendarError("El identificador remoto pertenece a otro evento.", 409);
    const replaceHeaders = { ...headers, ...(current.etag ? { "If-Match": current.etag } : {}) };
    const replace = await request(`${calendarUrl}/${deterministicId}?sendUpdates=none`, { method: "PUT", headers: replaceHeaders, body: JSON.stringify({ id: deterministicId, ...eventBody(input) }) });
    if (!replace.ok) throw new GoogleCalendarError("No se pudo actualizar el evento existente.", replace.status, replace.status >= 500 || replace.status === 429);
    const replaced = await replace.json() as { id: string; etag?: string };
    return { externalId: replaced.id, etag: replaced.etag || null };
  }
  if (!create.ok) throw new GoogleCalendarError("No se pudo crear el evento en Google.", create.status, create.status >= 500 || create.status === 429);
  const data = await create.json() as { id: string; etag?: string };
  return { externalId: data.id, etag: data.etag || null };
}

export async function deleteGoogleEvent(ownerId: string, appointmentId: string) {
  const token = await accessToken(ownerId), connection = await getConnection(ownerId);
  if (!connection?.calendar_id) throw new GoogleCalendarError("Calendario laboral no disponible.", 404);
  const eventId = appointmentId.replaceAll("-", "");
  const response = await request(`${API}/calendars/${encodeURIComponent(connection.calendar_id)}/events/${eventId}?sendUpdates=none`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok && response.status !== 404 && response.status !== 410) throw new GoogleCalendarError("No se pudo cancelar el evento en Google.", response.status, response.status >= 500 || response.status === 429);
}
