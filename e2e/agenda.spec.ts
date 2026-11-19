import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { loadLocalEnv } from "../scripts/load-local-env.mjs";
loadLocalEnv(".env.local", ".env.test.local");
const email=process.env.TEST_USER_A_EMAIL, password=process.env.TEST_USER_A_PASSWORD;
const configured=Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY&&email&&password);
async function cleanup(){if(!configured)return;const c=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{auth:{persistSession:false}});if(!(await c.auth.signInWithPassword({email:email!,password:password!})).error)await c.from("appointments").delete().like("title","Prueba E2E agenda%");}
test.afterEach(cleanup);
test("CRUD y cancelación de agenda real",async({page},testInfo)=>{
  test.setTimeout(90_000); test.skip(!configured,"Requiere Supabase"); await cleanup();
  await page.goto("/login"); await page.getByLabel("Correo electrónico").fill(email!); await page.getByLabel("Contraseña").fill(password!); await page.getByRole("button",{name:"Iniciar sesión"}).click(); await expect(page).toHaveURL(/\/app$/);
  await page.goto("/app/agenda/new"); await page.locator('input[name="title"]').fill(`Prueba E2E agenda ${testInfo.project.name}`); await page.locator('input[name="date"]').fill("2027-02-18"); await page.locator('input[name="startTime"]').fill("10:00"); await page.locator('input[name="endTime"]').fill("11:00");
  if(testInfo.project.name==="desktop")await page.screenshot({path:"docs/screenshots/hito-3/nueva-cita.png",fullPage:true});
  await page.getByRole("button",{name:"Crear cita"}).click(); await expect(page.getByRole("status")).toContainText("creada correctamente");
  await page.getByRole("link",{name:"Editar"}).click(); await page.locator('input[name="location"]').fill("Ubicación ficticia"); await page.getByRole("button",{name:"Guardar cambios"}).click(); await expect(page.getByText("Ubicación ficticia")).toBeVisible();
  if(testInfo.project.name==="desktop")await page.screenshot({path:"docs/screenshots/hito-3/detalle-cita.png",fullPage:true});
  await page.goto("/app/agenda?date=2027-02-18&view=week"); await expect(page.getByText(`Prueba E2E agenda ${testInfo.project.name}`)).toBeVisible(); await page.screenshot({path:`docs/screenshots/hito-3/agenda-${testInfo.project.name}.png`,fullPage:true});
  await page.getByText(`Prueba E2E agenda ${testInfo.project.name}`).click(); await page.getByRole("button",{name:"Cancelar cita"}).click(); await expect(page.getByRole("status")).toContainText("cancelada");
});
