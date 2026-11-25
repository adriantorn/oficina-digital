"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validateContact, isUuid, type ContactErrors } from "@/lib/contacts/validation";
import { deleteContactRecord, insertContact, insertContactNote, updateContactRecord } from "@/lib/data/contacts";
import { ensureContactDriveFolder } from "@/lib/data/drive";
import { requireUser } from "@/lib/data/auth";
import { getContact } from "@/lib/data/contacts";

export type ContactActionState = {
  message: string;
  errors?: ContactErrors;
};

export type NoteActionState = { message: string };

export async function createContactAction(_: ContactActionState, formData: FormData): Promise<ContactActionState> {
  const result = validateContact(formData);
  if (!result.input) return { message: "Revisa los campos indicados.", errors: result.errors };
  let id: string;
  try {
    id = await insertContact(result.input);
  } catch {
    return { message: "No se pudo crear el contacto. Inténtalo de nuevo." };
  }
  revalidatePath("/app");
  revalidatePath("/app/contacts");
  redirect(`/app/contacts/${id}?created=1`);
}

export async function updateContactAction(_: ContactActionState, formData: FormData): Promise<ContactActionState> {
  const id = String(formData.get("id") || "");
  if (!isUuid(id)) return { message: "El contacto no es válido." };
  const result = validateContact(formData);
  if (!result.input) return { message: "Revisa los campos indicados.", errors: result.errors };
  try {
    if (!(await updateContactRecord(id, result.input))) return { message: "No se encontró el contacto o no tienes permiso." };
  } catch {
    return { message: "No se pudo actualizar el contacto. Inténtalo de nuevo." };
  }
  revalidatePath("/app");
  revalidatePath("/app/contacts");
  revalidatePath(`/app/contacts/${id}`);
  redirect(`/app/contacts/${id}?updated=1`);
}

export async function deleteContactAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!isUuid(id)) return;
  try {
    if (!(await deleteContactRecord(id))) return;
  } catch {
    return;
  }
  revalidatePath("/app");
  revalidatePath("/app/contacts");
  redirect("/app/contacts?deleted=1");
}

export async function addNoteAction(_: NoteActionState, formData: FormData): Promise<NoteActionState> {
  const id = String(formData.get("id") || "");
  const body = String(formData.get("body") || "").trim();
  if (!isUuid(id)) return { message: "El contacto no es válido." };
  if (!body) return { message: "Escribe una anotación." };
  if (body.length > 10000) return { message: "La anotación no puede superar 10.000 caracteres." };
  try {
    if (!(await insertContactNote(id, body))) return { message: "No se encontró el contacto o no tienes permiso." };
  } catch {
    return { message: "No se pudo guardar la anotación. Inténtalo de nuevo." };
  }
  revalidatePath("/app");
  revalidatePath(`/app/contacts/${id}`);
  redirect(`/app/contacts/${id}?noted=1`);
}

export async function activateDriveFolderAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!isUuid(id)) redirect("/app/contacts?driveError=invalid");
  let ok = false;
  try {
    const [{ user }, contact] = await Promise.all([requireUser(), getContact(id)]);
    if (contact) {
      await ensureContactDriveFolder(user.id, contact);
      ok = true;
    }
  } catch {
    ok = false;
  }
  revalidatePath(`/app/contacts/${id}`);
  redirect(`/app/contacts/${id}?${ok ? "driveFolder=1" : "driveError=1"}`);
}
