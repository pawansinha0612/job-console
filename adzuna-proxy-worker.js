// Adzuna proxy that keeps your API keys OFF the browser.
// Your keys live as Worker environment variables — never in your page or its source.
//
// SETUP (free, ~5 min):
//  1. dash.cloudflare.com  →  Workers & Pages  →  Create  →  Create Worker.
//  2. Replace the default code with everything in this file. Click Deploy.
//  3. Open the Worker  →  Settings  →  Variables and Secrets  →  add TWO variables:
//        ADZUNA_APP_ID    = your Adzuna app id
//        ADZUNA_APP_KEY   = your Adzuna app key   (mark this one as a Secret / Encrypt)
//     Save, then Deploy again.
//  4. Copy your Worker URL (looks like https://your-worker.<you>.workers.dev).
//  5. In the app: Find jobs  →  "Adzuna connection"  →  paste that URL in "Proxy URL",
//     and leave app_id / app_key BLANK. Done — keys stay on Cloudflare.
//
// Security: regenerate your Adzuna key first (the old one was exposed), and put the NEW
// key only in this Worker. The browser only ever sends search terms (what/where).

export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    const id = env.ADZUNA_APP_ID;
    const key = env.ADZUNA_APP_KEY;
    if (!id || !key) {
      return new Response(
        JSON.stringify({ error: "Worker is missing ADZUNA_APP_ID / ADZUNA_APP_KEY environment variables." }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const q = new URL(request.url).searchParams;
    const what = q.get("what") || "";
    const where = q.get("where") || "Melbourne";
    const page = q.get("page") || "1";
    const rpp = q.get("results_per_page") || "30";
    const maxDays = q.get("max_days_old") || "40";
    const sort = q.get("sort_by") || "date";

    const u =
      `https://api.adzuna.com/v1/api/jobs/au/search/${encodeURIComponent(page)}` +
      `?app_id=${encodeURIComponent(id)}&app_key=${encodeURIComponent(key)}` +
      `&results_per_page=${encodeURIComponent(rpp)}&max_days_old=${encodeURIComponent(maxDays)}` +
      `&sort_by=${encodeURIComponent(sort)}&what=${encodeURIComponent(what)}` +
      `&where=${encodeURIComponent(where)}&content-type=application/json`;

    try {
      const r = await fetch(u, { headers: { Accept: "application/json" } });
      const body = await r.text();
      return new Response(body, { status: r.status, headers: { ...cors, "Content-Type": "application/json" } });
    } catch (e) {
      return new Response(JSON.stringify({ error: String(e) }), {
        status: 502,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
  },
};
