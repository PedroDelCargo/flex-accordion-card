import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";
import { fileURLToPath } from "node:url";
export function demoServer() {
  const root = resolve(fileURLToPath(new URL("../", import.meta.url)));
  return createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
      const path = resolve(root, `.${pathname === "/" ? "/test/harness.html" : pathname}`);
      if (!path.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
      const body = await readFile(path);
      res.setHeader("Content-Type", ({ ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".png": "image/png" })[extname(path)] || "text/plain");
      res.end(body);
    } catch { res.writeHead(404); res.end("Not found"); }
  });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  demoServer().listen(8124, "127.0.0.1", () => console.log("Démo simulée : http://127.0.0.1:8124 — Ctrl+C pour arrêter"));
}
