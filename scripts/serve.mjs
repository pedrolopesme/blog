// A tiny, dependency-free static file server for local preview of dist/.
//
//   node scripts/serve.mjs [--port 4321] [--root dist]
//
// It understands clean URLs ("/posts/slug/" -> ".../index.html") and mirrors
// how GitHub Pages serves the built site.

import http from "node:http";
import { promises as fs, createReadStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const args = parseArgs(process.argv.slice(2));
const port = Number(args.port || process.env.PORT || 4321);
const root = path.resolve(ROOT, args.root || "dist");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${port}`);
    let pathname = decodeURIComponent(url.pathname);

    // Prevent path traversal.
    const unsafe = path.normalize(path.join(root, pathname));
    if (!unsafe.startsWith(root)) return send(res, 403, "Forbidden");

    let filePath = unsafe;
    const stat = await statOrNull(filePath);
    if (stat?.isDirectory() || pathname.endsWith("/")) {
      filePath = path.join(unsafe, "index.html");
    }
    if (!(await statOrNull(filePath))) {
      // Clean URL without trailing slash? try /index.html
      const alt = path.join(unsafe, "index.html");
      if (await statOrNull(alt)) filePath = alt;
    }

    const finalStat = await statOrNull(filePath);
    if (!finalStat || finalStat.isDirectory()) {
      const notFound = path.join(root, "404.html");
      if (await statOrNull(notFound)) return stream(res, 404, notFound);
      return send(res, 404, "Not found");
    }

    stream(res, 200, filePath);
  } catch (err) {
    send(res, 500, "Server error: " + err.message);
  }
});

server.listen(port, () => {
  console.log(`▸ serving ${path.relative(ROOT, root) || "."} at http://localhost:${port}`);
  console.log("  Ctrl-C to stop.");
});

function stream(res, status, filePath) {
  const type = MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";
  res.writeHead(status, { "content-type": type });
  createReadStream(filePath).pipe(res);
}

function send(res, status, body) {
  res.writeHead(status, { "content-type": "text/plain; charset=utf-8" });
  res.end(body);
}

async function statOrNull(p) {
  try {
    return await fs.stat(p);
  } catch {
    return null;
  }
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        out[key] = next;
        i++;
      } else {
        out[key] = true;
      }
    }
  }
  return out;
}
