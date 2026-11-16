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
  pending: number | null;
  isDemo: boolean;
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
