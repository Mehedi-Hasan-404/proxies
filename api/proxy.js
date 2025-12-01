export const config = {
  runtime: 'edge', // This is required for streaming support
};

export default async function handler(request) {
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) {
    return new Response("Missing 'url' parameter", { status: 400 });
  }

  try {
    const upstreamResponse = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36",
      },
    });

    // Clone the headers to make them mutable
    const newHeaders = new Headers(upstreamResponse.headers);
    newHeaders.set("Access-Control-Allow-Origin", "*");
    newHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, POST, OPTIONS");
    newHeaders.set("Access-Control-Allow-Headers", "*");

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: newHeaders,
    });
  } catch (error) {
    return new Response("Stream Error: " + error.message, { status: 500 });
  }
}
