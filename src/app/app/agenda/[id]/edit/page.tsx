import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { AppointmentForm } from "@/components/appointment-form";
import { getAppointment } from "@/lib/data/appointments";
import { listContacts } from "@/lib/data/contacts";
export default async function EditAppointment({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const [a, { contacts }] = await Promise.all([getAppointment(id), listContacts({ pageSize: 100 })]); if (!a) notFound(); return <main className="app-shell"><AppHeader title="Editar cita" backHref={`/app/agenda/${id}`} /><section className="surface mx-auto mt-6 max-w-3xl rounded-[2rem] p-6 md:p-9"><h1 className="text-3xl font-black">Editar cita</h1><AppointmentForm appointment={a} contacts={contacts} /></section></main>; }
