import "server-only";
import { requireUser } from "@/lib/data/auth";
import { getAppointment } from "@/lib/data/appointments";
import { connectionStatus } from "./connection";
import { deleteGoogleEvent, syncGoogleEvent } from "./calendar";

async function markError(id: string, message: string) {
  const { user, supabase } = await requireUser();
  await supabase.from("appointments").update({ google_sync_status: "error", google_sync_error: message.slice(0, 500) }).eq("id", id).eq("owner_id", user.id);
}

export async function syncAppointmentBestEffort(id: string) {
  const { user, supabase } = await requireUser();
  try {
    if (!(await connectionStatus(user.id)).connected) return { synced: false, skipped: true };
    const appointment = await getAppointment(id);
    if (!appointment) return { synced: false, skipped: true };
    await supabase.from("appointments").update({ google_sync_status: "pending", google_sync_error: null }).eq("id", id).eq("owner_id", user.id);
    if (appointment.status === "cancelled") {
      await deleteGoogleEvent(user.id, id);
      await supabase.from("appointments").update({ google_event_id: null, google_event_etag: null, google_sync_status: "local", google_synced_at: new Date().toISOString(), google_sync_error: null }).eq("id", id).eq("owner_id", user.id);
      return { synced: true, skipped: false };
    }
    const result = await syncGoogleEvent(user.id, appointment);
    await supabase.from("appointments").update({ google_event_id: result.externalId, google_event_etag: result.etag, google_sync_status: "synced", google_synced_at: new Date().toISOString(), google_sync_error: null }).eq("id", id).eq("owner_id", user.id);
    return { synced: true, skipped: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error de sincronización con Google";
    await markError(id, message);
    return { synced: false, skipped: false, error: message };
  }
}

export async function cancelGoogleBestEffort(id: string) {
  return syncAppointmentBestEffort(id);
}
