import { AppHeader } from "@/components/app-header";
import { ContactForm } from "@/components/contact-form";

export const metadata = { title: "Nuevo contacto" };

export default function NewContactPage() {
  return <main className="app-shell"><AppHeader title="Nuevo contacto" backHref="/app/contacts" /><section className="surface mx-auto mt-6 max-w-3xl rounded-[2rem] p-6 md:p-9"><p className="eyebrow">Alta segura</p><h1 className="mt-2 text-3xl font-black">Crear contacto</h1><p className="muted mt-2">Los datos solo estarán disponibles dentro de tu cuenta.</p><ContactForm /></section></main>;
}
