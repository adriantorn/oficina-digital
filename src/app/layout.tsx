import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Oficina Digital", template: "%s · Oficina Digital" },
  description: "Tu trabajo, más sencillo.",
};

export const viewport: Viewport = { themeColor: "#236D70", colorScheme: "light dark" };

const themeScript = `(()=>{try{const t=localStorage.getItem('oficina-theme');const v=t==='dark'||t==='light'?t:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=v}catch{}})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>{children}</body>
    </html>
  );
}
