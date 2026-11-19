export type ContactKind = "seller" | "buyer" | "both";
export type ActivityKind = "note" | "call" | "visit" | "event";
export type AppointmentType = "visit" | "valuation" | "call" | "meeting" | "other";
export type AppointmentStatus = "scheduled" | "cancelled" | "completed";
export type AppointmentSyncStatus = "local" | "pending" | "synced" | "error";

export interface Profile {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface DashboardData {
  displayName: string;
  appointments: number | null;
  contactCount: number;
  recentContacts: ContactSummary[];
  nextAppointment?: AppointmentSummary | null;
  upcomingAppointments?: AppointmentSummary[];
  reminderAppointment?: AppointmentSummary | null;
  isDemo: boolean;
}

export interface ContactSummary {
  id: string;
  kind: ContactKind;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  updatedAt: string;
}

export interface ContactDetail extends ContactSummary {
  createdAt: string;
}

export interface ContactActivity {
  id: string;
  kind: ActivityKind;
  body: string;
  occurredAt: string;
  authorName: string;
}

export interface AppointmentSummary {
  id: string;
  title: string;
  appointmentType: AppointmentType;
  startsAt: string;
  endsAt: string;
  timeZone: string;
  status: AppointmentStatus;
  reminderMinutes: number | null;
  contactId: string | null;
  contactName: string | null;
  location: string | null;
  googleSyncStatus: AppointmentSyncStatus;
}

export interface AppointmentDetail extends AppointmentSummary {
  description: string | null;
  googleEventId: string | null;
  googleEventEtag: string | null;
  googleSyncError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BusyBlock {
  startsAt: string;
  endsAt: string;
  source: "google";
}

export interface CalendarConnectionStatus {
  configured: boolean;
  connected: boolean;
  status: "connected" | "disconnected" | "error";
  calendarId: string | null;
  lastError: string | null;
}

export interface DriveProvider {
  createClientFolder(contactId: string, name: string): Promise<{ externalId: string }>;
}

export interface CalendarProvider {
  getBusyBlocks(input: { timeMin: string; timeMax: string; timeZone: string }): Promise<BusyBlock[]>;
  syncAppointment(appointment: AppointmentDetail): Promise<{ externalId: string; etag: string | null }>;
  cancelAppointment(appointment: AppointmentDetail): Promise<void>;
}

export interface AiProvider {
  summarize(input: { text: string; locale: string }): Promise<{ summary: string }>;
}
