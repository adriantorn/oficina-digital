import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/data/auth";
import { getDocumentDriveId } from "@/lib/data/drive";
import { driveAccessToken } from "@/lib/google/drive-connection";
import { getDriveWebViewLink } from "@/lib/google/drive";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await requireUser();
  const driveFileId = await getDocumentDriveId(user.id, id);
  if (!driveFileId) return NextResponse.redirect(new URL("/app/contacts", request.url));
  try {
    return NextResponse.redirect(await getDriveWebViewLink(await driveAccessToken(user.id), driveFileId));
  } catch {
    return NextResponse.redirect(new URL("/app/contacts", request.url));
  }
}
