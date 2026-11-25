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
  "SUPABASE_SERVICE_ROLE_KEY",
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
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
);

let contactA;
let contactB;
let appointmentA;
let appointmentB;
let driveFolderA;
let driveFolderB;

async function signIn(client, email, password, label) {
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`${label}: ${error.code || error.message || "auth_error"}`);
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

  const { data: driveFolders, error: driveFoldersError } = await admin.from("contact_drive_folders").insert([
    { owner_id: userA.id, contact_id: contactA, drive_folder_id: `test-folder-a-${Date.now()}`, folder_name: "Expediente ficticio A", status: "ready" },
    { owner_id: userB.id, contact_id: contactB, drive_folder_id: `test-folder-b-${Date.now()}`, folder_name: "Expediente ficticio B", status: "ready" },
  ]).select("id,owner_id,contact_id");
  assert.ifError(driveFoldersError);
  driveFolderA = driveFolders.find((row) => row.owner_id === userA.id).id;
  driveFolderB = driveFolders.find((row) => row.owner_id === userB.id).id;
  const { error: documentsError } = await admin.from("contact_documents").insert([
    { owner_id: userA.id, contact_id: contactA, folder_id: driveFolderA, drive_file_id: `test-file-a-${Date.now()}`, name: "Documento ficticio A.pdf", mime_type: "application/pdf", size_bytes: 100, status: "ready" },
    { owner_id: userB.id, contact_id: contactB, folder_id: driveFolderB, drive_file_id: `test-file-b-${Date.now()}`, name: "Documento ficticio B.pdf", mime_type: "application/pdf", size_bytes: 100, status: "ready" },
  ]);
  assert.ifError(documentsError);
  for (const [client, ownContact, foreignContact, label] of [
    [clientA, contactA, contactB, "A"],
    [clientB, contactB, contactA, "B"],
  ]) {
    for (const table of ["contact_drive_folders", "contact_documents"]) {
      const { data: own, error: ownError } = await client.from(table).select("id").eq("contact_id", ownContact);
      assert.ifError(ownError);
      assert.equal(own.length, 1, `${label} no pudo consultar su propio registro en ${table}`);
      const { data: foreign, error: foreignError } = await client.from(table).select("id").eq("contact_id", foreignContact);
      assert.ifError(foreignError);
      assert.equal(foreign.length, 0, `${label} pudo consultar registros ajenos en ${table}`);
    }
    const { error: connectionsReadError } = await client.from("google_drive_connections").select("owner_id");
    assert.ok(connectionsReadError, `${label} pudo leer la tabla de conexiones de Drive`);
  }
  const { error: clientInsertFolderError } = await clientA.from("contact_drive_folders").insert({ contact_id: contactA, folder_name: "Intento cliente" });
  assert.ok(clientInsertFolderError, "el navegador pudo crear metadatos de Drive directamente");
  const { error: clientUpdateDocumentError } = await clientB.from("contact_documents").update({ name: "Ataque.pdf" }).eq("contact_id", contactA);
  assert.ok(clientUpdateDocumentError, "B pudo modificar documentos de A");
  console.log("PASS RLS de expedientes, documentos y conexiones de Drive entre dos agentes");

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
  const { data: activityUpdatedByB, error: activityUpdatedByBError } = await clientB
    .from("contact_activities").update({ body: "Modificación ajena" }).eq("id", activityA.id).select("id");
  assert.ifError(activityUpdatedByBError);
  assert.equal(activityUpdatedByB.length, 0, "B pudo modificar la actividad de A");
  const { data: activityDeletedByB, error: activityDeletedByBError } = await clientB
    .from("contact_activities").delete().eq("id", activityA.id).select("id");
  assert.ifError(activityDeletedByBError);
  assert.equal(activityDeletedByB.length, 0, "B pudo eliminar la actividad de A");
  const { error: foreignActivityError } = await clientB
    .from("contact_activities")
    .insert({ contact_id: contactA, kind: "note", body: "Intento ficticio ajeno" });
  assert.ok(foreignActivityError, "B pudo crear una actividad en el contacto de A");
  const { data: activityB, error: activityBError } = await clientB
    .from("contact_activities")
    .insert({ contact_id: contactB, kind: "note", body: "Nota ficticia propia de B" })
    .select("id")
    .single();
  assert.ifError(activityBError);
  const { data: activityBReadByA, error: activityBReadByAError } = await clientA
    .from("contact_activities").select("id").eq("id", activityB.id);
  assert.ifError(activityBReadByAError);
  assert.equal(activityBReadByA.length, 0, "A pudo leer la actividad de B");
  const { data: ownActivityUpdated, error: ownActivityUpdatedError } = await clientB
    .from("contact_activities").update({ body: "Nota ficticia actualizada por B" }).eq("id", activityB.id).select("id").single();
  assert.ifError(ownActivityUpdatedError);
  assert.equal(ownActivityUpdated.id, activityB.id);
  const { data: ownActivityDeleted, error: ownActivityDeletedError } = await clientB
    .from("contact_activities").delete().eq("id", activityB.id).select("id").single();
  assert.ifError(ownActivityDeletedError);
  assert.equal(ownActivityDeleted.id, activityB.id);
  console.log("PASS aislamiento bidireccional y CRUD propio de actividades");

  const appointmentPayload = (contactId, suffix) => ({
    contact_id: contactId, title: `Prueba agenda ${suffix} ${marker}`,
    appointment_type: "visit", starts_at: "2027-01-15T09:00:00.000Z",
    ends_at: "2027-01-15T10:00:00.000Z", time_zone: "Europe/Madrid",
  });
  const { data: createdAppointmentA, error: appointmentAError } = await clientA.from("appointments").insert(appointmentPayload(contactA, "A")).select("id,owner_id").single();
  assert.ifError(appointmentAError); appointmentA = createdAppointmentA.id; assert.equal(createdAppointmentA.owner_id, userA.id);
  const { data: createdAppointmentB, error: appointmentBError } = await clientB.from("appointments").insert(appointmentPayload(contactB, "B")).select("id,owner_id").single();
  assert.ifError(appointmentBError); appointmentB = createdAppointmentB.id; assert.equal(createdAppointmentB.owner_id, userB.id);
  const { data: foreignAppointmentRead, error: foreignAppointmentReadError } = await clientB.from("appointments").select("id").eq("id", appointmentA);
  assert.ifError(foreignAppointmentReadError); assert.equal(foreignAppointmentRead.length, 0, "B pudo leer la cita de A");
  const { data: foreignAppointmentUpdate, error: foreignAppointmentUpdateError } = await clientB.from("appointments").update({ title: "Acceso indebido" }).eq("id", appointmentA).select("id");
  assert.ifError(foreignAppointmentUpdateError); assert.equal(foreignAppointmentUpdate.length, 0, "B pudo modificar la cita de A");
  const { data: foreignAppointmentDelete, error: foreignAppointmentDeleteError } = await clientB.from("appointments").delete().eq("id", appointmentA).select("id");
  assert.ifError(foreignAppointmentDeleteError); assert.equal(foreignAppointmentDelete.length, 0, "B pudo eliminar la cita de A");
  const { error: foreignContactAppointmentError } = await clientB.from("appointments").insert(appointmentPayload(contactA, "contacto ajeno"));
  assert.ok(foreignContactAppointmentError, "B pudo vincular una cita al contacto de A");
  const { data: ownAppointmentUpdate, error: ownAppointmentUpdateError } = await clientB.from("appointments").update({ location: "Ubicación ficticia" }).eq("id", appointmentB).select("id").single();
  assert.ifError(ownAppointmentUpdateError); assert.equal(ownAppointmentUpdate.id, appointmentB);
  const { data: ownAppointmentDelete, error: ownAppointmentDeleteError } = await clientB.from("appointments").delete().eq("id", appointmentB).select("id").single();
  assert.ifError(ownAppointmentDeleteError); appointmentB = undefined; assert.ok(ownAppointmentDelete.id);
  console.log("PASS aislamiento bidireccional, contacto propio y CRUD de citas");

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
  if (appointmentA) await clientA.from("appointments").delete().eq("id", appointmentA);
  if (appointmentB) await clientB.from("appointments").delete().eq("id", appointmentB);
  if (driveFolderA) await admin.from("contact_drive_folders").delete().eq("id", driveFolderA);
  if (driveFolderB) await admin.from("contact_drive_folders").delete().eq("id", driveFolderB);
  if (contactA) await clientA.from("contacts").delete().eq("id", contactA);
  if (contactB) await clientB.from("contacts").delete().eq("id", contactB);
  await Promise.all([clientA.auth.signOut(), clientB.auth.signOut()]);
}

console.log("Supabase remoto verificado con clientes autenticados; service_role se usó solo en este script de servidor para preparar y limpiar metadatos ficticios.");
