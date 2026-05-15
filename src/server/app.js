import { createServer as createHttpServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { detectPersonaDrift } from "../persona_drift_detector.js";
import { classifyIntent, DEFAULT_INTENT_MODEL } from "../intent_classifier.js";
import { resolveRagConflict } from "../rag_conflict_resolver.js";
import { ROUND_1_PERSONA_JSON, SISTER_QUERY_CHUNKS } from "../sample_data.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_DIR = process.env.MEMORY_OS_DATA_DIR || path.join(ROOT, "data");
const STORE_FILE = path.join(DATA_DIR, "memory-store.json");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png"
};

export function createServer() {
  return createHttpServer(async (req, res) => {
    try {
      if (req.method === "OPTIONS") return sendCors(res, 204);
      const url = new URL(req.url, "http://localhost");

      if (url.pathname.startsWith("/api/")) {
        return routeApi(req, res, url);
      }

      return serveStatic(res, url.pathname);
    } catch (error) {
      return sendJson(res, 500, {
        error: "internal_server_error",
        message: error.message
      });
    }
  });
}

async function routeApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/health") {
    return sendJson(res, 200, {
      ok: true,
      service: "memory-os",
      mode: "backend",
      storage: "file-backed-json",
      model: DEFAULT_INTENT_MODEL.version
    });
  }

  if (req.method === "GET" && url.pathname === "/api/persona/drift") {
    const store = await readStore();
    return sendJson(res, 200, detectPersonaDrift(store.persona));
  }

  if (req.method === "POST" && url.pathname === "/api/intent/classify") {
    const body = await readJsonBody(req);
    return sendJson(res, 200, classifyIntent(String(body.message || ""), DEFAULT_INTENT_MODEL));
  }

  if (req.method === "POST" && url.pathname === "/api/rag/resolve") {
    const body = await readJsonBody(req);
    const store = await readStore();
    return sendJson(
      res,
      200,
      resolveRagConflict(String(body.query || "Did I mention anything about my sister?"), store.chunks, {
        now: body.now || new Date().toISOString()
      })
    );
  }

  if (req.method === "GET" && url.pathname === "/api/memory") {
    return sendJson(res, 200, await readStore());
  }

  if (req.method === "POST" && url.pathname === "/api/memory/messages") {
    const body = await readJsonBody(req);
    const store = await readStore();
    const message = {
      id: body.id || `p-${Date.now()}`,
      timestamp: body.timestamp || new Date().toISOString(),
      topic: body.topic || "user-added",
      text: String(body.text || ""),
      people: Array.isArray(body.people) ? body.people : []
    };
    if (!message.text.trim()) return sendJson(res, 400, { error: "message_text_required" });
    store.persona.messages.push(message);
    await writeStore(store);
    return sendJson(res, 201, message);
  }

  return sendJson(res, 404, { error: "not_found" });
}

async function serveStatic(res, pathname) {
  const publicAliasPath = pathname === "/public" ? "/" : pathname.replace(/^\/public\//, "/");
  const normalizedPath = publicAliasPath === "/" ? "/index.html" : publicAliasPath;
  const requested = path.normalize(decodeURIComponent(normalizedPath)).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(PUBLIC_DIR, requested);
  const safePath = filePath.startsWith(PUBLIC_DIR) ? filePath : path.join(PUBLIC_DIR, "index.html");
  const finalPath = existsSync(safePath) ? safePath : path.join(PUBLIC_DIR, "index.html");
  const ext = path.extname(finalPath);
  const content = await readFile(finalPath);
  res.writeHead(200, {
    "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
    "Cache-Control": ext === ".html" ? "no-store" : "public, max-age=300"
  });
  res.end(content);
}

async function readStore() {
  await mkdir(DATA_DIR, { recursive: true });
  if (!existsSync(STORE_FILE)) {
    const seed = {
      persona: ROUND_1_PERSONA_JSON,
      chunks: SISTER_QUERY_CHUNKS,
      updatedAt: new Date().toISOString()
    };
    await writeStore(seed);
    return seed;
  }
  return JSON.parse(await readFile(STORE_FILE, "utf8"));
}

async function writeStore(store) {
  await mkdir(DATA_DIR, { recursive: true });
  store.updatedAt = new Date().toISOString();
  await writeFile(STORE_FILE, `${JSON.stringify(store, null, 2)}\n`);
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": process.env.CORS_ORIGIN || "*",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
  });
  res.end(JSON.stringify(payload));
}

function sendCors(res, status) {
  res.writeHead(status, {
    "Access-Control-Allow-Origin": process.env.CORS_ORIGIN || "*",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
  });
  res.end();
}
