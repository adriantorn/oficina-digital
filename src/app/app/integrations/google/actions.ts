"use server";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/data/auth";
import { disconnectConnection } from "@/lib/google/connection";
import { disconnectDriveConnection } from "@/lib/google/drive-connection";

export async function disconnectGoogle() {
  const { user } = await requireUser();
  await disconnectConnection(user.id);
  redirect("/app/integrations/google?disconnected=1");
}

export async function disconnectDrive() {
  const { user } = await requireUser();
  await disconnectDriveConnection(user.id);
  redirect("/app/integrations/google?driveDisconnected=1");
}
