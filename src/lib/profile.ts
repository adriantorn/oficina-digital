export function dashboardDisplayName(displayName: string | null | undefined, email: string | null | undefined) {
  const name = displayName?.trim();
  const emailName = email?.split("@")[0]?.trim().toLocaleLowerCase("es");
  if (!name || name.toLocaleLowerCase("es") === emailName) return "Agente";
  const firstName = name.split(/\s+/)[0];
  return firstName.length <= 24 ? firstName : "Agente";
}
