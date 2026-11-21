/* Promptoo: optional "Rewrite with AI". Bring your own key. Works with Anthropic and with any
   OpenAI-compatible provider (OpenRouter, Cloudflare, Groq, Gemini, Ollama, LM Studio, or a custom URL).
   Keys stay in this browser and go only to the provider you pick. */
(function () {
  const $ = id => document.getElementById(id);
  const PROV = {
    anthropic: { label: "Anthropic (Claude)", kind: "anthropic", base: "https://api.anthropic.com",
      models: ["claude-sonnet-5-5", "claude-haiku-5-5", "claude-opus-5-5"], note: "Paid. Get a key at console.anthropic.com." },
    openrouter: { label: "OpenRouter (free models available)", kind: "openai", base: "https://openrouter.ai/api/v1",
      models: ["openrouter/free", "meta-llama/llama-3.2-3b-instruct:free"], note: "Free models end in :free, or use openrouter/free, which picks one for you. Free models are rate limited. Get a key at openrouter.ai." },
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
    "Do not add explanations, headings, markdown or quotation marks around the result. Output only the rewritten prompt.";

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
    $("aiSend").textContent = p.kind === "anthropic" ? "api.anthropic.com" : p.nokey ? "your own computer" : "the provider you chose";
  }
  const open = scope => { $("aiScope").value = scope; $("ai").hidden = false; status(""); showProv(); };
  $("aiBtn").onclick = () => open("scene");
  $("aiBtn2").onclick = () => open("full");
  $("aiClose").onclick = () => { $("ai").hidden = true; };
  $("ai").addEventListener("mousedown", e => { if (e.target === $("ai")) $("ai").hidden = true; });
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
  async function callAnthropic(key, model, user) {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
      body: JSON.stringify({ model, max_tokens: 1500, system: SYSTEM, messages: [{ role: "user", content: user }] })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`Error ${r.status}: ${errText(j)}`);
    return (j.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
  }
  const textOf = c => typeof c === "string" ? c : Array.isArray(c) ? c.map(x => (x && (x.text || x.content)) || "").join("") : "";
  async function callOpenAI(base, key, model, user, opts) {
    opts = opts || {};
    const msgs = opts.fold ? [{ role: "user", content: SYSTEM + "\n\n" + user }] : [{ role: "system", content: SYSTEM }, { role: "user", content: user }];
    const body = { model, messages: msgs }; body[opts.tokenParam || "max_tokens"] = 3000;
    const headers = { "content-type": "application/json" };
    if (key) headers.authorization = "Bearer " + key;
    const url = base + "/chat/completions", host = url.replace(/^https?:\/\//, "").split("/")[0];
    const r = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    const raw = await r.text(); let j;
    try { j = JSON.parse(raw); } catch (e) { throw new Error(`Unexpected reply from ${host} (status ${r.status}). It was not JSON: ${raw.slice(0, 140).replace(/\s+/g, " ")}. Check the base URL.`); }
    if (!r.ok || j.error) {
      const m = errText(j);
      if (!opts.tokenParam && /max_completion_tokens/.test(m)) return callOpenAI(base, key, model, user, Object.assign({}, opts, { tokenParam: "max_completion_tokens" }));
      if (!opts.fold && /developer instruction|system (role|message|prompt)|system_instruction/i.test(m)) return callOpenAI(base, key, model, user, Object.assign({}, opts, { fold: true }));
      throw new Error(`Error ${(j.error && j.error.code) || r.status}: ${m}`);
    }
    const ch = j.choices && j.choices[0], msg = (ch && ch.message) || {}, text = textOf(msg.content);
    if (!text.trim()) {
      const reasoning = msg.reasoning || msg.reasoning_content, why = ch && ch.finish_reason;
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
    $("aiRun").disabled = true; status("Rewriting…");
    try {
      const res = p.kind === "anthropic" ? await callAnthropic(key, model, user) : await callOpenAI(baseUrl(p), key, model, user), out = String(res).trim();
      $("aiOut").value = out;
      status(out ? "Done" + (res.model ? " (answered by " + res.model + ")" : "") + ". Review it, then use or copy." : "The model returned nothing. Try another model.");
      $("aiUse").style.display = scope === "scene" ? "" : "none";
    } catch (e) {
      const m = String(e.message || e);
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
