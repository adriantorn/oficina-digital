import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { loadLocalEnv } from "../scripts/load-local-env.mjs";

loadLocalEnv(".env.local", ".env.test.local");

const email = process.env.TEST_USER_A_EMAIL;
const password = process.env.TEST_USER_A_PASSWORD;
const configured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
  email &&
  password,
);

async function cleanupFictitiousContacts(projectName: string) {
  if (!configured) return;
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: authError } = await client.auth.signInWithPassword({ email: email!, password: password! });
  if (!authError) await client.from("contacts").delete().like("first_name", `Prueba ${projectName}-%`);
}

test.afterEach(async ({}, testInfo) => {
  await cleanupFictitiousContacts(testInfo.project.name);
});

test("CRUD, búsqueda, filtros e historial de contactos reales", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  test.skip(!configured, "Requiere Supabase y usuario ficticio local");
  const suffix = `${testInfo.project.name}-${Date.now()}`;
  const firstName = `Prueba ${suffix}`;
  const lastName = "Ambos";
  const fullName = `${firstName} ${lastName}`;
  const note = `Conversación ficticia ${suffix}`;

  await cleanupFictitiousContacts(testInfo.project.name);

  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(email!);
  await page.getByLabel("Contraseña").fill(password!);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/app$/);

  if (testInfo.project.name === "desktop") {
    await page.screenshot({ path: "docs/screenshots/hito-2/escritorio-inicio.png", fullPage: true });
  } else {
    await page.screenshot({ path: "docs/screenshots/hito-2/movil-inicio.png", fullPage: true });
  }

  await page.getByRole("link", { name: "Nuevo contacto" }).click();
  await page.locator('input[name="firstName"]').fill(firstName);
  await page.locator('input[name="lastName"]').fill(lastName);
  await page.locator('input[name="email"]').fill(`${suffix}@example.test`);
  await page.locator('input[name="phone"]').fill("+34 600 000 000");
  await page.getByLabel("Ambos").check();
  if (testInfo.project.name === "desktop") {
    await page.screenshot({ path: "docs/screenshots/hito-2/nuevo-contacto.png", fullPage: true });
  }
  await page.getByRole("button", { name: "Crear contacto" }).click();
  await expect(page.getByRole("heading", { name: fullName })).toBeVisible();
  await expect(page.getByRole("status")).toContainText("creado correctamente");

  await page.getByLabel("Nueva anotación").fill(note);
  await page.getByRole("button", { name: "Añadir al historial" }).click();
  await expect(page.getByRole("listitem").getByText(note, { exact: true })).toBeVisible();
  if (testInfo.project.name === "desktop") {
    await page.screenshot({ path: "docs/screenshots/hito-2/contacto-historial.png", fullPage: true });
  }

  await page.getByRole("link", { name: "Editar" }).click();
  await page.locator('input[name="phone"]').fill("+34 611 111 111");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("+34 611 111 111", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Volver" }).click();
  await page.getByLabel("Buscar por nombre, teléfono o correo").fill(suffix);
  await page.getByRole("button", { name: "Buscar" }).click();
  await expect(page.getByRole("heading", { name: fullName })).toBeVisible();

  await page.getByRole("link", { name: "Vendedores" }).click();
  await expect(page.getByRole("heading", { name: fullName })).toBeVisible();
  await page.getByRole("link", { name: "Compradores" }).click();
  await expect(page.getByRole("heading", { name: fullName })).toBeVisible();
  if (testInfo.project.name === "mobile") {
    await page.screenshot({ path: "docs/screenshots/hito-2/movil-contactos.png", fullPage: true });
  }

  await page.getByRole("heading", { name: fullName }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Eliminar contacto" }).click();
  await expect(page).toHaveURL(/\/app\/contacts\?deleted=1$/);
  await expect(page.getByRole("status")).toContainText("eliminado correctamente");
});
