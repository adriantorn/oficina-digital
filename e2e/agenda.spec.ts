import { expect, test } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { loadLocalEnv } from "../scripts/load-local-env.mjs";
loadLocalEnv(".env.local", ".env.test.local");
const email = process.env.TEST_USER_A_EMAIL, password = process.env.TEST_USER_A_PASSWORD;
const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && email && password);

async function testClient(): Promise<SupabaseClient> {
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false } });
  const { error } = await client.auth.signInWithPassword({ email: email!, password: password! });
  if (error) throw error;
  return client;
}

async function cleanup() {
  if (!configured) return;
  const client = await testClient();
  await client.from("appointments").delete().like("title", "Prueba E2E agenda%");
}

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(email!);
  await page.getByLabel("Contraseña").fill(password!);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/app$/);
}

test.afterEach(cleanup);

test("CRUD y cancelación de agenda real", async ({ page }, testInfo) => {
  test.setTimeout(90_000); test.skip(!configured, "Requiere Supabase"); await cleanup(); await login(page);
  await page.goto("/app/agenda/new");
  await page.locator('input[name="title"]').fill(`Prueba E2E agenda ${testInfo.project.name}`);
  await page.locator('input[name="date"]').fill("2027-02-18");
  await page.locator('input[name="startTime"]').fill("10:00");
  await page.locator('input[name="endTime"]').fill("11:00");
  if (testInfo.project.name === "desktop") await page.screenshot({ path: "docs/screenshots/hito-3/nueva-cita.png", fullPage: true });
  await page.getByRole("button", { name: "Crear cita" }).click();
  await expect(page.getByRole("status")).toContainText("creada correctamente");
  await page.getByRole("link", { name: "Editar" }).click();
  await page.locator('input[name="location"]').fill("Ubicación ficticia");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  const optionalConfirmation = page.getByRole("checkbox");
  if (await optionalConfirmation.isVisible()) {
    await optionalConfirmation.check();
    await page.getByRole("button", { name: "Guardar cambios" }).click();
  }
  await expect(page.getByRole("status")).toContainText("Cambios guardados");
  await expect(page.getByText("Ubicación ficticia")).toBeVisible();
  if (testInfo.project.name === "desktop") await page.screenshot({ path: "docs/screenshots/hito-3/detalle-cita.png", fullPage: true });
  await page.goto("/app/agenda?date=2027-02-18&view=week");
  await expect(page.getByText(`Prueba E2E agenda ${testInfo.project.name}`)).toBeVisible();
  await page.screenshot({ path: `docs/screenshots/hito-3/agenda-${testInfo.project.name}.png`, fullPage: true });
  await page.getByText(`Prueba E2E agenda ${testInfo.project.name}`).click();
  await page.getByRole("button", { name: "Cancelar cita" }).click();
  await expect(page.getByText("Cancelada", { exact: true })).toBeVisible();
});

