import { describe, expect, it } from "vitest";
import { buildContactSearchFilter, normalizeContactPagination } from "./query";

describe("consulta paginada de contactos", () => {
  it("calcula rangos sin solapamientos", () => {
    expect(normalizeContactPagination(1, 12)).toEqual({ page: 1, pageSize: 12, from: 0, to: 11 });
    expect(normalizeContactPagination(2, 12)).toEqual({ page: 2, pageSize: 12, from: 12, to: 23 });
  });

  it("corrige páginas y tamaños fuera de rango", () => {
    expect(normalizeContactPagination(Number.NaN, 500)).toEqual({ page: 1, pageSize: 50, from: 0, to: 49 });
  });

  it("crea una búsqueda OR para los cuatro campos y escapa valores reservados", () => {
    const filter = buildContactSearchFilter(' María, "Casa"_100% ');
    expect(filter).toContain('first_name.ilike."*María, \\"Casa\\"\\_100\\%*"');
    expect(filter?.match(/\.ilike\./g)).toHaveLength(4);
    expect(filter).toContain("email.ilike");
    expect(filter).toContain("phone.ilike");
  });

  it("omite el filtro cuando la búsqueda está vacía", () => {
    expect(buildContactSearchFilter("   ")).toBeNull();
  });
});
