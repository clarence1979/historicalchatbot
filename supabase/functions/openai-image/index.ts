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

// Matches gpt-image-*, dall-e-* — covers any future gpt-image-X release automatically
function isImageModel(id: string): boolean {
  return id.startsWith("gpt-image-") || id.startsWith("dall-e-");
}

function selectImageModel(models: ModelEntry[]): string {
  // Prefer stable alias models (no date stamp), newest first
  const alias = models.filter((m) => isImageModel(m.id) && !isSnapshot(m.id));
  if (alias.length) return alias[0].id;
  const any = models.filter((m) => isImageModel(m.id));
  return any[0]?.id ?? "gpt-image-1";
}

// gpt-image-* family: returns b64_json, quality accepts auto/low/medium/high
// dall-e-3: returns url, quality accepts standard/hd
// dall-e-2: returns url, no quality param
function resolveRequest(
  model: string,
  prompt: string,
  size: string,
  quality?: string
): { body: Record<string, unknown>; usesBase64: boolean } {
  const usesBase64 = model.startsWith("gpt-image-");

  const body: Record<string, unknown> = { model, prompt, n: 1, size };

  if (usesBase64) {
    // Normalise legacy quality names to gpt-image-* vocabulary
    const qmap: Record<string, string> = { standard: "medium", hd: "high" };
    body.quality = qmap[quality ?? ""] ?? quality ?? "auto";
  } else if (model === "dall-e-3") {
    const qmap: Record<string, string> = { medium: "standard", high: "hd", auto: "standard", low: "standard" };
    body.quality = qmap[quality ?? ""] ?? quality ?? "standard";
    // dall-e-3 defaults to url response — no need to set response_format
  }
  // dall-e-2: no quality field

  return { body, usesBase64 };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { apiKey, prompt, size, quality } = await req.json();

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API key is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const models = await fetchModels(apiKey);
    const model = selectImageModel(models);

    const { body, usesBase64 } = resolveRequest(model, prompt, size ?? "1024x1024", quality);

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${error}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    // Always return { data: [{ url }], _model } — callers never need to
    // know which model ran or whether it returned base64 or a URL.
    if (usesBase64) {
      const b64 = data.data?.[0]?.b64_json;
      if (!b64) {
        return new Response(
          JSON.stringify({ error: "No image data in response" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ data: [{ url: `data:image/png;base64,${b64}` }], _model: model }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ...data, _model: model }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
