import { parsePayload, type Payload } from "./payload";
export interface Scanner {
  start(): Promise<void>;
  stop(): void;
  destroy(): void;
}
export class Reader {
  private scanner?: Scanner;
  private generation = 0;
  private busy = false;
  private accepted = false;
  constructor(
    private factory: (onRead: (raw: string) => void) => Scanner,
    private result: (p: Payload) => void,
    private error: (e: unknown) => void,
  ) {}
  async start() {
    if (this.busy || this.scanner) return;
    this.busy = true;
    this.accepted = false;
    const generation = ++this.generation;
    const scanner = this.factory((raw) => {
      if (generation !== this.generation || this.accepted) return;
      let p: Payload;
      try {
        p = parsePayload(raw);
      } catch (e) {
        this.error(e);
        return;
      }
      this.accepted = true;
      this.close();
      this.result(p);
    });
    this.scanner = scanner;
    try {
      await scanner.start();
      if (generation !== this.generation) {
        scanner.stop();
        scanner.destroy();
      }
    } catch (e) {
      if (generation === this.generation) {
        this.close();
        this.error(e);
      }
    } finally {
      this.busy = false;
    }
  }
  close() {
    ++this.generation;
    this.scanner?.stop();
    this.scanner?.destroy();
    this.scanner = undefined;
  }
}
