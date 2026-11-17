import { expect, test } from "@playwright/test";
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

test("login, sesión persistente, perfil y logout reales", async ({ page }) => {
  test.skip(!configured, "Requiere Supabase y usuario ficticio local");

  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(email!);
  await page.getByLabel("Contraseña").fill(password!);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL(/\/app$/);
  await page.getByRole("link", { name: "Ver perfil" }).click();
  await expect(page).toHaveURL(/\/app\/profile$/);
  await expect(page.getByText(email!, { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/login$/);
});
