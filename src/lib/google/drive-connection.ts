import "server-only";
import { createIntegrationAdminClient } from "@/lib/supabase/admin";
import type { DriveConnectionStatus } from "@/lib/types";
import { googleConfig } from "./config";
import { decryptToken, encryptToken } from "./crypto";
import { refreshGoogleToken } from "./oauth";
import type { TokenResponse } from "./connection";

export async function getDriveConnection(ownerId: string) {
  const { data, error } = await createIntegrationAdminClient()
    .from("google_drive_connections")
    .select("*")
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (error) throw new Error("No se pudo consultar la conexión con Drive.");
  return data;
}

export async function driveConnectionStatus(ownerId: string): Promise<DriveConnectionStatus> {
  const config = googleConfig();
  if (!config.configured) return { configured: false, connected: false, status: "disconnected", lastError: null };
  const row = await getDriveConnection(ownerId);
  return {
    configured: true,
    connected: row?.status === "connected",
    status: (row?.status || "disconnected") as DriveConnectionStatus["status"],
    lastError: row?.last_error || null,
  };
}

export async function saveDriveConnection(ownerId: string, tokens: TokenResponse, folders: { rootFolderId: string; clientsFolderId: string }) {
  const current = await getDriveConnection(ownerId);
  const refresh = tokens.refresh_token ? encryptToken(tokens.refresh_token) : current?.encrypted_refresh_token || null;
  const { error } = await createIntegrationAdminClient().from("google_drive_connections").upsert({
    owner_id: ownerId,
    encrypted_access_token: encryptToken(tokens.access_token),
    encrypted_refresh_token: refresh,
    token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    granted_scopes: (tokens.scope || "").split(" ").filter(Boolean),
    root_folder_id: folders.rootFolderId,
    clients_folder_id: folders.clientsFolderId,
    status: "connected",
    last_error: null,
    connected_at: new Date().toISOString(),
    disconnected_at: null,
  });
  if (error) throw new Error("No se pudo guardar la conexión con Drive.");
}

export async function disconnectDriveConnection(ownerId: string) {
  const { error } = await createIntegrationAdminClient().from("google_drive_connections").update({
    encrypted_access_token: null,
    encrypted_refresh_token: null,
    status: "disconnected",
    disconnected_at: new Date().toISOString(),
  }).eq("owner_id", ownerId);
  if (error) throw new Error("No se pudo desconectar Drive.");
}

export async function driveAccessToken(ownerId: string) {
  const row = await getDriveConnection(ownerId);
  if (!row?.encrypted_access_token || row.status !== "connected") throw new Error("Google Drive no está conectado.");
  if (row.token_expires_at && new Date(row.token_expires_at).getTime() > Date.now() + 60_000) return decryptToken(row.encrypted_access_token);
  if (!row.encrypted_refresh_token) throw new Error("La autorización de Drive ha caducado. Vuelve a conectarlo.");
  try {
    const tokens = await refreshGoogleToken(row.encrypted_refresh_token);
    const { error } = await createIntegrationAdminClient().from("google_drive_connections").update({
      encrypted_access_token: encryptToken(tokens.access_token),
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      status: "connected",
      last_error: null,
    }).eq("owner_id", ownerId);
    if (error) throw error;
    return tokens.access_token;
  } catch (error) {
    await createIntegrationAdminClient().from("google_drive_connections").update({
      status: "error",
      last_error: error instanceof Error ? error.message.slice(0, 500) : "No se pudo renovar Drive.",
    }).eq("owner_id", ownerId);
    throw error;
  }
}
