import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { ContactForm } from "@/components/contact-form";
import { getContact } from "@/lib/data/contacts";

export const metadata = { title: "Editar contacto" };

export default async function EditContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contact = await getContact(id);
  if (!contact) notFound();
  return <main className="app-shell"><AppHeader title="Editar contacto" backHref={`/app/contacts/${contact.id}`} /><section className="surface mx-auto mt-6 max-w-3xl rounded-[2rem] p-6 md:p-9"><p className="eyebrow">Datos del contacto</p><h1 className="mt-2 text-3xl font-black">Editar {contact.firstName}</h1><ContactForm contact={contact} /></section></main>;
}
