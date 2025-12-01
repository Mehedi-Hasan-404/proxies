// src/lib/proxyM3U8.js
// Uses global fetch (Node 18+ / Vercel runtime) so no node-fetch dependency required
export default async function proxyM3U8(url, headers = {}, res) {
  try {
    if (!url) {
      res.writeHead(400);
      return res.end("Missing URL");
    }

    // Fetch upstream playlist
    const upstream = await fetch(url, { headers });

    if (!upstream.ok) {
      res.writeHead(upstream.status || 502);
      return res.end("Upstream error");
    }

    let body = await upstream.text();

    // Rewrite absolute .ts URLs to route through our ts-proxy
    // (keeps relative paths intact—if you want to rewrite relative ones too, we can extend this)
    body = body.replace(/(https?:\/\/[^\s"']+\.ts)/g, (tsURL) => {
      return `${process.env.PUBLIC_URL}ts-proxy?url=${encodeURIComponent(tsURL)}`;
    });

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    return res.end(body);
  } catch (err) {
    console.error("M3U8 proxy error:", err && (err.stack || err.message || err));
    res.writeHead(500);
    return res.end("Proxy Error");
  }
}
