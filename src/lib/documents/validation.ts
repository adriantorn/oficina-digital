export const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;

const allowed = new Map<string, string>([
  ["pdf", "application/pdf"],
  ["jpg", "image/jpeg"], ["jpeg", "image/jpeg"], ["png", "image/png"], ["webp", "image/webp"],
  ["heic", "image/heic"], ["heif", "image/heif"],
  ["doc", "application/msword"], ["docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ["xls", "application/vnd.ms-excel"], ["xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  ["odt", "application/vnd.oasis.opendocument.text"], ["ods", "application/vnd.oasis.opendocument.spreadsheet"],
  ["txt", "text/plain"],
]);

export const DOCUMENT_ACCEPT = [...allowed.entries()].map(([extension, mime]) => `.${extension},${mime}`).join(",");

type DocumentValidation =
  | { value: { name: string; mimeType: string; size: number }; error?: never }
  | { error: string; value?: never };

export function validateDocument(input: { name: string; type: string; size: number }): DocumentValidation {
  const name = input.name.replace(/[\\/\u0000-\u001f\u007f]/g, "-").trim();
  const extension = name.split(".").pop()?.toLowerCase() || "";
  const expectedMime = allowed.get(extension);
  if (!name || name.length > 280) return { error: "El nombre del archivo no es válido." };
  if (!expectedMime) return { error: "Formato no admitido. Usa PDF, imagen, documento de texto u hoja de cálculo." };
  if (!Number.isFinite(input.size) || input.size <= 0) return { error: "El archivo está vacío." };
  if (input.size > MAX_DOCUMENT_BYTES) return { error: "El archivo supera el límite de 15 MB." };
  const mimeType = input.type === "application/octet-stream" || !input.type ? expectedMime : input.type;
  if (mimeType !== expectedMime) return { error: "La extensión y el tipo del archivo no coinciden." };
  return { value: { name, mimeType, size: input.size } };
}
