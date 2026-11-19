"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validateAppointment, type AppointmentErrors } from "@/lib/agenda/validation";
import { cancelAppointmentRecord, hasConflict, insertAppointment, updateAppointmentRecord } from "@/lib/data/appointments";
import { isUuid } from "@/lib/contacts/validation";
import { checkGoogleAvailability } from "@/lib/google/availability";
import { cancelGoogleBestEffort, syncAppointmentBestEffort } from "@/lib/google/sync";

export type AppointmentActionState = { message: string; errors?: AppointmentErrors; conflict?: string };

async function save(formData: FormData, id?: string): Promise<AppointmentActionState> {
  const result = validateAppointment(formData);
  if (!result.input) return { message: "Revisa los campos indicados.", errors: result.errors };
  try {
    const [localConflict, google] = await Promise.all([
      hasConflict(result.input.startsAt, result.input.endsAt, id),
      checkGoogleAvailability(result.input.startsAt, result.input.endsAt),
    ]);
    if (formData.get("confirmOverlap") !== "yes") {
      if (localConflict) return { message: "Ya tienes otra cita en ese horario.", conflict: "Confirma que deseas guardar ambas citas." };
      if (google.overlap) return { message: "Tu calendario personal figura como ocupado.", conflict: "Confirma que deseas guardar la cita durante este periodo personal ocupado." };
      if (google.warning) return { message: "No se pudo comprobar tu disponibilidad personal.", conflict: "Google no respondió. Confirma si deseas guardar la cita sin esta comprobación." };
    }
    const savedId = id ? (await updateAppointmentRecord(id, result.input) ? id : null) : await insertAppointment(result.input);
    if (!savedId) return { message: "No se encontró la cita o no tienes permiso." };
    await syncAppointmentBestEffort(savedId);
    revalidatePath("/app"); revalidatePath("/app/agenda");
    redirect(`/app/agenda/${savedId}?${id ? "updated" : "created"}=1`);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    return { message: "No se pudo guardar la cita. Comprueba el contacto y vuelve a intentarlo." };
  }
}

export async function createAppointmentAction(_: AppointmentActionState, formData: FormData) { return save(formData); }
export async function updateAppointmentAction(_: AppointmentActionState, formData: FormData) { const id = String(formData.get("id") || ""); if (!isUuid(id)) return { message: "La cita no es válida." }; return save(formData, id); }
export async function cancelAppointmentAction(formData: FormData) { const id = String(formData.get("id") || ""); if (!isUuid(id)) return; await cancelAppointmentRecord(id); await cancelGoogleBestEffort(id); revalidatePath("/app"); revalidatePath("/app/agenda"); revalidatePath(`/app/agenda/${id}`); redirect(`/app/agenda/${id}?cancelled=1`); }
export async function retryGoogleSyncAction(formData: FormData) { const id = String(formData.get("id") || ""); if (!isUuid(id)) return; await syncAppointmentBestEffort(id); revalidatePath(`/app/agenda/${id}`); redirect(`/app/agenda/${id}?retried=1`); }
