/* Promptoo: optional "Rewrite using AI". Bring your own key. Works with Anthropic and with any
   OpenAI-compatible provider (OpenRouter, Cloudflare, Groq, Gemini, Ollama, LM Studio, or a custom URL).
   Keys stay in this browser and go only to the provider you pick. */
(function () {
  const $ = id => document.getElementById(id);
  const PROV = {
    anthropic: { label: "Anthropic (Claude)", kind: "anthropic", base: "https://api.anthropic.com",
      models: ["claude-sonnet-5-5", "claude-haiku-5-5", "claude-opus-5-5"], note: "Paid. Get a key at console.anthropic.com." },
    openrouter: { label: "OpenRouter (free models available)", kind: "openai", base: "https://openrouter.ai/api/v1",
      models: ["google/gemma-4-31b-it:free", "google/gemma-4-26b-a4b-it:free"], note: "Free models end in :free. Press \"Load free text models\" to see what is free today. Do not use openrouter/free: it can pick an image model that returns no text. Free models are rate limited. Get a key at openrouter.ai." },
    cfworkers: { label: "Cloudflare Workers AI (direct)", kind: "openai", acct: true, base: "https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/v1",
      models: ["@cf/meta/llama-3.1-8b-instruct"], note: "Free daily allowance on the Workers AI free plan. Needs your account ID and an API token with Workers AI access. Browsers may be blocked from api.cloudflare.com (CORS). If you see 'Failed to fetch', use the Worker option below." },
    cfproxy: { label: "Cloudflare Worker (your own, free)", kind: "openai", base: "https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev",
      models: ["@cf/meta/llama-3.1-8b-instruct"], optkey: true, note: "Deploy cloudflare-worker.js from the Promptoo folder to your Cloudflare account. It calls Workers AI for you, so no token sits in the browser. The key box is optional: use the APP_KEY you set on the Worker." },
    groq: { label: "Groq (free tier)", kind: "openai", base: "https://api.groq.com/openai/v1",
      models: ["llama-3.3-70b-versatile"], note: "Free tier with rate limits. Get a key at console.groq.com. Model names change, so check Groq's model list." },
    gemini: { label: "Google Gemini API (free tier)", kind: "openai", base: "https://generativelanguage.googleapis.com/v1beta/openai",
      models: ["gemini-2.5-flash"], note: "Free tier with limits, using a key from Google AI Studio. Model names change, so check Google's model list." },
    ollama: { label: "Ollama (local, free)", kind: "openai", base: "http://localhost:11434/v1", nokey: true,
      models: ["llama3.2"], note: "Runs on your computer and nothing leaves it. Start Ollama with OLLAMA_ORIGINS set to allow this page, or the browser blocks the request. Use a model you have pulled." },
    lmstudio: { label: "LM Studio (local, free)", kind: "openai", base: "http://localhost:1234/v1", nokey: true,
      models: [], note: "Start LM Studio's local server and turn on CORS in its server settings. Type the model name it shows." },
    custom: { label: "Other OpenAI-compatible (custom URL)", kind: "openai", base: "", optkey: true,
      models: [], note: "Any server with an OpenAI-style /chat/completions endpoint. Enter its base URL, usually ending in /v1." }
  };
  const GOALS = {
    structured: "Keep my structure exactly: the same lines, the same labels and the same order, one line per label. Improve only the wording after each label: more vivid, concrete and physical. Do not merge lines into a paragraph and do not add or remove labels.",
    cinematic: "Rewrite as a vivid, cinematic prompt with concrete visual detail, in natural flowing prose.",
    short: "Rewrite as briefly as possible (under 70 words) while keeping every key visual fact.",
    veo: "Rewrite for Google Veo: natural cinematic prose, one paragraph per shot, including camera, lighting and audio cues.",
    sora: "Rewrite for OpenAI Sora in a director's-notes style: plain language, clear sequential action.",
    kling: "Rewrite for Kling using Subject + Action + Scene + Style (camera language, lighting, atmosphere), concise.",
    fix: "Fix the contradictions and risks listed below, changing as little else as possible."
  };
  const SYSTEM = "You are an expert prompt engineer for AI video generation models. You rewrite a user's video prompt. " +
    "Rules: keep every concrete fact the user gave (subject, action, location, camera, lens, lighting, style, grade, durations, aspect ratio, dialogue). " +
    "Never add named copyrighted characters, brands or real people; describe appearance instead. " +
    "If two instructions contradict, keep the more specific one and drop the other silently. " +
    "Do not add explanations, markdown or quotation marks around the result, and add no headings of your own: if the prompt already has labelled lines, those labels are part of the prompt and stay. Output only the rewritten prompt.";

  const store = {
    get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} },
    del: k => { try { localStorage.removeItem(k); } catch (e) {} }
  };
  const CFG = "promptoo.ai";
  let cfg = { prov: "anthropic", models: {}, bases: {}, acct: "" };
  try { Object.assign(cfg, JSON.parse(store.get(CFG) || "{}")); } catch (e) {}
  if (!PROV[cfg.prov]) cfg.prov = "anthropic";
  const status = m => { $("aiStatus").textContent = m || ""; };
  /* a plain log of each request, so a failed rewrite can be diagnosed (the API key is never written here) */
  const dbg = (m, reset) => { const el = $("aiDebug"), box = $("aiDet"); if (!el) return; if (reset) el.textContent = ""; if (m && /^Result:/.test(m)) console.log("[Promptoo AI] " + m); if (m) { el.textContent += (el.textContent ? String.fromCharCode(10) : "") + m; } if (box) box.hidden = !el.textContent; };
  const peek = s => String(s).slice(0, 400).replace(/\s+/g, " ");
  const ms0 = () => performance.now();

  $("aiProv").innerHTML = Object.keys(PROV).map(k => `<option value="${k}">${PROV[k].label}</option>`).join("");

  function showProv() {
    const p = PROV[cfg.prov];
    $("aiProv").value = cfg.prov;
    $("aiBaseRow").hidden = p.kind === "anthropic";
    $("aiBase").value = cfg.bases[cfg.prov] || p.base;
    $("aiAcctRow").hidden = !p.acct;
    $("aiAcct").value = cfg.acct || "";
    $("aiModel").value = cfg.models[cfg.prov] || p.models[0] || "";
    $("aiModels").innerHTML = p.models.map(m => `<option value="${m}">`).join("");
    const k = store.get("promptoo.key." + cfg.prov) || (cfg.prov === "anthropic" ? store.get("promptoo.key") : "") || "";
    $("aiKey").value = k; $("aiRemember").checked = !!k;
    $("aiKeyRow").hidden = !!p.nokey;
    $("aiKey").placeholder = p.optkey ? "optional" : cfg.prov === "anthropic" ? "sk-ant-…" : "API key";
    $("aiNote").textContent = p.note;
    if ($("aiLoadRow")) { $("aiLoadRow").hidden = cfg.prov !== "openrouter"; if (cfg.prov === "openrouter" && !freeLoaded) loadFreeModels(true); if ($("aiLoadList") && cfg.prov !== "openrouter") $("aiLoadList").hidden = true; else if ($("aiLoadList") && freeLoaded) $("aiLoadList").hidden = false; }
    $("aiSend").textContent = p.kind === "anthropic" ? "api.anthropic.com" : p.nokey ? "your own computer" : "the provider you chose";
  }
  /* OpenRouter's public model list needs no key. It lets us offer only free models that really return text. */
  let freeLoaded = false;
  async function loadFreeModels(auto) {
    const note = $("aiLoadNote"), btn = $("aiLoad"); if (!note) return; note.textContent = "Loading the list from openrouter.ai…"; if (btn) { btn.disabled = true; btn.textContent = "Loading…"; }
    try {
      const t0 = performance.now(), r = await fetch("https://openrouter.ai/api/v1/models"), j = await r.json();
      const free = (j.data || []).filter(m => m.pricing && Number(m.pricing.prompt) === 0 && Number(m.pricing.completion) === 0 && m.architecture
        && (m.architecture.output_modalities || []).join() === "text" && (m.architecture.input_modalities || []).includes("text") && m.id !== "openrouter/free");
      const thinks = m => (m.supported_parameters || []).includes("reasoning");
      free.sort((a, b) => (thinks(a) - thinks(b)) || ((b.context_length || 0) - (a.context_length || 0)));
      console.log("[Promptoo AI] loaded OpenRouter models: " + (j.data || []).length + " total, " + free.length + " free text-only, in " + Math.round(performance.now() - t0) + " ms", free.map(m => m.id));
      if (!free.length) { note.textContent = "No free text models are listed right now."; return; }
      PROV.openrouter.models = free.map(m => m.id); freeLoaded = true;
      $("aiModels").innerHTML = PROV.openrouter.models.map(m => `<option value="${m}">`).join("");
      const cur = $("aiModel").value.trim();
      let changed = false; if (cfg.prov === "openrouter" && (!cur || cur === "openrouter/free" || (/:free$/.test(cur) && !PROV.openrouter.models.includes(cur)))) { $("aiModel").value = free[0].id; changed = true; }
      const ctxK = m => m.context_length ? Math.round(m.context_length / 1000) + "k" : "";
      const box = $("aiLoadList"); if (box) { box.hidden = false; box.innerHTML = free.map(m => `<button type="button" class="chip" data-m="${m.id}" title="${m.id}">${m.id.replace(/:free$/, "")}<small>${ctxK(m)}</small></button>`).join(""); box.querySelectorAll(".chip").forEach(c => { c.onclick = () => { $("aiModel").value = c.dataset.m; markModels(); }; }); markModels(); }
      note.textContent = free.length + " free text models found at " + new Date().toLocaleTimeString() + ". Click one below to use it." + (changed ? " Selected: " + free[0].id : "");
    } catch (e) { note.textContent = "Could not load the list (" + (e && e.message || e) + "). You can still type a model name."; console.warn("[Promptoo AI] could not load the OpenRouter model list", e); }
    finally { if (btn) { btn.disabled = false; btn.textContent = "Load free text models"; } }
  }
  function markModels() { const v = $("aiModel").value.trim(); document.querySelectorAll("#aiLoadList .chip").forEach(c => c.classList.toggle("on", c.dataset.m === v)); }
  if ($("aiModel")) $("aiModel").addEventListener("input", markModels);
  /* side by side: the original on the left, the rewrite on the right */
  const words = s => (String(s).trim().match(/\S+/g) || []).length;
  const counts = () => { $("aiOrigN").textContent = words($("aiOrig").value) + " words"; const w = words($("aiOut").value), o = words($("aiOrig").value); $("aiOutN").textContent = $("aiOut").value.trim() ? w + " words" + (o ? " (" + (w >= o ? "+" : "") + (w - o) + ")" : "") : ""; };
  const loadOrig = () => { const sc0 = $("aiScope").value; let v = ""; try { v = sc0 === "scene" ? text(sc(), S.cur) : fullText(); } catch (e) {} $("aiOrig").value = v || ""; counts(); };
  const open = scope => { $("aiScope").value = scope; $("ai").hidden = false; status(""); showProv(); loadOrig(); };
  $("aiScope").addEventListener("change", loadOrig); $("aiOut").addEventListener("input", counts);
  $("aiBtn").onclick = () => open("scene");
  $("aiBtn2").onclick = () => open("full");
  $("aiClose").onclick = () => { $("ai").hidden = true; };
  $("ai").addEventListener("mousedown", e => { if (e.target === $("ai")) $("ai").hidden = true; });
  if ($("aiLoad")) $("aiLoad").onclick = () => loadFreeModels(false);
  $("aiProv").onchange = e => { cfg.prov = e.target.value; showProv(); };

  const baseUrl = p => {
    let b = ($("aiBase").value || p.base).trim().replace(/\/+$/, "");
    if (p.acct) b = b.replace("{ACCOUNT_ID}", encodeURIComponent($("aiAcct").value.trim()));
    return b;
  };
  const errText = j => {
    const e = j && (j.error || (j.errors && j.errors[0]) || j.message);
    if (!e) return "request failed";
    if (typeof e === "string") return e;
    const raw = e.metadata && e.metadata.raw ? " (" + String(typeof e.metadata.raw === "string" ? e.metadata.raw : JSON.stringify(e.metadata.raw)).slice(0, 160) + ")" : "";
    return (e.message || JSON.stringify(e)) + raw;
  };
  /* ---------- one place that sends every request and writes a full trace to the console ---------- */
  let seq = 0;
  const maskKey = h => { const v = (h && (h.authorization || h["x-api-key"])) || ""; return v ? "****" + String(v).slice(-4) + " (" + String(v).length + " chars)" : "(none)"; };
  const safeHeaders = h => { const o = {}; Object.keys(h).forEach(k => { o[k] = /authorization|x-api-key/i.test(k) ? maskKey(h) : h[k]; }); return o; };
  const envInfo = () => ({ online: navigator.onLine, page: location.protocol + "//" + (location.host || "(local file)"), userAgent: navigator.userAgent });
  async function timedFetch(url, headers, bodyObj, label) {
    const id = ++seq, tag = "[Promptoo AI #" + id + "]", ctl = typeof AbortController !== "undefined" ? new AbortController() : null, started = new Date();
    const TIMEOUT = 90000, timer = ctl ? setTimeout(() => ctl.abort(), TIMEOUT) : null, t0 = performance.now();
    console.groupCollapsed(tag + " request: " + label);
    console.log("when:", started.toISOString());
    console.log("method and url:", "POST " + url);
    console.log("headers:", safeHeaders(headers));
    console.log("body:", bodyObj);
    console.log("body size:", JSON.stringify(bodyObj).length + " characters; timeout " + TIMEOUT / 1000 + " s");
    console.log("environment:", envInfo());
    console.groupEnd();
    dbg("POST " + url + "  " + label);
    let r, tHead;
    try {
      r = await fetch(url, { method: "POST", headers, body: JSON.stringify(bodyObj), signal: ctl ? ctl.signal : undefined });
      tHead = performance.now() - t0;
    } catch (e) {
      if (timer) clearTimeout(timer);
      const ms = Math.round(performance.now() - t0), aborted = e && e.name === "AbortError";
      const kind = aborted ? "TIMEOUT: no reply after " + TIMEOUT / 1000 + " s"
        : !navigator.onLine ? "OFFLINE: the browser reports no network connection"
        : (e && e.name === "TypeError") ? "NETWORK or CORS: the request never completed. Causes: wrong address, a blocker or extension, a firewall or VPN, or the provider refusing browser requests (CORS)"
        : "ERROR";
      console.groupCollapsed(tag + " NETWORK PROBLEM after " + ms + " ms: " + kind);
      console.error("error:", e);
      console.log("name and message:", (e && e.name) + ": " + (e && e.message));
      console.log("environment:", envInfo());
      console.log("tip: open DevTools > Network and look for the request to " + url + ". If it is missing or red, something blocked it before it left the browser.");
      console.groupEnd();
      dbg("The request was not completed after " + ms + " ms. " + kind);
      const err = e instanceof Error ? e : new Error(String(e)); if (aborted) err.message = "The provider did not answer within " + TIMEOUT / 1000 + " seconds."; throw err;
    }
    const raw = await r.text(); if (timer) clearTimeout(timer);
    const tBody = performance.now() - t0, hdr = n => (r.headers && r.headers.get && r.headers.get(n)) || undefined;
    const interesting = {}; ["content-type", "retry-after", "x-ratelimit-limit", "x-ratelimit-remaining", "x-ratelimit-reset", "cf-ray", "x-request-id", "x-generation-id", "server"].forEach(n => { const v = hdr(n); if (v !== undefined) interesting[n] = v; });
    let parsed = null; try { parsed = JSON.parse(raw); } catch (e) {}
    console.groupCollapsed(tag + " response: " + r.status + (r.statusText ? " " + r.statusText : "") + " in " + Math.round(tBody) + " ms");
    console.log("status:", r.status, r.statusText || "", "ok:", r.ok, "redirected:", !!r.redirected, "type:", r.type, "url:", r.url || url);
    console.log("timing (ms):", { untilHeaders: Math.round(tHead), readingBody: Math.round(tBody - tHead), total: Math.round(tBody) });
    console.log("headers:", interesting);
    console.log("body size:", raw.length + " characters");
    console.log("body (raw):", raw);
    if (parsed) {
      console.log("body (parsed):", parsed);
      const ch = parsed.choices && parsed.choices[0];
      console.log("summary:", { model: parsed.model, finish_reason: ch && ch.finish_reason, usage: parsed.usage, hasContent: !!(ch && ch.message && (typeof ch.message.content === "string" ? ch.message.content.trim() : ch.message.content)), hasReasoning: !!(ch && ch.message && (ch.message.reasoning || ch.message.reasoning_content)), hasImages: !!(ch && ch.message && ch.message.images && ch.message.images.length), error: parsed.error });
    } else console.warn("the body is not JSON");
    console.groupEnd();
    dbg("-> " + r.status + " in " + Math.round(tBody) + " ms (headers after " + Math.round(tHead) + " ms), " + (interesting["content-type"] || "unknown type") + ", " + raw.length + " characters");
    dbg("   body: " + peek(raw));
    return { r, raw, parsed, ms: Math.round(tBody) };
  }

  async function callAnthropic(key, model, user) {
    const headers = { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" };
    const { r, parsed } = await timedFetch("https://api.anthropic.com/v1/messages", headers, { model, max_tokens: 1500, system: SYSTEM, messages: [{ role: "user", content: user }] }, "model=" + model);
    const j = parsed || {};
    if (!r.ok) throw new Error(`Error ${r.status}: ${errText(j)}`);
    return (j.content || []).filter(b => b.type === "text").map(b => b.text).join(String.fromCharCode(10));
  }
  const textOf = c => typeof c === "string" ? c : Array.isArray(c) ? c.map(x => (x && (x.text || x.content)) || "").join("") : "";
  async function callOpenAI(base, key, model, user, opts) {
    opts = opts || {};
    const nn = String.fromCharCode(10, 10);
    const msgs = opts.fold ? [{ role: "user", content: SYSTEM + nn + user }] : [{ role: "system", content: SYSTEM }, { role: "user", content: user }];
    const body = { model, messages: msgs }; body[opts.tokenParam || "max_tokens"] = 3000;
    const headers = { "content-type": "application/json" };
    if (key) headers.authorization = "Bearer " + key;
    const url = base + "/chat/completions", host = new URL(url).host;
    const { r, raw, parsed } = await timedFetch(url, headers, body, "model=" + model + "  " + (opts.tokenParam || "max_tokens") + "=3000" + (opts.fold ? "  (system text folded into the user message)" : ""));
    if (!parsed) throw new Error(`Unexpected reply from ${host} (status ${r.status}). It was not JSON: ${raw.slice(0, 140).replace(/\s+/g, " ")}. Check the base URL.`);
    const j = parsed;
    if (!r.ok || j.error) {
      const m = errText(j);
      if (!opts.tokenParam && /max_completion_tokens/.test(m)) return callOpenAI(base, key, model, user, Object.assign({}, opts, { tokenParam: "max_completion_tokens" }));
      if (!opts.fold && /developer instruction|system (role|message|prompt)|system_instruction/i.test(m)) return callOpenAI(base, key, model, user, Object.assign({}, opts, { fold: true }));
      throw new Error(`Error ${(j.error && j.error.code) || r.status}: ${m}`);
    }
    const ch = j.choices && j.choices[0], msg = (ch && ch.message) || {}, text = textOf(msg.content);
    if (!text.trim()) {
      const reasoning = msg.reasoning || msg.reasoning_content, why = ch && ch.finish_reason;
      if ((msg.images && msg.images.length) || /recraft|flux|imagen|dall-?e|stable-?diffusion|sdxl|ideogram|midjourney|seedream|image/i.test(String(j.model || model)))
        throw new Error(`The model${j.model ? " (" + j.model + ")" : ""} makes images, not text, so it sent back no words. Pick a text model. For OpenRouter, press "Load free text models".`);
      throw new Error(reasoning || why === "length"
        ? `The model${j.model ? " (" + j.model + ")" : ""} ran out of tokens while thinking and returned no answer. Choose a model that is not a reasoning model, or try again.`
        : `The model${j.model ? " (" + j.model + ")" : ""} returned nothing${why ? " (finish reason: " + why + ")" : ""}. Try again or choose another model.`);
    }
    return Object.assign(new String(text), { model: j.model });   // keep the model name that really answered
  }

  $("aiRun").onclick = async () => {
    const p = PROV[cfg.prov], key = $("aiKey").value.trim(), model = $("aiModel").value.trim();
    if (!p.nokey && !p.optkey && !key) { status("Paste your API key first."); return; }
    if (!model) { status("Enter a model name."); return; }
    if (p.kind === "openai" && !baseUrl(p)) { status("Enter the provider's base URL."); return; }
    if (p.acct && !$("aiAcct").value.trim()) { status("Enter your Cloudflare account ID."); return; }
    cfg.models[cfg.prov] = model; cfg.bases[cfg.prov] = $("aiBase").value.trim(); cfg.acct = $("aiAcct").value.trim();
    store.set(CFG, JSON.stringify(cfg));
    if ($("aiRemember").checked && key) store.set("promptoo.key." + cfg.prov, key); else store.del("promptoo.key." + cfg.prov);

    const scope = $("aiScope").value, goal = $("aiGoal").value;
    const src = scope === "scene" ? text(sc(), S.cur) : fullText();
    if (!src.trim()) { status("Nothing to rewrite yet. Build a scene first."); return; }
    const scenes = scope === "scene" ? [sc()] : S.scenes;
    const problems = [...new Set(scenes.flatMap(s => check(s)).filter(i => i.l !== "t").map(i => "- " + i.msg))];
    const extra = ($("aiCustom").value || "").trim();
    const user = `Goal: ${GOALS[goal]}${extra ? "\nExtra instruction: " + extra : ""}\n\n` +
      (problems.length ? `Problems found by a checker (resolve them in your rewrite):\n${problems.join("\n")}\n\n` : "") +
      `Prompt to rewrite:\n${src}`;
    dbg("", true); console.log("[Promptoo AI] Rewrite clicked", { provider: cfg.prov, model, base: p.kind === "anthropic" ? "api.anthropic.com" : baseUrl(p), scope, goal, promptCharacters: src.length, problemsSent: problems.length, keyPresent: !!key }); $("aiRun").disabled = true; status("Sending to " + (p.kind === "anthropic" ? "api.anthropic.com" : baseUrl(p).split("/")[2]) + " with " + model + "…");
    try {
      const res = p.kind === "anthropic" ? await callAnthropic(key, model, user) : await callOpenAI(baseUrl(p), key, model, user), out = String(res).trim();
      $("aiOrig").value = src; $("aiOut").value = out; counts(); dbg("Result: " + (out ? "ok, " + out.length + " characters" : "empty answer"));
      status(out ? "Done" + (res.model ? " (answered by " + res.model + ")" : "") + ". Review it, then use or copy." : "The model returned nothing. Try another model.");
      $("aiUse").style.display = scope === "scene" ? "" : "none";
    } catch (e) {
      const m = String(e.message || e); dbg("Result: " + m); console.error("[Promptoo AI] failed:", e);
      status(/Failed to fetch|NetworkError|Load failed/i.test(m)
        ? "Could not reach the provider. That usually means the address is wrong, the server is off, or the provider blocks browser requests (CORS). For Cloudflare, use the Worker option."
        : m);
    } finally { $("aiRun").disabled = false; }
  };
  $("aiUse").onclick = () => {
    const v = $("aiOut").value.trim(); if (!v) return;
    sc().manual = v; $("ai").hidden = true; render(false); toast("Scene prompt replaced ✓");
  };
  $("aiCopy").onclick = () => copy($("aiOut").value);
})();
