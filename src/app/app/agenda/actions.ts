"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validateAppointment, type AppointmentErrors } from "@/lib/agenda/validation";
import { cancelAppointmentRecord, hasConflict, insertAppointment, updateAppointmentRecord } from "@/lib/data/appointments";
import { isUuid } from "@/lib/contacts/validation";
import { cancelGoogleBestEffort, syncAppointmentBestEffort } from "@/lib/google/sync";
export type AppointmentActionState={message:string;errors?:AppointmentErrors;conflict?:string};
async function save(formData:FormData,id?:string):Promise<AppointmentActionState>{ const result=validateAppointment(formData); if(!result.input) return {message:"Revisa los campos indicados.",errors:result.errors}; try { const conflict=await hasConflict(result.input.startsAt,result.input.endsAt,id); if(conflict&&formData.get("confirmOverlap")!=="yes") return {message:"Ya tienes otra cita en ese horario.",conflict:"Confirma que deseas guardar ambas citas."}; const savedId=id?(await updateAppointmentRecord(id,result.input)?id:null):await insertAppointment(result.input); if(!savedId)return {message:"No se encontró la cita o no tienes permiso."}; await syncAppointmentBestEffort(savedId); revalidatePath("/app"); revalidatePath("/app/agenda"); redirect(`/app/agenda/${savedId}?${id?"updated":"created"}=1`); } catch(e){ if(e&&typeof e==="object"&&"digest" in e) throw e; return {message:"No se pudo guardar la cita. Comprueba el contacto y vuelve a intentarlo."}; }}
export async function createAppointmentAction(_:AppointmentActionState,f:FormData){return save(f);}
export async function updateAppointmentAction(_:AppointmentActionState,f:FormData){const id=String(f.get("id")||"");if(!isUuid(id))return {message:"La cita no es válida."};return save(f,id);}
export async function cancelAppointmentAction(f:FormData){const id=String(f.get("id")||"");if(!isUuid(id))return;await cancelAppointmentRecord(id);await cancelGoogleBestEffort(id);revalidatePath("/app");revalidatePath("/app/agenda");redirect("/app/agenda?cancelled=1");}
