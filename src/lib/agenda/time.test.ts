import { describe, expect, it } from "vitest";
import { localDateRangeUtc, startOfWeek, zonedDateTimeToUtc } from "./time";

describe("agenda y zona horaria Europe/Madrid", () => {
  it("convierte correctamente horario de invierno y verano", () => {
    expect(zonedDateTimeToUtc("2026-01-15", "10:00", "Europe/Madrid")).toBe("2026-01-15T09:00:00.000Z");
    expect(zonedDateTimeToUtc("2026-07-15", "10:00", "Europe/Madrid")).toBe("2026-07-15T08:00:00.000Z");
  });

  it("rechaza una hora inexistente durante el cambio a horario de verano", () => {
    expect(zonedDateTimeToUtc("2026-03-29", "02:30", "Europe/Madrid")).toBeNull();
  });

  it("calcula días de 23 y 25 horas alrededor de los cambios horarios", () => {
    const spring = localDateRangeUtc("2026-03-29", "Europe/Madrid");
    const autumn = localDateRangeUtc("2026-10-25", "Europe/Madrid");
    expect(new Date(spring.end).getTime() - new Date(spring.start).getTime()).toBe(23 * 60 * 60 * 1000);
    expect(new Date(autumn.end).getTime() - new Date(autumn.start).getTime()).toBe(25 * 60 * 60 * 1000);
  });

  it("inicia la semana en lunes", () => {
    expect(startOfWeek("2026-11-19")).toBe("2026-11-16");
    expect(startOfWeek("2026-11-22")).toBe("2026-11-16");
  });
});
