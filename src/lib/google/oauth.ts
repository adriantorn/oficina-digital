import "server-only";
import { googleConfig } from "./config";
import type { TokenResponse } from "./connection";

export async function exchangeGoogleCode(code: string, verifier: string) {
  const config = googleConfig();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId!,
      client_secret: config.clientSecret!,
      code,
      code_verifier: verifier,
      grant_type: "authorization_code",
      redirect_uri: config.redirectUri,
    }),
  });
  if (!response.ok) throw new Error("No se pudo completar la autorización de Google.");
  return response.json() as Promise<TokenResponse>;
}

export async function refreshGoogleToken(encryptedRefreshToken: string) {
  const { decryptToken } = await import("./crypto");
  const config = googleConfig();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId!,
      client_secret: config.clientSecret!,
      refresh_token: decryptToken(encryptedRefreshToken),
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) throw new Error("No se pudo renovar la autorización de Google.");
  return response.json() as Promise<TokenResponse>;
}
