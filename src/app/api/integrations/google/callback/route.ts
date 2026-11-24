import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireUser } from "@/lib/data/auth";
import { resolveOfficeCalendar } from "@/lib/google/calendar";
import { getConnection, saveConnection } from "@/lib/google/connection";
import { resolveOfficeDriveFolders } from "@/lib/google/drive";
import { saveDriveConnection } from "@/lib/google/drive-connection";
import { exchangeGoogleCode } from "@/lib/google/oauth";

export async function GET(request: NextRequest) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const { user } = await requireUser();
  const jar = await cookies();
  const state = request.nextUrl.searchParams.get("state"), code = request.nextUrl.searchParams.get("code");
  const calendarState = jar.get("google_calendar_oauth_state")?.value || jar.get("google_oauth_state")?.value;
  const driveState = jar.get("google_drive_oauth_state")?.value;
  const service = state && state === driveState ? "drive" : state && state === calendarState ? "calendar" : null;
  const verifier = service === "drive" ? jar.get("google_drive_oauth_verifier")?.value : jar.get("google_calendar_oauth_verifier")?.value || jar.get("google_oauth_verifier")?.value;
  if (service === "drive") { jar.delete("google_drive_oauth_state"); jar.delete("google_drive_oauth_verifier"); }
  if (service === "calendar") { jar.delete("google_calendar_oauth_state"); jar.delete("google_calendar_oauth_verifier"); jar.delete("google_oauth_state"); jar.delete("google_oauth_verifier"); }
  if (!code || !state || !service || !verifier) return NextResponse.redirect(new URL("/app/integrations/google?error=state", base));
  try {
    const tokens = await exchangeGoogleCode(code, verifier);
    if (service === "drive") {
      const folders = await resolveOfficeDriveFolders(tokens.access_token);
      await saveDriveConnection(user.id, tokens, folders);
      return NextResponse.redirect(new URL("/app/integrations/google?driveConnected=1", base));
    }
    const previous = await getConnection(user.id);
    const { calendarId, reused } = await resolveOfficeCalendar(tokens.access_token, previous?.calendar_id);
    await saveConnection(user.id, tokens, calendarId);
    return NextResponse.redirect(new URL(`/app/integrations/google?connected=1${reused ? "&reused=1" : ""}`, base));
  } catch {
    return NextResponse.redirect(new URL(service === "drive" ? "/app/integrations/google?driveError=oauth" : "/app/integrations/google?error=oauth", base));
  }
}
