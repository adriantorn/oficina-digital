import { afterEach, describe, expect, it } from "vitest";
import { getSupabaseEnv, hasSupabaseEnv } from "./env";

const original = { ...process.env };
afterEach(() => { process.env = { ...original }; });

describe("configuración de Supabase", () => {
  it("detecta la ausencia de credenciales", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    expect(hasSupabaseEnv()).toBe(false);
    expect(() => getSupabaseEnv()).toThrow(/Falta configurar Supabase/);
  });
});
