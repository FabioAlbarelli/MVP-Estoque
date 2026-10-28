import QRCode from "qrcode";
import type { Payload } from "./payload";
export const LABEL_SIZE = { width: 100, height: 50 };
export const qrOptions = {
  margin: 4,
  errorCorrectionLevel: "M" as const,
  width: 640,
  color: { dark: "#000000", light: "#ffffff" },
};
export async function renderLabel(payload: Payload): Promise<HTMLElement> {
  const label = document.createElement("article");
  label.className = "label";
  const text = document.createElement("div");
  text.className = "label-text";
  for (const [tag, content] of [
    ["strong", "DRYBRASIL"],
    ["h2", payload.materia_prima],
    ["p", payload.lote],
    ["b", `${payload.quantidade} ${payload.unidade}`],
    ["small", "TESTE • SEM VALOR DE ESTOQUE"],
  ]) {
    const el = document.createElement(tag);
    el.textContent = content;
    text.append(el);
  }
  const img = document.createElement("img");
  img.alt = `QR Code do lote ${payload.lote}`;
  img.src = await QRCode.toDataURL(JSON.stringify(payload), qrOptions);
  await img.decode();
  label.append(text, img);
  return label;
}
