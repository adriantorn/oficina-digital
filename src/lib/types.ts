export type ContactKind = "seller" | "buyer" | "both";
export type ActivityKind = "note" | "call" | "visit" | "event";

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

export interface DriveProvider {
  createClientFolder(contactId: string, name: string): Promise<{ externalId: string }>;
}

export interface CalendarProvider {
  createAppointment(input: { title: string; startsAt: string }): Promise<{ externalId: string }>;
}

export interface AiProvider {
  summarize(input: { text: string; locale: string }): Promise<{ summary: string }>;
}
