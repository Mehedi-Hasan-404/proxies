// src/lib/proxyM3U8.js
import fetch from "node-fetch";

export default async function proxyM3U8(url, headers, res) {
  try {
    if (!url) {
      res.writeHead(400);
      return res.end("Missing URL");
    }

    const upstream = await fetch(url, { headers });

    if (!upstream.ok) {
      res.writeHead(upstream.status);
      return res.end("Upstream error");
    }

    let body = await upstream.text();

    // Rewrite TS URLs inside playlist
    body = body.replace(/(https?:\/\/[^\s"']+\.ts)/g, (tsURL) => {
      return `${process.env.PUBLIC_URL}ts-proxy?url=${encodeURIComponent(tsURL)}`;
    });

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.end(body);
  } catch (err) {
    console.error("M3U8 proxy error:", err);
    res.writeHead(500);
    res.end("Proxy Error");
  }
}
