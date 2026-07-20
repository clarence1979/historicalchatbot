import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ModelEntry {
  id: string;
  created: number;
}

// Module-level cache — persists across warm invocations
let cachedModels: ModelEntry[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function fetchModels(apiKey: string): Promise<ModelEntry[]> {
  const now = Date.now();
  if (cachedModels && now - cacheTime < CACHE_TTL) return cachedModels;
  try {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return cachedModels ?? [];
    const raw = await res.json();
    // Sort newest first so filters always yield the latest model at index 0
    cachedModels = (raw.data as ModelEntry[]).sort((a, b) => b.created - a.created);
    cacheTime = now;
    return cachedModels;
  } catch {
    return cachedModels ?? [];
  }
}

// Tokens that disqualify a model from being a general chat model
const CHAT_EXCLUDE = [
  "tts", "image", "embedding", "realtime", "audio",
  "whisper", "moderation", "instruct", "search", "transcribe",
  "davinci", "babbage", "ada", "curie",
];

function isChatModel(id: string): boolean {
  if (!id.startsWith("gpt-")) return false;
  return !CHAT_EXCLUDE.some((token) => id.includes(token));
}

// "Fast" tier: smaller/cheaper variants
function isFastTier(id: string): boolean {
  return /mini|nano|micro/.test(id);
}

// Snapshot models carry a date stamp — prefer the stable alias instead
function isSnapshot(id: string): boolean {
  return /\d{4}-\d{2}-\d{2}/.test(id);
}

function selectChatModel(models: ModelEntry[], tier: "smart" | "fast"): string {
  const chat = models.filter((m) => isChatModel(m.id));

  if (tier === "fast") {
    // Prefer stable alias fast models; fall back to any fast model
    const alias = chat.filter((m) => isFastTier(m.id) && !isSnapshot(m.id));
    if (alias.length) return alias[0].id;
    const any = chat.filter((m) => isFastTier(m.id));
    if (any.length) return any[0].id;
    // Last resort: pick cheapest smart model (tail of sorted list)
    return chat[chat.length - 1]?.id ?? "gpt-4o-mini";
  }

  // Smart tier: prefer stable alias full-size models
  const alias = chat.filter((m) => !isFastTier(m.id) && !isSnapshot(m.id));
  if (alias.length) return alias[0].id;
  const any = chat.filter((m) => !isFastTier(m.id));
  if (any.length) return any[0].id;
  return chat[0]?.id ?? "gpt-4o";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { apiKey, tier, model, messages, temperature, max_tokens } = await req.json();

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API key is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Explicit model override is respected; tier (or absence of model) triggers auto-detection
    let resolvedModel = model;
    if (!resolvedModel || tier) {
      const models = await fetchModels(apiKey);
      resolvedModel = models.length
        ? selectChatModel(models, tier === "fast" ? "fast" : "smart")
        : tier === "fast" ? "gpt-4o-mini" : "gpt-4o";
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: resolvedModel,
        messages,
        temperature: temperature ?? 0.8,
        max_tokens: max_tokens ?? 800,
      }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${responseText}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!responseText) {
      return new Response(
        JSON.stringify({ error: "Empty response from OpenAI API" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = JSON.parse(responseText);
    return new Response(
      JSON.stringify({ ...data, _model: resolvedModel }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
