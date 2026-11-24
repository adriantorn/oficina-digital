import { describe, expect, it } from "vitest";
import { appointmentDraftFromFormData } from "./draft";

describe("borrador de cita", () => {
  it("conserva íntegros todos los valores enviados", () => {
    const formData = new FormData();
    const values = { title: "Visita modificada", date: "2027-04-12", startTime: "16:30", endTime: "17:45", timeZone: "Europe/Madrid", appointmentType: "meeting", contactId: "11111111-1111-4111-8111-111111111111", location: "Oficina nueva", reminderMinutes: "30", description: "Notas actualizadas" };
    Object.entries(values).forEach(([name, value]) => formData.set(name, value));
    expect(appointmentDraftFromFormData(formData)).toEqual(values);
  });
});
