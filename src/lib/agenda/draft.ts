export type AppointmentDraft = {
  title: string; date: string; startTime: string; endTime: string; timeZone: string;
  appointmentType: string; contactId: string; location: string; reminderMinutes: string; description: string;
};

export function appointmentDraftFromFormData(formData: FormData): AppointmentDraft {
  const read = (name: string) => String(formData.get(name) || "");
  return {
    title: read("title"), date: read("date"), startTime: read("startTime"), endTime: read("endTime"),
    timeZone: read("timeZone") || "Europe/Madrid", appointmentType: read("appointmentType"), contactId: read("contactId"),
    location: read("location"), reminderMinutes: read("reminderMinutes"), description: read("description"),
  };
}
