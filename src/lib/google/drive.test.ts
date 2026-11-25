import { afterEach, describe, expect, it, vi } from "vitest";
import { listDriveFolderDocuments, resolveContactDriveFolder, resolveOfficeDriveFolders, uploadDriveFile } from "./drive";

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

afterEach(() => vi.unstubAllGlobals());

describe("Google Drive", () => {
  const folder = { mimeType: "application/vnd.google-apps.folder", appProperties: { oficinaDigitalContactId: "contact" } };
  const pdf = { id: "pdf", name: "Original.pdf", mimeType: "application/pdf", webViewLink: "https://drive.google.com/file/d/pdf/view" };
  const native = { id: "native", name: "Notas", mimeType: "application/vnd.google-apps.document", webViewLink: "https://docs.google.com/document/d/native/edit" };

  it("recorre todas las páginas y usa el estado de Drive al volver a consultar", async () => {
    const renamed = { ...pdf, name: "Renombrado.pdf" };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(folder))
      .mockResolvedValueOnce(response({ files: [pdf], nextPageToken: "next" }))
      .mockResolvedValueOnce(response({ files: [], nextPageToken: "last" }))
      .mockResolvedValueOnce(response({ files: [pdf, native] }))
      .mockResolvedValueOnce(response(folder))
      .mockResolvedValueOnce(response({ files: [renamed] }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(listDriveFolderDocuments("token", "folder", "contact")).resolves.toEqual([pdf, native]);
    await expect(listDriveFolderDocuments("token", "folder", "contact")).resolves.toEqual([renamed]);
    const query = new URL(String(fetchMock.mock.calls[2][0])).searchParams;
    expect(query.get("q")).toContain("'folder' in parents and trashed = false");
    expect(query.get("pageToken")).toBe("next");
    expect(fetchMock.mock.calls.every(([, options]) => options.cache === "no-store" && !options.method)).toBe(true);
  });

  it("rechaza una carpeta de otro expediente antes de listar archivos", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(response(folder));
    vi.stubGlobal("fetch", fetchMock);
    await expect(listDriveFolderDocuments("token", "folder", "other-contact")).rejects.toMatchObject({ status: 404 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([[403, {}], [200, { incompleteSearch: true }]])("rechaza una lista parcial cuando falla una página (%s)", async (status, body) => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(response(folder))
      .mockResolvedValueOnce(response({ files: [pdf], nextPageToken: "next" }))
      .mockResolvedValueOnce(response(body, status)));
    await expect(listDriveFolderDocuments("token", "folder", "contact")).rejects.toThrow();
  });

  it("descarta enlaces que no abren en Drive o Docs", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(response(folder))
      .mockResolvedValueOnce(response({ files: [{ ...pdf, webViewLink: "https://drive.google.com.example.test/" }] })));
    await expect(listDriveFolderDocuments("token", "folder", "contact")).resolves.toMatchObject([{ id: pdf.id, webViewLink: undefined }]);
  });

  it("crea la jerarquía raíz una sola vez y la reutiliza al reconectar", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({ files: [] }))
      .mockResolvedValueOnce(response({ id: "root-1", name: "Oficina Digital" }))
      .mockResolvedValueOnce(response({ files: [] }))
      .mockResolvedValueOnce(response({ id: "clients-1", name: "Clientes" }))
      .mockResolvedValueOnce(response({ files: [{ id: "root-1", name: "Oficina Digital" }] }))
      .mockResolvedValueOnce(response({ files: [{ id: "clients-1", name: "Clientes" }] }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(resolveOfficeDriveFolders("token")).resolves.toEqual({ rootFolderId: "root-1", clientsFolderId: "clients-1" });
    await expect(resolveOfficeDriveFolders("token")).resolves.toEqual({ rootFolderId: "root-1", clientsFolderId: "clients-1" });
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(2);
  });

  it("reutiliza el expediente por ID de contacto", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ files: [{ id: "folder-1", name: "Cliente Ficticio" }] }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(resolveContactDriveFolder("token", "clients", "contact-1", "Cliente Ficticio")).resolves.toEqual({ id: "folder-1", name: "Cliente Ficticio" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("distingue dos contactos con el mismo nombre mediante sus IDs internos", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({ files: [] })).mockResolvedValueOnce(response({ id: "folder-a", name: "Álex García" }))
      .mockResolvedValueOnce(response({ files: [] })).mockResolvedValueOnce(response({ id: "folder-b", name: "Álex García" }));
    vi.stubGlobal("fetch", fetchMock);
    await resolveContactDriveFolder("token", "clients", "contact-a", "Álex García");
    await resolveContactDriveFolder("token", "clients", "contact-b", "Álex García");
    const bodies = fetchMock.mock.calls.filter(([, init]) => init?.method === "POST").map(([, init]) => JSON.parse(String(init?.body)));
    expect(bodies.map((body) => body.appProperties.oficinaDigitalContactId)).toEqual(["contact-a", "contact-b"]);
  });

  it("reintenta fallos temporales al subir y conserva el identificador documental", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(response({}, 503)).mockResolvedValueOnce(response({ id: "file-1", name: "contrato.pdf", mimeType: "application/pdf" }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(uploadDriveFile("token", { folderId: "folder", documentId: "doc-1", name: "contrato.pdf", mimeType: "application/pdf", bytes: new Uint8Array([1, 2, 3]) })).resolves.toMatchObject({ id: "file-1" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][1]?.body)).toContain("doc-1");
  });
});
