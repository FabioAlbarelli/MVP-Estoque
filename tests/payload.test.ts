import { describe, it, expect } from "vitest";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { createPayload, parsePayload } from "../src/payload";
describe("Contrato de dados", () => {
  it("gera e interpreta o mesmo contrato", () => {
    const p = createPayload(" CELULOSE ", "10", 1);
    expect(parsePayload(JSON.stringify(p))).toEqual(p);
    expect(p.lote).toBe("TESTE-001");
  });
  it.each(["0", "-1", "1.5", "", "Infinity", "9007199254740992"])(
    "rejeita quantidade %s",
    (q) => expect(() => createPayload("Teste", q, 1)).toThrow(),
  );
  it.each(["", " ", "a".repeat(61)])("rejeita matéria-prima inválida", (m) =>
    expect(() => createPayload(m, "1", 1)).toThrow(),
  );
  it.each([
    "x",
    "null",
    "{}",
    '{"schema":"outro","version":1}',
    '{"schema":"drybrasil-mp","version":2}',
  ])("rejeita JSON/schema/versão inválidos", (raw) =>
    expect(() => parsePayload(raw)).toThrow(),
  );
  it("rejeita lote e unidade desconhecidos", () => {
    const p = createPayload("Teste", "1", 1);
    for (const change of [{ lote: "OFICIAL" }, { unidade: "KG" }])
      expect(() => parsePayload(JSON.stringify({ ...p, ...change }))).toThrow();
  });
  it("decodifica pixels de um QR realmente gerado", () => {
    const p = createPayload("CELULOSE Á", "10", 1);
    const qr = QRCode.create(JSON.stringify(p), { errorCorrectionLevel: "M" });
    const scale = 6,
      width = (qr.modules.size + 8) * scale;
    const pixels = new Uint8ClampedArray(width * width * 4).fill(255);
    for (let y = 0; y < width; y++)
      for (let x = 0; x < width; x++) {
        const mx = Math.floor(x / scale) - 4,
          my = Math.floor(y / scale) - 4;
        if (
          mx >= 0 &&
          my >= 0 &&
          mx < qr.modules.size &&
          my < qr.modules.size &&
          qr.modules.get(my, mx)
        ) {
          const i = (y * width + x) * 4;
          pixels[i] = pixels[i + 1] = pixels[i + 2] = 0;
        }
      }
    const read = jsQR(pixels, width, width);
    expect(read).not.toBeNull();
    expect(parsePayload(read!.data)).toEqual(p);
  });
});
