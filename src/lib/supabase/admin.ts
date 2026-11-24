import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/env";
export function createIntegrationAdminClient() { const key = process.env.SUPABASE_SERVICE_ROLE_KEY; if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY no configurada."); return createClient(getSupabaseEnv().url, key, { auth: { persistSession: false, autoRefreshToken: false } }); }
