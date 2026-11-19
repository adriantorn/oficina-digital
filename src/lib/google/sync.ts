import "server-only";
import { requireUser } from "@/lib/data/auth";
import { getAppointment } from "@/lib/data/appointments";
import { connectionStatus } from "./connection";
import { createGoogleEvent, deleteGoogleEvent } from "./calendar";
export async function syncAppointmentBestEffort(id:string){const{user,supabase}=await requireUser();try{if(!(await connectionStatus(user.id)).connected)return;const appointment=await getAppointment(id);if(!appointment)return;await supabase.from("appointments").update({google_sync_status:"pending",google_sync_error:null}).eq("id",id).eq("owner_id",user.id);const result=await createGoogleEvent(user.id,appointment);await supabase.from("appointments").update({google_event_id:result.externalId,google_event_etag:result.etag,google_sync_status:"synced",google_synced_at:new Date().toISOString(),google_sync_error:null}).eq("id",id).eq("owner_id",user.id);}catch(error){const message=error instanceof Error?error.message:"Error de sincronización";await supabase.from("appointments").update({google_sync_status:"error",google_sync_error:message.slice(0,500)}).eq("id",id).eq("owner_id",user.id);}}
export async function cancelGoogleBestEffort(id:string){const{user}=await requireUser();try{if((await connectionStatus(user.id)).connected)await deleteGoogleEvent(user.id,id);}catch{/* La cita local sigue siendo la fuente de verdad. */}}
