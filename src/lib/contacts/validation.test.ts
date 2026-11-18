import { describe, expect, it } from "vitest";
import { matchesContact, validateContact } from "./validation";
import type { ContactSummary } from "@/lib/types";

const contact: ContactSummary = {
  id: "eacdf99d-a895-4a17-9daf-aa5ecbfee2c0",
  kind: "both",
  firstName: "Lucía",
  lastName: "Martín",
  email: "lucia@example.test",
  phone: "+34 600 123 456",
  updatedAt: "2026-11-17T10:00:00Z",
};

describe("validación de contactos", () => {
  it("normaliza una entrada válida", () => {
    const form = new FormData();
    form.set("firstName", "  Lucía ");
    form.set("lastName", " Martín ");
    form.set("email", "lucia@example.test");
    form.set("phone", "");
    form.set("kind", "both");
    expect(validateContact(form).input).toEqual({ firstName: "Lucía", lastName: "Martín", email: "lucia@example.test", phone: null, kind: "both" });
  });

  it("rechaza nombre vacío, correo inválido y tipo desconocido", () => {
    const form = new FormData();
    form.set("firstName", " ");
    form.set("email", "no-es-un-correo");
    form.set("kind", "admin");
    expect(validateContact(form).errors).toMatchObject({ firstName: expect.any(String), email: expect.any(String), kind: expect.any(String) });
  });
});

describe("búsqueda y filtros", () => {
  it.each(["lucía", "MARTÍN", "example.test", "600 123"])("encuentra por %s", (query) => {
    expect(matchesContact(contact, query, "all")).toBe(true);
  });

  it("incluye el tipo ambos en comprador y vendedor", () => {
    expect(matchesContact(contact, "", "buyer")).toBe(true);
    expect(matchesContact(contact, "", "seller")).toBe(true);
  });

  it("excluye un tipo distinto", () => {
    expect(matchesContact({ ...contact, kind: "buyer" }, "", "seller")).toBe(false);
  });
});
