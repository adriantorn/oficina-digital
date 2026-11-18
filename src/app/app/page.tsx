import { Dashboard } from "@/components/dashboard";
import { getCurrentAgent } from "@/lib/data/auth";
import { getContactsOverview } from "@/lib/data/contacts";

export const metadata = { title: "Mi oficina" };

export default async function AppPage() {
  const agent = await getCurrentAgent();
  const overview = await getContactsOverview();
  return <Dashboard data={{ displayName: agent.displayName, appointments: null, ...overview, isDemo: false }} />;
}
