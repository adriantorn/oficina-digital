import { Dashboard } from "@/components/dashboard";
import { getCurrentAgent } from "@/lib/data/auth";
import { getContactsOverview } from "@/lib/data/contacts";
import { getAgendaOverview } from "@/lib/data/appointments";

export const metadata = { title: "Mi oficina" };

export default async function AppPage() {
  const agent = await getCurrentAgent();
  const [overview, agenda] = await Promise.all([getContactsOverview(), getAgendaOverview()]);
  return <Dashboard data={{ displayName: agent.displayName, ...overview, ...agenda, isDemo: false }} />;
}
