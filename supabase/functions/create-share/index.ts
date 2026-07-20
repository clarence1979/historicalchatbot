import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SLUG_RE = /^[0-9a-f]{16}$/;
const REQUIRED_FIELDS = ["id", "name", "biography", "occupation", "timePeriod"];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { share_slug, character_data } = await req.json();

    // Validate slug format — must be the 16-char hex we generate on the client
    if (!share_slug || !SLUG_RE.test(share_slug)) {
      return new Response(
        JSON.stringify({ error: "Invalid share slug" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate character data is a non-null object with required fields
    if (!character_data || typeof character_data !== "object" || Array.isArray(character_data)) {
      return new Response(
        JSON.stringify({ error: "Invalid character data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    for (const field of REQUIRED_FIELDS) {
      if (!character_data[field]) {
        return new Response(
          JSON.stringify({ error: `Missing required character field: ${field}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Service-role client bypasses RLS — no direct client inserts are permitted
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabase.from("shared_characters").insert({
      share_slug,
      character_data,
    });

    if (error) {
      // Duplicate slug is a benign race condition — treat as success
      if (error.code === "23505") {
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
