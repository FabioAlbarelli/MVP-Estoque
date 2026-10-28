import QrScanner from "qr-scanner";
import { createPayload, parsePayload, type Payload } from "./payload";
import { LABEL_SIZE, renderLabel } from "./label";
import { Reader } from "./reader";
import "./style.css";
const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `<header><span class="brand">DRYBRASIL</span><span>Laboratório de etiquetas</span></header><main><div class="intro"><p class="eyebrow">PROVA DE CONCEITO · QR CODE</p><h1>Identifique. Imprima. Leia.</h1><p>Etiquetas de matéria-prima para simulação. Sem registro de estoque.</p></div><section id="menu"><button data-go="generate" class="card"><span>01 / CRIAR</span><strong>Gerar etiqueta →</strong><small>Prepare e imprima um QR Code de teste.</small></button><button data-go="read" class="card"><span>02 / CONFERIR</span><strong>Ler etiqueta →</strong><small>Use a câmera ou selecione uma imagem.</small></button></section><section id="generate" hidden><button class="back">← Voltar ao menu</button><h2>Gerar etiqueta</h2><div class="columns"><form id="form"><label>Matéria-prima<input id="material" required maxlength="60" placeholder="Ex.: CELULOSE"></label><label>Quantidade<input id="quantity" type="number" required min="1" step="1" inputmode="numeric" placeholder="Ex.: 10"></label><label>Unidade<input value="BOBINA" readonly></label><p>Lote de teste automático a cada geração.</p><button type="submit">Gerar QR Code</button></form><div><h3>Prévia da etiqueta · 100 × 50 mm</h3><div id="preview" class="preview">Sua etiqueta aparecerá aqui.</div><button id="print" disabled>Imprimir etiqueta</button></div></div></section><section id="read" hidden><button class="back">← Voltar ao menu</button><h2>Ler etiqueta</h2><p>A leitura acontece no dispositivo. Nenhuma imagem é enviada.</p><div class="actions"><button id="start">Iniciar leitura</button><button id="close" class="secondary">Fechar câmera</button><label class="file">Ler imagem<input id="image" type="file" accept="image/*"></label></div><div id="camera" hidden><video id="video" muted playsinline></video></div><div id="result" aria-live="polite"></div></section><p id="status" role="status" aria-live="polite"></p></main><footer>DRY-QR-MVP-001 · Dados fictícios · Processamento local</footer><div id="print-area"></div>`;
const $ = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const status = (message: string) => {
  $("status").textContent = message;
};
const fail = (e: unknown) => {
  const name = e instanceof Error ? e.name : "";
  status(
    name === "NotAllowedError"
      ? "Permissão da câmera negada. Autorize nas configurações do navegador."
      : name === "NotFoundError"
        ? "Nenhuma câmera disponível."
        : name === "NotReadableError"
          ? "Câmera ocupada ou indisponível."
          : e === "Camera not found."
            ? "Não foi possível abrir a câmera. Verifique a permissão do navegador, a existência de uma câmera e se outro aplicativo está usando-a."
            : e instanceof Error
              ? e.message
              : "Não foi possível ler o QR Code. Verifique a imagem e tente novamente.",
  );
};
const showResult = (p: Payload) => {
  $("camera").hidden = true;
  $("result").replaceChildren();
  for (const line of [
    p.materia_prima,
    `${p.quantidade} ${p.unidade}`,
    p.lote,
    "Etiqueta de teste • sem valor de estoque",
  ]) {
    const el = document.createElement("p");
    el.textContent = line;
    $("result").append(el);
  }
  $("start").textContent = "Ler novamente";
  status("Etiqueta identificada.");
};
const reader = new Reader(
  (callback) => {
    const video = $<HTMLVideoElement>("video");
    const scanner = new QrScanner(video, (result) => callback(result.data), {
      preferredCamera: "environment",
      returnDetailedScanResult: true,
      highlightScanRegion: true,
      highlightCodeOutline: true,
    });
    return {
      start: () => scanner.start(),
      stop: () => {
        scanner.stop();
        const stream = video.srcObject as MediaStream | null;
        stream?.getTracks().forEach((track) => track.stop());
        video.srcObject = null;
      },
      destroy: () => {
        scanner.destroy();
        scanner.$overlay?.remove();
      },
    };
  },
  showResult,
  fail,
);
let screen = "menu";
let sequence = 1;
let imageEpoch = 0;
function closeCamera() {
  reader.close();
  $("camera").hidden = true;
}
function navigate(target: string) {
  closeCamera();
  ++imageEpoch;
  screen = target;
  for (const id of ["menu", "generate", "read"]) $(id).hidden = id !== target;
  status("");
}
document
  .querySelectorAll<HTMLButtonElement>("[data-go]")
  .forEach((button) => (button.onclick = () => navigate(button.dataset.go!)));
document
  .querySelectorAll<HTMLButtonElement>(".back")
  .forEach((button) => (button.onclick = () => navigate("menu")));
$("close").onclick = () => {
  closeCamera();
  status("Câmera encerrada.");
};
$("start").onclick = async () => {
  ++imageEpoch;
  if (!window.isSecureContext) {
    status(
      "A câmera exige HTTPS confiável no celular ou localhost no computador. Use uma imagem como alternativa.",
    );
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    status("Navegador sem suporte à câmera. Use uma imagem.");
    return;
  }
  $("result").replaceChildren();
  status("Aguardando câmera. Aponte para uma etiqueta.");
  $("camera").hidden = false;
  await reader.start();
};
$<HTMLInputElement>("image").onchange = async (event) => {
  closeCamera();
  const epoch = ++imageEpoch;
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    const result = await QrScanner.scanImage(file, {
      returnDetailedScanResult: true,
    });
    const payload = parsePayload(result.data);
    if (epoch === imageEpoch && screen === "read") showResult(payload);
  } catch (e) {
    if (epoch === imageEpoch && screen === "read") fail(e);
  } finally {
    input.value = "";
  }
};
$<HTMLFormElement>("form").onsubmit = async (event) => {
  event.preventDefault();
  const submit = document.querySelector<HTMLButtonElement>("[type=submit]")!;
  submit.disabled = true;
  try {
    const payload = createPayload(
      $<HTMLInputElement>("material").value,
      $<HTMLInputElement>("quantity").value,
      sequence,
    );
    const label = await renderLabel(payload);
    sequence++;
    $("preview").replaceChildren(label);
    $("print-area").replaceChildren(label.cloneNode(true));
    $<HTMLButtonElement>("print").disabled = false;
    status(`Lote ${payload.lote} preparado.`);
  } catch (e) {
    fail(e);
  } finally {
    submit.disabled = false;
  }
};
$("print").onclick = () => window.print();
const printStyle = document.createElement("style");
printStyle.textContent = `:root { --label-width: ${LABEL_SIZE.width}mm; --label-height: ${LABEL_SIZE.height}mm; } @page { size: ${LABEL_SIZE.width}mm ${LABEL_SIZE.height}mm; margin: 0; }`;
document.head.append(printStyle);
window.addEventListener("pagehide", () => {
  closeCamera();
  ++imageEpoch;
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    closeCamera();
    ++imageEpoch;
  }
});
