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

let cachedModels: ModelEntry[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000;

async function fetchModels(apiKey: string): Promise<ModelEntry[]> {
  const now = Date.now();
  if (cachedModels && now - cacheTime < CACHE_TTL) return cachedModels;
  try {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return cachedModels ?? [];
    const raw = await res.json();
    cachedModels = (raw.data as ModelEntry[]).sort((a, b) => b.created - a.created);
    cacheTime = now;
    return cachedModels;
  } catch {
    return cachedModels ?? [];
  }
}

function isSnapshot(id: string): boolean {
  return /\d{4}-\d{2}-\d{2}/.test(id);
}

// Matches tts-1, tts-1-hd, gpt-4o-tts, gpt-4o-mini-tts, and any future *-tts model
function isTtsModel(id: string): boolean {
  return id.startsWith("tts-") || id.endsWith("-tts");
}

function selectTtsModel(models: ModelEntry[]): string {
  // Prefer stable alias models (no date stamp), newest first
  const alias = models.filter((m) => isTtsModel(m.id) && !isSnapshot(m.id));
  if (alias.length) return alias[0].id;
  const any = models.filter((m) => isTtsModel(m.id));
  return any[0]?.id ?? "tts-1";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { apiKey, text, voice, speed } = await req.json();

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API key is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const models = await fetchModels(apiKey);
    const model = selectTtsModel(models);

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: text,
        voice: voice ?? "alloy",
        speed: speed ?? 1.0,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${error}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    return new Response(audioBuffer, {
      headers: { ...corsHeaders, "Content-Type": "audio/mpeg" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
