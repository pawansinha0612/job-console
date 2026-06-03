// Adzuna CORS proxy — Cloudflare Worker (free tier).
// Only needed if the in-app live search fails with a CORS error on your deployed page.
//
// SETUP (≈5 min, free):
//  1. Sign in at https://dash.cloudflare.com  →  Workers & Pages  →  Create  →  Create Worker.
//  2. Replace the default code with everything in this file. Click Deploy.
//  3. Copy your worker URL, e.g.  https://atelier-proxy.<you>.workers.dev
//  4. In the app: Find jobs tab → "Adzuna API keys" → paste that URL into the "Proxy URL" field.
//     Done — live search now routes through the proxy and CORS is solved.
//
// It only forwards requests to api.adzuna.com, so it can't be abused as an open proxy.

export default {
  async fetch(request) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    const target = new URL(request.url).searchParams.get("url");
    if (!target || !target.startsWith("https://api.adzuna.com/")) {
      return new Response("Only api.adzuna.com URLs are allowed.", {
        status: 400,
        headers: cors,
      });
    }

    try {
      const upstream = await fetch(target, { headers: { Accept: "application/json" } });
      const body = await upstream.text();
      return new Response(body, {
        status: upstream.status,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 502,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
  },
};
