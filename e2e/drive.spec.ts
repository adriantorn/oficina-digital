import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { loadLocalEnv } from "../scripts/load-local-env.mjs";

loadLocalEnv(".env.local", ".env.test.local");
const email = process.env.TEST_USER_A_EMAIL, password = process.env.TEST_USER_A_PASSWORD;
const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && email && password);

async function client() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false } });
  const { error } = await supabase.auth.signInWithPassword({ email: email!, password: password! });
  if (error) throw error;
  return supabase;
}

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(email!);
  await page.getByLabel("Contraseña").fill(password!);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/app$/);
}

test("expediente y documentos son accesibles en escritorio y móvil", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  test.skip(!configured, "Requiere Supabase y usuario ficticio local");
  const supabase = await client();
  const marker = `Prueba Drive ${testInfo.project.name} ${Date.now()}`;
  const { data, error } = await supabase.from("contacts").insert({ first_name: marker, last_name: "Ficticio", kind: "buyer" }).select("id").single();
  if (error) throw error;
  try {
    await login(page);
    await page.goto(`/app/contacts/${data.id}`);
    await expect(page.getByRole("heading", { name: "Documentos" })).toBeVisible();
    const connect = page.getByRole("link", { name: "Conectar Google Drive" });
    const activate = page.getByRole("button", { name: "Activar expediente" });
    const upload = page.getByRole("button", { name: "Subir a Drive" });
    await expect(connect.or(activate)).toBeVisible();
    if (await activate.isVisible()) await expect(upload).toBeVisible();
    await page.screenshot({ path: `docs/screenshots/hito-4/contacto-documentos-${testInfo.project.name}.png`, fullPage: true });
    await page.goto("/app/profile");
    await page.getByRole("link", { name: "Integraciones de Google" }).click();
    await expect(page.getByRole("heading", { name: "Google Calendar" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Google Drive" })).toBeVisible();
    await page.screenshot({ path: `docs/screenshots/hito-4/integraciones-${testInfo.project.name}.png`, fullPage: true });
  } finally {
    await supabase.from("contacts").delete().eq("id", data.id);
  }
});
