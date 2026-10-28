import { it, expect, vi } from "vitest";
import { Reader } from "../src/reader";
import { createPayload } from "../src/payload";
it("impede inicialização simultânea, rejeita inválidos e ignora duplicatas", async () => {
  let callback!: (s: string) => void;
  const scanner = {
    start: vi.fn(async () => {}),
    stop: vi.fn(),
    destroy: vi.fn(),
  };
  const result = vi.fn(),
    error = vi.fn();
  const reader = new Reader(
    (cb) => {
      callback = cb;
      return scanner;
    },
    result,
    error,
  );
  await Promise.all([reader.start(), reader.start()]);
  expect(scanner.start).toHaveBeenCalledTimes(1);
  callback("inválido");
  expect(error).toHaveBeenCalledOnce();
  expect(result).not.toHaveBeenCalled();
  const raw = JSON.stringify(createPayload("Teste", "1", 1));
  callback(raw);
  callback(raw);
  expect(result).toHaveBeenCalledOnce();
  expect(scanner.stop).toHaveBeenCalled();
  expect(scanner.destroy).toHaveBeenCalled();
  await reader.start();
  callback(raw);
  expect(result).toHaveBeenCalledTimes(2);
});
it("encerra inicialização pendente e ignora callback tardio", async () => {
  let resolve!: () => void, callback!: (s: string) => void;
  const scanner = {
    start: () =>
      new Promise<void>((r) => {
        resolve = r;
      }),
    stop: vi.fn(),
    destroy: vi.fn(),
  };
  const result = vi.fn();
  const factory = vi.fn((cb) => {
    callback = cb;
    return scanner;
  });
  const reader = new Reader(factory, result, vi.fn());
  const pending = reader.start();
  reader.close();
  await reader.start();
  expect(factory).toHaveBeenCalledOnce();
  resolve();
  await pending;
  callback(JSON.stringify(createPayload("Teste", "1", 1)));
  expect(result).not.toHaveBeenCalled();
  expect(scanner.stop).toHaveBeenCalledTimes(2);
});
it("trata falha e permite tentar novamente", async () => {
  const error = vi.fn();
  const scanner = {
    start: vi.fn().mockRejectedValue(new Error("Permissão negada")),
    stop: vi.fn(),
    destroy: vi.fn(),
  };
  const reader = new Reader(() => scanner, vi.fn(), error);
  await reader.start();
  await reader.start();
  expect(error).toHaveBeenCalledTimes(2);
  expect(scanner.destroy).toHaveBeenCalledTimes(2);
});
