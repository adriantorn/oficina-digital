import { Dashboard } from "@/components/dashboard";
import { getCurrentAgent } from "@/lib/data/auth";
import { listContacts } from "@/lib/data/contacts";

export const metadata = { title: "Mi oficina" };

export default async function AppPage() {
  const agent = await getCurrentAgent();
  const contacts = await listContacts();
  return <Dashboard data={{ displayName: agent.displayName, appointments: null, contactCount: contacts.length, recentContacts: contacts.slice(0, 3), isDemo: false }} />;
}