test("conserva el borrador al confirmar una edición solapada", async ({ page }, testInfo) => {
  test.setTimeout(90_000); test.skip(!configured, "Requiere Supabase"); await cleanup();
  const client = await testClient();
  const marker = `Prueba E2E agenda solape ${testInfo.project.name}`;
  const { data, error } = await client.from("appointments").insert([
    { title: `${marker} editable`, appointment_type: "visit", starts_at: "2027-04-10T08:00:00.000Z", ends_at: "2027-04-10T09:00:00.000Z", time_zone: "Europe/Madrid" },
    { title: `${marker} conflicto`, appointment_type: "meeting", starts_at: "2027-04-12T14:30:00.000Z", ends_at: "2027-04-12T15:30:00.000Z", time_zone: "Europe/Madrid" },
  ]).select("id,title");
  if (error) throw error;
  const editableId = data.find((row) => row.title.endsWith("editable"))!.id;
  await login(page);
  await page.goto(`/app/agenda/${editableId}/edit`);
  await page.locator('input[name="title"]').fill(`${marker} actualizada`);
  await page.locator('input[name="date"]').fill("2027-04-12");
  await page.locator('input[name="startTime"]').fill("16:00");
  await page.locator('input[name="endTime"]').fill("17:00");
  await page.locator('select[name="appointmentType"]').selectOption("meeting");
  await page.locator('input[name="location"]').fill("Ubicación modificada");
  await page.locator('select[name="reminderMinutes"]').selectOption("30");
  await page.locator('textarea[name="description"]').fill("Descripción conservada tras la advertencia");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText(/Ya tienes otra cita|calendario personal figura como ocupado|No se pudo comprobar tu disponibilidad personal/i)).toBeVisible();
  await expect(page.locator('input[name="date"]')).toHaveValue("2027-04-12");
  await expect(page.locator('input[name="startTime"]')).toHaveValue("16:00");
  await expect(page.locator('input[name="endTime"]')).toHaveValue("17:00");
  await expect(page.locator('input[name="title"]')).toHaveValue(`${marker} actualizada`);
  await expect(page.locator('select[name="appointmentType"]')).toHaveValue("meeting");
  await expect(page.locator('input[name="location"]')).toHaveValue("Ubicación modificada");
  await expect(page.locator('select[name="reminderMinutes"]')).toHaveValue("30");
  await expect(page.locator('textarea[name="description"]')).toHaveValue("Descripción conservada tras la advertencia");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page).toHaveURL(new RegExp(`/app/agenda/${editableId}\\?updated=1$`));
  await expect(page.getByRole("status")).toContainText("Cambios guardados");
  await expect(page.getByRole("heading", { name: `${marker} actualizada` })).toBeVisible();
  await expect(page.getByText(/12 de abril de 2027.*16:00/i)).toBeVisible();
  const { data: saved, error: readError } = await client.from("appointments").select("title,starts_at,ends_at,location,description,reminder_minutes").eq("id", editableId).single();
  if (readError) throw readError;
  expect(saved).toMatchObject({ title: `${marker} actualizada`, starts_at: "2027-04-12T14:00:00+00:00", ends_at: "2027-04-12T15:00:00+00:00", location: "Ubicación modificada", description: "Descripción conservada tras la advertencia", reminder_minutes: 30 });
});

test("conserva todos los campos tras un error de validación", async ({ page }, testInfo) => {
  test.setTimeout(60_000); test.skip(!configured, "Requiere Supabase"); await login(page);
  const title = `Prueba E2E agenda validación ${testInfo.project.name}`;
  await page.goto("/app/agenda/new");
  await page.locator('input[name="title"]').fill(title);
  await page.locator('input[name="date"]').fill("2027-05-03");
  await page.locator('input[name="startTime"]').fill("18:00");
  await page.locator('input[name="endTime"]').fill("17:00");
  await page.locator('select[name="appointmentType"]').selectOption("call");
  await page.locator('input[name="location"]').fill("Lugar pendiente");
  await page.locator('select[name="reminderMinutes"]').selectOption("60");
  await page.locator('textarea[name="description"]').fill("Borrador que no debe desaparecer");
  await page.getByRole("button", { name: "Crear cita" }).click();
  await expect(page.getByText("La hora final debe ser posterior a la inicial.")).toBeVisible();
  await expect(page.locator('input[name="title"]')).toHaveValue(title);
  await expect(page.locator('input[name="date"]')).toHaveValue("2027-05-03");
  await expect(page.locator('input[name="startTime"]')).toHaveValue("18:00");
  await expect(page.locator('input[name="endTime"]')).toHaveValue("17:00");
  await expect(page.locator('select[name="appointmentType"]')).toHaveValue("call");
  await expect(page.locator('input[name="location"]')).toHaveValue("Lugar pendiente");
  await expect(page.locator('select[name="reminderMinutes"]')).toHaveValue("60");
  await expect(page.locator('textarea[name="description"]')).toHaveValue("Borrador que no debe desaparecer");
});
