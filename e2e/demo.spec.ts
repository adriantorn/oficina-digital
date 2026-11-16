import { expect, test } from "@playwright/test";

test("la demo carga y distingue sus datos", async ({ page }, testInfo) => {
  await page.goto("/demo");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Alex");
  await expect(page.getByRole("status")).toContainText("datos de esta vista son ficticios");
  await expect(page.getByRole("navigation", { name: "Navegación principal" })).toBeVisible();
  await page.screenshot({ path: `docs/screenshots/inicio-${testInfo.project.name}.png`, fullPage: true });
});

test("los accesos futuros no simulan funcionalidad", async ({ page }) => {
  await page.goto("/demo");
  await expect(page.getByRole("button", { name: /Nuevo cliente/ })).toBeDisabled();
});

test("el tema elegido persiste al recargar", async ({ page }) => {
  await page.goto("/demo");
  await page.evaluate(() => localStorage.setItem("oficina-theme", "light"));
  await page.reload();
  await page.getByRole("button", { name: "Cambiar tema de color" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("sin credenciales, una ruta real vuelve a la demo sin fallar", async ({ page }) => {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByRole("status")).toContainText("Modo demostración");
});

test("la vista es navegable con teclado y no desborda horizontalmente", async ({ page }) => {
  await page.goto("/demo");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Cambiar tema de color" })).toBeFocused();
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Navegación principal" })).toBeVisible();
});

test("la demostración no transmite datos ni realiza escrituras", async ({ page }) => {
  const unexpectedRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    const isLocal = ["localhost", "127.0.0.1"].includes(url.hostname);
    if (!isLocal || !["GET", "HEAD"].includes(request.method())) {
      unexpectedRequests.push(`${request.method()} ${request.url()}`);
    }
  });
  await page.goto("/demo");
  await expect(page.getByRole("status")).toContainText("datos de esta vista son ficticios");
  expect(unexpectedRequests).toEqual([]);
});
