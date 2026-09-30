import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 8877);
const mime = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".csv": "text/csv; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const requested = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const filePath = path.resolve(root, `.${requested}`);
  if (!filePath.startsWith(root) || !["GET", "HEAD"].includes(req.method)) {
    res.writeHead(403); res.end("Forbidden"); return;
  }
  try {
    const data = await fs.readFile(filePath);
    res.writeHead(200, { "Content-Type": mime[path.extname(filePath).toLowerCase()] || "application/octet-stream" });
    res.end(req.method === "HEAD" ? undefined : data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); res.end("Not found");
  }
}).listen(port, "127.0.0.1", () => console.log(`Grammar Review Lab: http://127.0.0.1:${port}`));
