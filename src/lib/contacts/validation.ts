import type { ContactKind, ContactSummary } from "@/lib/types";

export const contactKinds: ContactKind[] = ["seller", "buyer", "both"];

export type ContactInput = {
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  kind: ContactKind;
};

export type ContactField = "firstName" | "lastName" | "email" | "phone" | "kind";
export type ContactErrors = Partial<Record<ContactField, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateContact(formData: FormData): { input?: ContactInput; errors?: ContactErrors } {
  const firstName = text(formData.get("firstName"));
  const lastName = text(formData.get("lastName"));
  const email = text(formData.get("email"));
  const phone = text(formData.get("phone"));
  const rawKind = text(formData.get("kind"));
  const errors: ContactErrors = {};

  if (!firstName) errors.firstName = "Indica el nombre.";
  else if (firstName.length > 120) errors.firstName = "El nombre no puede superar 120 caracteres.";
  if (lastName.length > 160) errors.lastName = "Los apellidos no pueden superar 160 caracteres.";
  if (email && (!emailPattern.test(email) || email.length > 320)) errors.email = "Introduce un correo válido.";
  if (phone.length > 40) errors.phone = "El teléfono no puede superar 40 caracteres.";
  if (!contactKinds.includes(rawKind as ContactKind)) errors.kind = "Selecciona un tipo válido.";

  if (Object.keys(errors).length) return { errors };
  return {
    input: {
      firstName,
      lastName,
      email: email || null,
      phone: phone || null,
      kind: rawKind as ContactKind,
    },
  };
}

export function matchesContact(contact: ContactSummary, query: string, kind: ContactKind | "all") {
  if (kind !== "all" && contact.kind !== kind && contact.kind !== "both") return false;
  const needle = query.trim().toLocaleLowerCase("es");
  if (!needle) return true;
  return [contact.firstName, contact.lastName, contact.email, contact.phone]
    .filter(Boolean)
    .some((value) => value!.toLocaleLowerCase("es").includes(needle));
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
