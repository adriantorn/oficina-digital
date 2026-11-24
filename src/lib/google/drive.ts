import "server-only";

const DRIVE_API = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_API = "https://www.googleapis.com/upload/drive/v3";
const FOLDER_MIME = "application/vnd.google-apps.folder";

export class GoogleDriveError extends Error {
  constructor(message: string, public status: number, public retryable = false) { super(message); }
}

async function request(url: string, init: RequestInit, attempts = 3) {
  let response: Response | null = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    response = await fetch(url, init);
    if (response.ok || ![429, 500, 502, 503, 504].includes(response.status)) return response;
    if (attempt < attempts - 1) await new Promise((resolve) => setTimeout(resolve, 75 * 2 ** attempt));
  }
  return response!;
}

function escapeQuery(value: string) { return value.replaceAll("\\", "\\\\").replaceAll("'", "\\'"); }

async function findFolder(token: string, key: string, value: string, parentId?: string) {
  const clauses = [
    `mimeType = '${FOLDER_MIME}'`,
    "trashed = false",
    `appProperties has { key='${escapeQuery(key)}' and value='${escapeQuery(value)}' }`,
  ];
  if (parentId) clauses.push(`'${escapeQuery(parentId)}' in parents`);
  const params = new URLSearchParams({ q: clauses.join(" and "), spaces: "drive", pageSize: "2", fields: "files(id,name)" });
  const response = await request(`${DRIVE_API}/files?${params}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new GoogleDriveError("No se pudo buscar la carpeta en Drive.", response.status, response.status >= 500 || response.status === 429);
  const data = await response.json() as { files?: { id: string; name: string }[] };
  return data.files?.[0] || null;
}

async function createFolder(token: string, name: string, appProperties: Record<string, string>, parentId?: string) {
  const response = await request(`${DRIVE_API}/files?fields=id,name`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ name, mimeType: FOLDER_MIME, appProperties, ...(parentId ? { parents: [parentId] } : {}) }),
  });
  if (!response.ok) throw new GoogleDriveError("No se pudo crear la carpeta en Drive.", response.status, response.status >= 500 || response.status === 429);
  return response.json() as Promise<{ id: string; name: string }>;
}

async function resolveFolder(token: string, input: { name: string; key: string; value: string; parentId?: string }) {
  return await findFolder(token, input.key, input.value, input.parentId)
    || await createFolder(token, input.name, { [input.key]: input.value }, input.parentId);
}

export async function resolveOfficeDriveFolders(token: string) {
  const root = await resolveFolder(token, { name: "Oficina Digital", key: "oficinaDigitalRoot", value: "v1" });
  const clients = await resolveFolder(token, { name: "Clientes", key: "oficinaDigitalClients", value: "v1", parentId: root.id });
  return { rootFolderId: root.id, clientsFolderId: clients.id };
}

export async function resolveContactDriveFolder(token: string, clientsFolderId: string, contactId: string, contactName: string) {
  return resolveFolder(token, {
    name: contactName,
    key: "oficinaDigitalContactId",
    value: contactId,
    parentId: clientsFolderId,
  });
}

export async function uploadDriveFile(token: string, input: { folderId: string; documentId: string; name: string; mimeType: string; bytes: Uint8Array }) {
  const boundary = `oficina_digital_${crypto.randomUUID().replaceAll("-", "")}`;
  const metadata = JSON.stringify({
    name: input.name,
    parents: [input.folderId],
    appProperties: { oficinaDigitalDocumentId: input.documentId },
  });
  const prefix = Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${input.mimeType}\r\n\r\n`);
  const suffix = Buffer.from(`\r\n--${boundary}--`);
  const body = Buffer.concat([prefix, Buffer.from(input.bytes), suffix]);
  const response = await request(`${DRIVE_UPLOAD_API}/files?uploadType=multipart&fields=id,name,mimeType,size,createdTime`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "content-type": `multipart/related; boundary=${boundary}` },
    body,
  });
  if (!response.ok) throw new GoogleDriveError("No se pudo subir el documento a Drive.", response.status, response.status >= 500 || response.status === 429);
  return response.json() as Promise<{ id: string; name: string; mimeType: string; size?: string; createdTime?: string }>;
}

export async function getDriveWebViewLink(token: string, fileId: string) {
  const response = await request(`${DRIVE_API}/files/${encodeURIComponent(fileId)}?fields=webViewLink,trashed`, {
    headers: { Authorization: `Bearer ${token}` },
  }, 1);
  if (!response.ok) throw new GoogleDriveError("No se pudo abrir el elemento de Drive.", response.status);
  const data = await response.json() as { webViewLink?: string; trashed?: boolean };
  if (data.trashed || !data.webViewLink) throw new GoogleDriveError("El elemento ya no está disponible en Drive.", 404);
  return data.webViewLink;
}
