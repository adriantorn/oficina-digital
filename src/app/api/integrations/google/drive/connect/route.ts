import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/data/auth";
import { googleConfig, GOOGLE_DRIVE_SCOPES } from "@/lib/google/config";

export async function GET() {
  await requireUser();
  const config = googleConfig(), base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  if (!config.configured) return NextResponse.redirect(new URL("/app/integrations/google?driveError=config", base));
  const state = randomBytes(32).toString("base64url"), verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url"), jar = await cookies();
  const options = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600 };
  jar.set("google_drive_oauth_state", state, options);
  jar.set("google_drive_oauth_verifier", verifier, options);
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({ client_id: config.clientId!, redirect_uri: config.redirectUri, response_type: "code", scope: GOOGLE_DRIVE_SCOPES.join(" "), access_type: "offline", prompt: "consent", include_granted_scopes: "true", state, code_challenge: challenge, code_challenge_method: "S256" }).toString();
  return NextResponse.redirect(url);
}
