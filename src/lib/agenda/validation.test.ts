import { describe, expect, it } from "vitest";
import { validateAppointment } from "./validation";

function valid() { const f = new FormData(); Object.entries({ title: "Visita", appointmentType: "visit", date: "2026-11-20", startTime: "10:00", endTime: "11:00", timeZone: "Europe/Madrid", reminderMinutes: "15" }).forEach(([k,v]) => f.set(k,v)); return f; }
describe("validateAppointment", () => {
  it("normaliza una cita válida a UTC", () => { expect(validateAppointment(valid()).input?.startsAt).toBe("2026-11-20T09:00:00.000Z"); });
  it("rechaza intervalos invertidos", () => { const f=valid(); f.set("endTime","09:00"); expect(validateAppointment(f).errors.endTime).toBeTruthy(); });
  it("rechaza horas inexistentes por DST", () => { const f=valid(); f.set("date","2026-03-29"); f.set("startTime","02:30"); expect(validateAppointment(f).errors.startTime).toBeTruthy(); });
});
