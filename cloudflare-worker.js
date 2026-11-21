/* Promptoo AI proxy for Cloudflare Workers (free plan works).
 *
 * What it does: takes an OpenAI-style chat request from the Promptoo page and runs it on Cloudflare
 * Workers AI, so no API token ever sits in the browser.
 *
 * Deploy:
 *   1. Cloudflare dashboard -> Workers & Pages -> Create -> Worker, paste this file, Deploy.
 *      (or with wrangler: `wrangler deploy`, using the wrangler.toml snippet below)
 *   2. Settings -> Bindings -> Add -> Workers AI, variable name: AI
 *   3. Settings -> Variables and Secrets (recommended, so strangers cannot use your free allowance):
 *        APP_KEY         any long random string. Paste the same string into Promptoo's key box.
 *        ALLOWED_ORIGIN  the origin you open Promptoo from, e.g. https://promptoo.example.com
 *                        (leave unset to allow any origin; "null" is what a local file:// page sends)
 *   4. In Promptoo: Rewrite with AI -> provider "Cloudflare Worker (your own)" -> paste the Worker URL.
 *
 * wrangler.toml snippet:
 *   name = "promptoo-ai"
 *   main = "cloudflare-worker.js"
 *   compatibility_date = "2025-01-01"
 *   [ai]
 *   binding = "AI"
 */
export default {
  async fetch(request, env) {
    const origin = request.headers.get("origin") || "";
    const allow = env.ALLOWED_ORIGIN ? (origin === env.ALLOWED_ORIGIN ? origin : "") : "*";
    const cors = {
      "access-control-allow-origin": allow || "null",
      "access-control-allow-headers": "content-type, authorization",
      "access-control-allow-methods": "POST, OPTIONS",
      "vary": "origin"
    };
    const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { ...cors, "content-type": "application/json" } });

    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST") return json({ error: { message: "POST only" } }, 405);
    if (env.ALLOWED_ORIGIN && !allow) return json({ error: { message: "Origin not allowed" } }, 403);
    if (env.APP_KEY && request.headers.get("authorization") !== "Bearer " + env.APP_KEY) return json({ error: { message: "Wrong or missing key" } }, 401);

    let body;
    try { body = await request.json(); } catch (e) { return json({ error: { message: "Body must be JSON" } }, 400); }
    const messages = Array.isArray(body.messages) ? body.messages : [];
    if (!messages.length) return json({ error: { message: "messages is required" } }, 400);

    try {
      const model = body.model || "@cf/meta/llama-3.1-8b-instruct";
      const out = await env.AI.run(model, { messages, max_tokens: Math.min(+body.max_tokens || 1024, 2048) });
      const text = (out && (out.response || (out.choices && out.choices[0] && out.choices[0].message && out.choices[0].message.content))) || "";
      return json({ choices: [{ message: { role: "assistant", content: text } }] });
    } catch (e) {
      return json({ error: { message: String(e && e.message || e) } }, 502);
    }
  }
};
