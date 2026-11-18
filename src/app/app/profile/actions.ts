"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/data/auth";

export async function updateDisplayName(formData: FormData) {
  const displayName = String(formData.get("displayName") || "").trim();
  if (!displayName || displayName.length > 120) redirect("/app/profile?error=name");
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName, updated_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) redirect("/app/profile?error=save");
  revalidatePath("/app");
  revalidatePath("/app/profile");
  redirect("/app/profile?saved=1");
}
