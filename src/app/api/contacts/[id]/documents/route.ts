import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/data/auth";
import { getContact } from "@/lib/data/contacts";
import { completeDocument, ensureContactDriveFolder, failDocument, reserveDocument } from "@/lib/data/drive";
import { MAX_DOCUMENT_BYTES, validateDocument } from "@/lib/documents/validation";
import { driveAccessToken } from "@/lib/google/drive-connection";
import { uploadDriveFile } from "@/lib/google/drive";

function back(request: NextRequest, contactId: string, query: string) {
  return NextResponse.redirect(new URL(`/app/contacts/${contactId}?${query}`, request.url), 303);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_DOCUMENT_BYTES + 1_000_000) return back(request, id, "uploadError=size");
  const [{ user }, contact] = await Promise.all([requireUser(), getContact(id)]);
  if (!contact) return back(request, id, "uploadError=contact");
  let documentId: string | null = null;
  try {
    const formData = await request.formData();
    const file = formData.get("document");
    if (!(file instanceof File)) return back(request, id, "uploadError=file");
    const validation = validateDocument({ name: file.name, type: file.type, size: file.size });
    if (!validation.value) return back(request, id, `uploadError=${file.size > MAX_DOCUMENT_BYTES ? "size" : "type"}`);
    const valid = validation.value;
    const folder = await ensureContactDriveFolder(user.id, contact);
    if (!folder.driveFolderId) throw new Error("El expediente todavía no está disponible.");
    documentId = await reserveDocument({
      ownerId: user.id, contactId: id, folderId: folder.id, name: valid.name,
      mimeType: valid.mimeType, sizeBytes: valid.size,
      operationReference: String(formData.get("operationReference") || randomUUID()).slice(0, 160),
    });
    const token = await driveAccessToken(user.id);
    const remote = await uploadDriveFile(token, {
      folderId: folder.driveFolderId, documentId, name: valid.name,
      mimeType: valid.mimeType, bytes: new Uint8Array(await file.arrayBuffer()),
    });
    await completeDocument(user.id, documentId, remote.id);
    return back(request, id, "uploaded=1");
  } catch (error) {
    if (documentId) await failDocument(user.id, documentId, error instanceof Error ? error.message : "Error de subida");
    return back(request, id, "uploadError=drive");
  }
}
