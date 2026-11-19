import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireUser } from "@/lib/data/auth";
import { googleConfig } from "@/lib/google/config";
import { resolveOfficeCalendar } from "@/lib/google/calendar";
import { getConnection, saveConnection, type TokenResponse } from "@/lib/google/connection";

export async function GET(request: NextRequest) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const { user } = await requireUser();
  const jar = await cookies();
  const state = request.nextUrl.searchParams.get("state"), code = request.nextUrl.searchParams.get("code");
  const expected = jar.get("google_oauth_state")?.value, verifier = jar.get("google_oauth_verifier")?.value;
  jar.delete("google_oauth_state"); jar.delete("google_oauth_verifier");
  if (!code || !state || !expected || state !== expected || !verifier) return NextResponse.redirect(new URL("/app/integrations/google?error=state", base));
  try {
    const config = googleConfig();
    const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: config.clientId!, client_secret: config.clientSecret!, code, code_verifier: verifier, grant_type: "authorization_code", redirect_uri: config.redirectUri }) });
    if (!response.ok) throw new Error("token");
    const tokens = await response.json() as TokenResponse;
    const previous = await getConnection(user.id);
    const { calendarId, reused } = await resolveOfficeCalendar(tokens.access_token, previous?.calendar_id);
    await saveConnection(user.id, tokens, calendarId);
    return NextResponse.redirect(new URL(`/app/integrations/google?connected=1${reused ? "&reused=1" : ""}`, base));
  } catch {
    return NextResponse.redirect(new URL("/app/integrations/google?error=oauth", base));
  }
}
