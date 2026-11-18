import { describe, expect, it } from "vitest";
import { dashboardDisplayName } from "./profile";

describe("nombre visible del escritorio", () => {
  it("usa el nombre de pila configurado", () => {
    expect(dashboardDisplayName("Adrián Torn", "cuenta@example.test")).toBe("Adrián");
  });

  it("evita mostrar identificadores derivados del correo", () => {
    expect(dashboardDisplayName("adriantornavacas", "adriantornavacas@example.test")).toBe("Agente");
  });

  it("aplica un fallback corto a nombres vacíos o excesivos", () => {
    expect(dashboardDisplayName(null, "cuenta@example.test")).toBe("Agente");
    expect(dashboardDisplayName("IdentificadorDemasiadoLargoParaMovil", "cuenta@example.test")).toBe("Agente");
  });
});
