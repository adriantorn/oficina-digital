import "server-only";
import { requireUser } from "@/lib/data/auth";
import { isUuid, type ContactInput } from "@/lib/contacts/validation";
import { buildContactSearchFilter, normalizeContactPagination } from "@/lib/contacts/query";
import type { ContactActivity, ContactDetail, ContactKind, ContactSummary } from "@/lib/types";

type ContactRow = {
  id: string;
  kind: ContactKind;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

function toSummary(row: ContactRow): ContactSummary {
  return {
    id: row.id,
    kind: row.kind,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    updatedAt: row.updated_at,
  };
}

export async function listContacts({ query = "", kind = "all", page = 1, pageSize }: { query?: string; kind?: ContactKind | "all"; page?: number; pageSize?: number } = {}) {
  const { supabase, user } = await requireUser();
  const pagination = normalizeContactPagination(page, pageSize);
  const searchFilter = buildContactSearchFilter(query);
  let request = supabase
    .from("contacts")
    .select("id, kind, first_name, last_name, email, phone, created_at, updated_at", { count: "exact" })
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false })
    .order("id", { ascending: true })
    .range(pagination.from, pagination.to);
  if (kind !== "all") request = request.in("kind", [kind, "both"]);
  if (searchFilter) request = request.or(searchFilter);
  const { data, error, count } = await request;
  if (error) throw new Error("No se pudieron cargar los contactos.");
  const total = count ?? 0;
  return {
    contacts: (data as ContactRow[]).map(toSummary),
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: Math.max(1, Math.ceil(total / pagination.pageSize)),
  };
}

export async function getContactsOverview() {
  const { supabase, user } = await requireUser();
  const [{ count, error: countError }, { data, error: recentError }] = await Promise.all([
    supabase.from("contacts").select("id", { count: "exact", head: true }).eq("owner_id", user.id),
    supabase
      .from("contacts")
      .select("id, kind, first_name, last_name, email, phone, created_at, updated_at")
      .eq("owner_id", user.id)
      .order("updated_at", { ascending: false })
      .order("id", { ascending: true })
      .limit(3),
  ]);
  if (countError || recentError) throw new Error("No se pudo cargar el resumen de contactos.");
  return { contactCount: count ?? 0, recentContacts: (data as ContactRow[]).map(toSummary) };
}

export async function getContact(id: string): Promise<ContactDetail | null> {
  if (!isUuid(id)) return null;
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("contacts")
    .select("id, kind, first_name, last_name, email, phone, created_at, updated_at")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (error) throw new Error("No se pudo cargar el contacto.");
  if (!data) return null;
  const row = data as ContactRow;
  return { ...toSummary(row), createdAt: row.created_at };
}

export async function getContactActivities(contactId: string): Promise<ContactActivity[]> {
  if (!isUuid(contactId)) return [];
  const { supabase, user } = await requireUser();
  const [{ data, error }, { data: profile }] = await Promise.all([
    supabase
      .from("contact_activities")
      .select("id, kind, body, occurred_at, author_id")
      .eq("contact_id", contactId)
      .eq("owner_id", user.id)
      .order("occurred_at", { ascending: false }),
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
  ]);
  if (error) throw new Error("No se pudo cargar el historial.");
  const fallback = user.email?.split("@")[0] || "Agente";
  return (data || []).map((row) => ({
    id: row.id,
    kind: row.kind as ContactActivity["kind"],
    body: row.body,
    occurredAt: row.occurred_at,
    authorName: row.author_id === user.id ? profile?.display_name || fallback : "Agente",
  }));
}

export async function insertContact(input: ContactInput) {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("contacts")
    .insert({
      owner_id: user.id,
      kind: input.kind,
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      phone: input.phone,
    })
    .select("id")
    .single();
  if (error) throw new Error("No se pudo crear el contacto.");
  return data.id as string;
}

export async function updateContactRecord(id: string, input: ContactInput) {
  if (!isUuid(id)) return false;
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("contacts")
    .update({
      kind: input.kind,
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      phone: input.phone,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("owner_id", user.id)
    .select("id")
    .maybeSingle();
  if (error) throw new Error("No se pudo actualizar el contacto.");
  return Boolean(data);
}

export async function deleteContactRecord(id: string) {
  if (!isUuid(id)) return false;
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("contacts")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id)
    .select("id")
    .maybeSingle();
  if (error) throw new Error("No se pudo eliminar el contacto.");
  return Boolean(data);
}

export async function insertContactNote(contactId: string, body: string) {
  if (!isUuid(contactId)) return false;
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("contact_activities")
    .insert({ contact_id: contactId, owner_id: user.id, author_id: user.id, kind: "note", body })
    .select("id")
    .maybeSingle();
  if (error) throw new Error("No se pudo guardar la anotación.");
  if (!data) return false;
  await supabase.from("contacts").update({ updated_at: new Date().toISOString() }).eq("id", contactId).eq("owner_id", user.id);
  return true;
}
