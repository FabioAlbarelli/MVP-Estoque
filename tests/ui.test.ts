// @vitest-environment jsdom
import { it, expect, vi } from "vitest";
vi.mock("qr-scanner", () => ({
  default: class {
    static scanImage = vi.fn();
    start = vi.fn();
    stop = vi.fn();
    destroy = vi.fn();
  },
}));
vi.mock("qrcode", () => ({
  default: { toDataURL: vi.fn(async () => "data:image/png;base64,test") },
}));
it("navega nas três telas sem solicitar câmera e prepara etiqueta com texto seguro", async () => {
  document.body.innerHTML = '<div id="app"></div>';
  Object.defineProperty(HTMLImageElement.prototype, "decode", {
    value: async () => {},
  });
  await import("../src/main");
  const el = (id: string) => document.getElementById(id)!;
  expect(el("menu").hidden).toBe(false);
  expect(el("generate").hidden).toBe(true);
  expect(el("read").hidden).toBe(true);
  (document.querySelector('[data-go="generate"]') as HTMLButtonElement).click();
  expect(el("generate").hidden).toBe(false);
  (el("material") as HTMLInputElement).value = "<b>CELULOSE</b>";
  (el("quantity") as HTMLInputElement).value = "10";
  el("form").dispatchEvent(new Event("submit", { cancelable: true }));
  await vi.waitFor(() =>
    expect(el("preview").querySelector(".label")).not.toBeNull(),
  );
  expect(el("preview").querySelector("h2")!.textContent).toBe(
    "<b>CELULOSE</b>",
  );
  expect(el("print-area").querySelector("img")).not.toBeNull();
  expect((el("print") as HTMLButtonElement).disabled).toBe(false);
  (document.querySelector("#generate .back") as HTMLButtonElement).click();
  expect(el("menu").hidden).toBe(false);
  (document.querySelector('[data-go="read"]') as HTMLButtonElement).click();
  expect(el("read").hidden).toBe(false);
  expect(el("camera").hidden).toBe(true);
  (document.querySelector("#read .back") as HTMLButtonElement).click();
  expect(el("menu").hidden).toBe(false);
  expect(el("camera").hidden).toBe(true);
});
it("libera as tracks ao sair da tela de leitura e só inicia por ação", async () => {
  Object.defineProperty(window, "isSecureContext", {
    value: true,
    configurable: true,
  });
  Object.defineProperty(navigator, "mediaDevices", {
    value: { getUserMedia: vi.fn() },
    configurable: true,
  });
  (document.querySelector('[data-go="read"]') as HTMLButtonElement).click();
  document.getElementById("start")!.click();
  await Promise.resolve();
  const stop = vi.fn();
  const video = document.getElementById("video") as HTMLVideoElement;
  video.srcObject = { getTracks: () => [{ stop }] } as unknown as MediaStream;
  (document.querySelector("#read .back") as HTMLButtonElement).click();
  expect(stop).toHaveBeenCalledOnce();
  expect(video.srcObject).toBeNull();
  expect(document.getElementById("menu")!.hidden).toBe(false);
});
