import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv(".env.local", ".env.test.local");

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "TEST_USER_A_EMAIL",
  "TEST_USER_A_PASSWORD",
  "TEST_USER_B_EMAIL",
  "TEST_USER_B_PASSWORD",
];

const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  throw new Error(`Faltan variables locales: ${missing.join(", ")}`);
}

const options = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
};
const clientA = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  options,
);
const clientB = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  options,
);

let contactA;
let contactB;

async function signIn(client, email, password, label) {
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`${label}: ${error.code || "auth_error"}`);
  assert.ok(data.user, `${label} no obtuvo una sesión`);
  return data.user;
}

try {
  const authResults = await Promise.allSettled([
    signIn(clientA, process.env.TEST_USER_A_EMAIL, process.env.TEST_USER_A_PASSWORD, "usuario A"),
    signIn(clientB, process.env.TEST_USER_B_EMAIL, process.env.TEST_USER_B_PASSWORD, "usuario B"),
  ]);
  const authFailures = authResults
    .filter((result) => result.status === "rejected")
    .map((result) => result.reason instanceof Error ? result.reason.message : "error desconocido");
  if (authFailures.length) throw new Error(`Falló la autenticación: ${authFailures.join(", ")}`);
  const [userA, userB] = authResults.map((result) => result.value);
  assert.notEqual(userA.id, userB.id, "los usuarios de prueba deben ser distintos");
  console.log("PASS autenticación de dos usuarios distintos");

  for (const [client, user, label] of [[clientA, userA, "A"], [clientB, userB, "B"]]) {
    const { data, error } = await client.from("profiles").select("id").eq("id", user.id).single();
    assert.ifError(error);
    assert.equal(data.id, user.id, `perfil ${label} ausente`);
  }
  const { data: foreignProfile, error: foreignProfileError } = await clientA
    .from("profiles").select("id").eq("id", userB.id);
  assert.ifError(foreignProfileError);
  assert.equal(foreignProfile.length, 0, "A pudo leer el perfil de B");
  console.log("PASS creación y privacidad de perfiles");

  const marker = new Date().toISOString();
  const { data: createdA, error: createAError } = await clientA
    .from("contacts")
    .insert({ kind: "seller", first_name: `Prueba RLS A ${marker}` })
    .select("id, owner_id")
    .single();
  assert.ifError(createAError);
  assert.equal(createdA.owner_id, userA.id);
  contactA = createdA.id;
  console.log("PASS A crea un contacto propio");

  const { data: readByB, error: readByBError } = await clientB
    .from("contacts").select("id").eq("id", contactA);
  assert.ifError(readByBError);
  assert.equal(readByB.length, 0, "B pudo leer el contacto de A");

  const { data: updatedByB, error: updateByBError } = await clientB
    .from("contacts").update({ first_name: "Acceso indebido" }).eq("id", contactA).select("id");
  assert.ifError(updateByBError);
  assert.equal(updatedByB.length, 0, "B pudo modificar el contacto de A");

  const { data: deletedByB, error: deleteByBError } = await clientB
    .from("contacts").delete().eq("id", contactA).select("id");
  assert.ifError(deleteByBError);
  assert.equal(deletedByB.length, 0, "B pudo eliminar el contacto de A");

  const { error: spoofOwnerError } = await clientB
    .from("contacts")
    .insert({ owner_id: userA.id, kind: "buyer", first_name: "Propietario falsificado" });
  assert.ok(spoofOwnerError, "B pudo crear un contacto atribuido a A");
  console.log("PASS B no puede leer, modificar, eliminar ni crear para A");

  const { data: createdB, error: createBError } = await clientB
    .from("contacts")
    .insert({ kind: "buyer", first_name: `Prueba RLS B ${marker}` })
    .select("id")
    .single();
  assert.ifError(createBError);
  contactB = createdB.id;
  const { data: readBByA, error: readBByAError } = await clientA
    .from("contacts").select("id").eq("id", contactB);
  assert.ifError(readBByAError);
  assert.equal(readBByA.length, 0, "A pudo leer el contacto de B");
  console.log("PASS aislamiento bidireccional de contactos");

  const { data: readOwnB, error: readOwnBError } = await clientB
    .from("contacts").select("id").eq("id", contactB).single();
  assert.ifError(readOwnBError);
  assert.equal(readOwnB.id, contactB);
  const { data: updatedB, error: updateBError } = await clientB
    .from("contacts").update({ last_name: "Verificado" }).eq("id", contactB).select("id").single();
  assert.ifError(updateBError);
  assert.equal(updatedB.id, contactB);
  console.log("PASS B consulta y modifica sus propios datos");

  const { data: activityA, error: activityAError } = await clientA
    .from("contact_activities")
    .insert({ contact_id: contactA, kind: "note", body: "Nota ficticia de aislamiento" })
    .select("id")
    .single();
  assert.ifError(activityAError);
  const { data: activityReadByB, error: activityReadByBError } = await clientB
    .from("contact_activities").select("id").eq("id", activityA.id);
  assert.ifError(activityReadByBError);
  assert.equal(activityReadByB.length, 0, "B pudo leer la actividad de A");
  const { error: foreignActivityError } = await clientB
    .from("contact_activities")
    .insert({ contact_id: contactA, kind: "note", body: "Intento ficticio ajeno" });
  assert.ok(foreignActivityError, "B pudo crear una actividad en el contacto de A");
  console.log("PASS aislamiento de actividades");

  const { data: updatedA, error: updateAError } = await clientA
    .from("contacts").update({ last_name: "Verificado" }).eq("id", contactA).select("id").single();
  assert.ifError(updateAError);
  assert.equal(updatedA.id, contactA);
  const { data: deletedA, error: deleteAError } = await clientA
    .from("contacts").delete().eq("id", contactA).select("id").single();
  assert.ifError(deleteAError);
  assert.equal(deletedA.id, contactA);
  contactA = undefined;
  console.log("PASS A modifica y elimina sus propios datos");

  const { data: deletedB, error: deleteBError } = await clientB
    .from("contacts").delete().eq("id", contactB).select("id").single();
  assert.ifError(deleteBError);
  assert.equal(deletedB.id, contactB);
  contactB = undefined;
  console.log("PASS B elimina sus propios datos");
} finally {
  if (contactA) await clientA.from("contacts").delete().eq("id", contactA);
  if (contactB) await clientB.from("contacts").delete().eq("id", contactB);
  await Promise.all([clientA.auth.signOut(), clientB.auth.signOut()]);
}

console.log("Supabase remoto verificado sin service_role y sin datos reales.");
