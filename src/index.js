// src/index.js
import { readFileSync } from "node:fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import proxyM3U8 from "./lib/proxyM3U8.js";
import { proxyTs } from "./lib/proxyTS.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper
function getParams(req) {
  const base = `http://${req.headers.host}`;
  return new URL(req.url, base).searchParams;
}

function setCORS(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
}

export default async function handler(req, res) {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  // Preflight
  if (req.method === "OPTIONS") {
    setCORS(res);
    res.statusCode = 204;
    return res.end();
  }

  // Serve HTML
  if (pathname === "/" || pathname === "/index.html") {
    const html = readFileSync(join(__dirname, "index.html"), "utf8");
    res.setHeader("Content-Type", "text/html");
    return res.end(html);
  }

  // AUTO detection route
  if (pathname === "/auto") {
    setCORS(res);
    const params = getParams(req);
    const target = params.get("url");

    if (!target) {
      res.statusCode = 400;
      return res.end("Missing url");
    }

    // If real HLS playlist (.m3u8)
    if (target.endsWith(".m3u8")) {
      return proxyM3U8(target, {}, res);
    }

    // Else: RAW MPEG-TS → wrap into fake HLS
    const playlist = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:4
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:4,
${process.env.PUBLIC_URL}ts-proxy?url=${encodeURIComponent(target)}
`;

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    return res.end(playlist);
  }

  // M3U8 proxy
  if (pathname === "/m3u8-proxy") {
    setCORS(res);
    const params = getParams(req);
    return proxyM3U8(params.get("url"), {}, res);
  }

  // TS proxy
  if (pathname === "/ts-proxy") {
    setCORS(res);
    const params = getParams(req);
    return proxyTs(params.get("url"), {}, req, res);
  }

  res.statusCode = 404;
  res.end("Not found");
}
