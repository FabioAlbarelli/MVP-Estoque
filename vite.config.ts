import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
const cert = process.env.QR_HTTPS_CERT;
const key = process.env.QR_HTTPS_KEY;
if (Boolean(cert) !== Boolean(key))
  throw new Error("Defina QR_HTTPS_CERT e QR_HTTPS_KEY juntos.");
export default defineConfig({
  server: {
    host: "127.0.0.1",
    https:
      cert && key
        ? { cert: readFileSync(cert), key: readFileSync(key) }
        : undefined,
  },
});
