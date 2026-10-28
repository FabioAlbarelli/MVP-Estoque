export interface Payload {
  schema: "drybrasil-mp";
  version: 1;
  lote: string;
  materia_prima: string;
  quantidade: number;
  unidade: "BOBINA";
}
export function parsePayload(raw: string): Payload {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error("QR Code inválido: o conteúdo não é JSON.");
  }
  if (!value || typeof value !== "object") throw new Error("Dados inválidos.");
  const p = value as Record<string, unknown>;
  if (p.schema !== "drybrasil-mp" || p.version !== 1)
    throw new Error("Schema ou versão não suportados.");
  if (
    typeof p.materia_prima !== "string" ||
    !p.materia_prima.trim() ||
    p.materia_prima.length > 60 ||
    typeof p.lote !== "string" ||
    !/^TESTE-[0-9]{3,}$/.test(p.lote) ||
    !Number.isSafeInteger(p.quantidade) ||
    (p.quantidade as number) <= 0 ||
    p.unidade !== "BOBINA"
  )
    throw new Error(
      "Dados da etiqueta inválidos. Use matéria-prima de até 60 caracteres e quantidade inteira positiva.",
    );
  return {
    schema: "drybrasil-mp",
    version: 1,
    lote: p.lote,
    materia_prima: p.materia_prima.trim(),
    quantidade: p.quantidade as number,
    unidade: "BOBINA",
  };
}
export function createPayload(
  material: string,
  quantity: string,
  sequence: number,
): Payload {
  if (!/^\d+$/.test(quantity))
    throw new Error("Informe uma quantidade inteira positiva.");
  return parsePayload(
    JSON.stringify({
      schema: "drybrasil-mp",
      version: 1,
      lote: `TESTE-${String(sequence).padStart(3, "0")}`,
      materia_prima: material.trim(),
      quantidade: Number(quantity),
      unidade: "BOBINA",
    }),
  );
}
