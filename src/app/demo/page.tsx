import { Dashboard } from "@/components/dashboard";

export const metadata = { title: "Demostración" };

export default function DemoPage() {
  return <Dashboard data={{ displayName: "Alex", appointments: 3, pending: 2, isDemo: true }} />;
}
