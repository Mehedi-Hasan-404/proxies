// src/lib/proxyTS.js
import https from "node:https";
import http from "node:http";

export async function proxyTs(url, headers, req, res) {
  if (!url) {
    res.writeHead(400);
    return res.end("Missing URL");
  }

  const isHTTPS = url.startsWith("https://");
  const { hostname, port, pathname, search } = new URL(url);

  const options = {
    hostname,
    port: port || (isHTTPS ? 443 : 80),
    path: pathname + search,
    method: "GET",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      ...headers,
    },
  };

  const client = isHTTPS ? https : http;

  try {
    const proxy = client.request(options, (up) => {
      res.setHeader("Content-Type", "video/mp2t");
      res.writeHead(up.statusCode, up.headers);
      up.pipe(res);
    });

    proxy.on("error", (err) => {
      res.writeHead(500);
      res.end("TS Proxy Error");
    });

    proxy.end();
  } catch (err) {
    res.writeHead(500);
    res.end("Proxy Error");
  }
}
