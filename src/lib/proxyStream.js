import http from "node:http";
import https from "node:https";
import { URL } from "node:url";

export default async function proxyStream(targetUrl, headers, req, res) {
  if (!targetUrl) {
    res.writeHead(400, "Missing URL parameter");
    res.end("URL parameter is required");
    return;
  }

  // Ensure protocol exists
  if (!targetUrl.startsWith("http")) {
    targetUrl = "http://" + targetUrl;
  }

  const uri = new URL(targetUrl);
  const isHttps = uri.protocol === "https:";
  const requestModule = isHttps ? https : http;

  const options = {
    hostname: uri.hostname,
    port: uri.port || (isHttps ? 443 : 80),
    path: uri.pathname + uri.search,
    method: req.method,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36",
      ...headers,
    },
  };

  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  // Default to MPEG-TS for raw streams
  res.setHeader("Content-Type", "video/mp2t");

  const proxyReq = requestModule.request(options, (proxyRes) => {
    // Forward the status code and headers
    res.writeHead(proxyRes.statusCode || 200, {
      ...proxyRes.headers,
      "Access-Control-Allow-Origin": "*",
    });

    // Pipe the raw binary data directly
    proxyRes.pipe(res);
  });

  proxyReq.on("error", (e) => {
    console.error("Stream Proxy Error:", e.message);
    if (!res.headersSent) {
      res.writeHead(502);
      res.end("Bad Gateway: " + e.message);
    }
  });

  req.pipe(proxyReq);
}
