import "server-only";
import { requireUser } from "@/lib/data/auth";
import { createIntegrationAdminClient } from "@/lib/supabase/admin";
import type { ContactDetail, ContactDocument, ContactDriveFolder } from "@/lib/types";
import { driveAccessToken, getDriveConnection } from "@/lib/google/drive-connection";
import { resolveContactDriveFolder } from "@/lib/google/drive";

type FolderRow = {
  id: string;
  contact_id: string;
  drive_folder_id: string | null;
  folder_name: string;
  status: ContactDriveFolder["status"];
  last_error: string | null;
};

function toFolder(row: FolderRow): ContactDriveFolder {
  return { id: row.id, contactId: row.contact_id, driveFolderId: row.drive_folder_id, folderName: row.folder_name, status: row.status, lastError: row.last_error };
}

export async function getContactDriveFolder(contactId: string) {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase.from("contact_drive_folders")
    .select("id, contact_id, drive_folder_id, folder_name, status, last_error")
    .eq("contact_id", contactId).eq("owner_id", user.id).maybeSingle();
  if (error) throw new Error("No se pudo consultar el expediente.");
  return data ? toFolder(data as FolderRow) : null;
}

export async function listContactDocuments(contactId: string): Promise<ContactDocument[]> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase.from("contact_documents")
    .select("id, contact_id, name, mime_type, size_bytes, source, uploaded_at")
    .eq("contact_id", contactId).eq("owner_id", user.id).eq("status", "ready")
    .order("created_at", { ascending: false });
  if (error) throw new Error("No se pudieron cargar los documentos.");
  return (data || []).map((row) => ({
    id: row.id, contactId: row.contact_id, name: row.name, mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes), source: row.source as ContactDocument["source"], uploadedAt: row.uploaded_at,
  }));
}

async function adminFolder(ownerId: string, contactId: string) {
  const { data, error } = await createIntegrationAdminClient().from("contact_drive_folders")
    .select("id, contact_id, drive_folder_id, folder_name, status, last_error")
    .eq("owner_id", ownerId).eq("contact_id", contactId).maybeSingle();
  if (error) throw new Error("No se pudo consultar el expediente.");
  return data as FolderRow | null;
}

export async function ensureContactDriveFolder(ownerId: string, contact: ContactDetail) {
  const connection = await getDriveConnection(ownerId);
  if (connection?.status !== "connected" || !connection.clients_folder_id) throw new Error("Conecta Google Drive antes de activar el expediente.");
  const folderName = `${contact.firstName} ${contact.lastName}`.trim().slice(0, 280);
  const admin = createIntegrationAdminClient();
  const { data: claimed, error: claimError } = await admin.rpc("claim_contact_drive_folder", {
    p_owner_id: ownerId, p_contact_id: contact.id, p_folder_name: folderName,
  });
  if (claimError) throw new Error("No se pudo reservar el expediente.");
  if (!claimed) {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const existing = await adminFolder(ownerId, contact.id);
      if (existing?.status === "ready" && existing.drive_folder_id) return toFolder(existing);
      if (existing?.status === "error") throw new Error(existing.last_error || "No se pudo crear el expediente.");
      await new Promise((resolve) => setTimeout(resolve, 100 * (attempt + 1)));
    }
    throw new Error("El expediente se está creando. Vuelve a intentarlo en unos segundos.");
  }
  const reserved = await adminFolder(ownerId, contact.id);
  if (!reserved) throw new Error("No se pudo reservar el expediente.");
  try {
    const token = await driveAccessToken(ownerId);
    const remote = await resolveContactDriveFolder(token, connection.clients_folder_id, contact.id, folderName);
    const { data, error } = await admin.from("contact_drive_folders").update({
      drive_folder_id: remote.id, folder_name: remote.name, status: "ready", last_error: null,
    }).eq("id", reserved.id).eq("owner_id", ownerId).select("id, contact_id, drive_folder_id, folder_name, status, last_error").single();
    if (error) throw new Error("No se pudo vincular la carpeta creada.");
    return toFolder(data as FolderRow);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear el expediente.";
    await admin.from("contact_drive_folders").update({ status: "error", last_error: message.slice(0, 500) }).eq("id", reserved.id).eq("owner_id", ownerId);
    throw new Error(message);
  }
}

export async function reserveDocument(input: { ownerId: string; contactId: string; folderId: string; name: string; mimeType: string; sizeBytes: number; operationReference: string }) {
  const { data, error } = await createIntegrationAdminClient().from("contact_documents").insert({
    owner_id: input.ownerId, contact_id: input.contactId, folder_id: input.folderId,
    name: input.name, mime_type: input.mimeType, size_bytes: input.sizeBytes,
    source: "manual", operation_reference: input.operationReference, status: "creating",
  }).select("id").single();
  if (error) throw new Error("No se pudo preparar la subida.");
  return data.id as string;
}

export async function completeDocument(ownerId: string, documentId: string, driveFileId: string) {
  const { error } = await createIntegrationAdminClient().from("contact_documents").update({
    drive_file_id: driveFileId, status: "ready", last_error: null, uploaded_at: new Date().toISOString(),
  }).eq("id", documentId).eq("owner_id", ownerId);
  if (error) throw new Error("El archivo se subió, pero no se pudo guardar su referencia.");
}

export async function failDocument(ownerId: string, documentId: string, message: string) {
  await createIntegrationAdminClient().from("contact_documents").update({ status: "error", last_error: message.slice(0, 500) })
    .eq("id", documentId).eq("owner_id", ownerId);
}

export async function getDocumentDriveId(ownerId: string, documentId: string) {
  const { data, error } = await createIntegrationAdminClient().from("contact_documents")
    .select("drive_file_id").eq("id", documentId).eq("owner_id", ownerId).eq("status", "ready").maybeSingle();
  if (error || !data?.drive_file_id) return null;
  return data.drive_file_id as string;
}
