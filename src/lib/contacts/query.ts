export const CONTACTS_PAGE_SIZE = 12;

export function normalizeContactPagination(page: number, pageSize = CONTACTS_PAGE_SIZE) {
  const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
  const safePageSize = Number.isFinite(pageSize) ? Math.min(50, Math.max(1, Math.floor(pageSize))) : CONTACTS_PAGE_SIZE;
  const from = (safePage - 1) * safePageSize;
  return { page: safePage, pageSize: safePageSize, from, to: from + safePageSize - 1 };
}

export function buildContactSearchFilter(query: string) {
  const escaped = query
    .trim()
    .slice(0, 200)
    .replaceAll("\\", "\\\\")
    .replaceAll('"', '\\"')
    .replaceAll("%", "\\%")
    .replaceAll("_", "\\_");
  if (!escaped) return null;
  const pattern = `"*${escaped}*"`;
  return ["first_name", "last_name", "email", "phone"].map((field) => `${field}.ilike.${pattern}`).join(",");
}
