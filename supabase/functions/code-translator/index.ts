import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-guest-fingerprint",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Lang = 'python' | 'r' | 'javascript' | 'sql';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sourceLanguage, targetLanguage, code } = await req.json() as {
      sourceLanguage: Lang;
      targetLanguage: Lang;
      code: string;
    };
    
    // Initialize Supabase client for usage tracking
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Extract user info or guest fingerprint
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    let guestFingerprint: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }
    
    if (!userId) {
      guestFingerprint = req.headers.get('x-guest-fingerprint');
    }
    
    console.log('[CODE-TRANSLATOR] Request from:', userId ? `user:${userId}` : `guest:${guestFingerprint}`);
    
    // Check usage limits
    const { data: usageCheck, error: usageError } = await supabase.rpc('check_ai_usage_limit', {
      p_user_id: userId,
      p_guest_fingerprint: guestFingerprint
    });
    
    if (usageError) {
      console.error('[CODE-TRANSLATOR] Usage check error:', usageError);
    } else if (usageCheck && !usageCheck.allowed) {
      console.log('[CODE-TRANSLATOR] Usage limit reached');
      return new Response(
        JSON.stringify({
          error: usageCheck.message,
          remaining: usageCheck.remaining,
          limit: usageCheck.limit,
          tier: usageCheck.tier,
          upgrade_required: true
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const languageMap: Record<Lang, string> = {
      python: "Python",
      r: "R",
      javascript: "JavaScript",
      sql: "SQL",
    };

    const systemPrompt = `You are an expert code translator. Translate code from ${languageMap[sourceLanguage]} to ${languageMap[targetLanguage]}.

Rules:
1. Preserve the logic and functionality exactly
2. Use idiomatic patterns for the target language
3. Add brief comments explaining any significant differences
4. For Python: Only use Pyodide-compatible libraries (pandas, numpy, matplotlib, etc.)
5. For R: Use base R or common packages (dplyr, ggplot2, etc.)
6. Return ONLY the translated code, no explanations outside code comments`;

    const userPrompt = `Translate this ${languageMap[sourceLanguage]} code to ${languageMap[targetLanguage]}:\n\n${code}`;

    console.log(`Translating from ${sourceLanguage} to ${targetLanguage}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      throw new Error("AI API request failed");
    }

    const data = await response.json();
    const translatedCode = data.choices[0].message.content;

    // Clean up markdown code blocks if present
    let cleanCode = translatedCode.trim();
    if (cleanCode.startsWith("```")) {
      cleanCode = cleanCode.replace(/^```[a-z]*\n/i, "").replace(/\n```$/i, "");
    }

    console.log(`Translation completed successfully`);
    
    // Record usage (fire and forget)
    supabase.rpc('record_ai_usage', {
      p_feature_name: 'code-translator',
      p_user_id: userId,
      p_guest_fingerprint: guestFingerprint,
      p_action_type: `${sourceLanguage}_to_${targetLanguage}`
    }).then(() => console.log('[CODE-TRANSLATOR] Usage recorded'));

    return new Response(
      JSON.stringify({ translatedCode: cleanCode }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in code-translator:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
