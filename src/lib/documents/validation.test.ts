import { describe, expect, it } from "vitest";
import { MAX_DOCUMENT_BYTES, validateDocument } from "./validation";

describe("validateDocument", () => {
  it("acepta PDF, fotos y documentos habituales", () => {
    expect(validateDocument({ name: "contrato.pdf", type: "application/pdf", size: 1200 }).value?.mimeType).toBe("application/pdf");
    expect(validateDocument({ name: "visita.jpg", type: "image/jpeg", size: 1200 }).value?.mimeType).toBe("image/jpeg");
    expect(validateDocument({ name: "encargo.docx", type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 1200 }).value).toBeTruthy();
  });

  it("rechaza ejecutables, archivos vacíos, tipos incoherentes y más de 15 MB", () => {
    expect(validateDocument({ name: "programa.exe", type: "application/octet-stream", size: 10 }).error).toMatch(/Formato/);
    expect(validateDocument({ name: "vacio.pdf", type: "application/pdf", size: 0 }).error).toMatch(/vacío/);
    expect(validateDocument({ name: "falso.pdf", type: "image/jpeg", size: 10 }).error).toMatch(/no coinciden/);
    expect(validateDocument({ name: "grande.pdf", type: "application/pdf", size: MAX_DOCUMENT_BYTES + 1 }).error).toMatch(/15 MB/);
  });

  it("limpia separadores del nombre antes de enviarlo a Drive", () => {
    expect(validateDocument({ name: "carpeta/contrato.pdf", type: "application/pdf", size: 10 }).value?.name).toBe("carpeta-contrato.pdf");
  });
});
