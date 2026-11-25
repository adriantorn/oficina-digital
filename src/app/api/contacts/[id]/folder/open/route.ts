import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/data/auth";
import { getContactDriveFolder } from "@/lib/data/drive";
import { driveAccessToken } from "@/lib/google/drive-connection";
import { getDriveWebViewLink } from "@/lib/google/drive";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await requireUser();
  const folder = await getContactDriveFolder(id);
  if (!folder?.driveFolderId || folder.status !== "ready") return NextResponse.redirect(new URL(`/app/contacts/${id}?driveError=1`, request.url));
  try {
    const link = await getDriveWebViewLink(await driveAccessToken(user.id), folder.driveFolderId);
    return NextResponse.redirect(link);
  } catch {
    return NextResponse.redirect(new URL(`/app/contacts/${id}?driveError=1`, request.url));
  }
}
