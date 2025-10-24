import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-guest-fingerprint",
};

// Input validation schema
const requestSchema = z.object({
  action: z.enum(['scan', 'autofill', 'autocomplete', 'explain', 'check', 'optimize']),
  code: z.string().max(51200, 'Code must be less than 50KB'),
  prompt: z.string().max(1000, 'Prompt must be less than 1000 characters').optional(),
  selectedCode: z.string().max(51200, 'Selected code must be less than 50KB').optional(),
  language: z.string().max(50, 'Language name too long'),
  isMobile: z.boolean().optional()
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const validation = requestSchema.safeParse(body);
    if (!validation.success) {
      console.error('[AI-CODE-ASSISTANT] Validation error:', validation.error.flatten());
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input: ' + validation.error.errors.map(e => e.message).join(', ')
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { action, code, prompt, language, selectedCode, isMobile } = validation.data;
    
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
    
    console.log('[AI-CODE-ASSISTANT] Request from:', userId ? `user:${userId}` : `guest:${guestFingerprint}`);
    
    // Check usage limits
    const { data: usageCheck, error: usageError } = await supabase.rpc('check_ai_usage_limit', {
      p_user_id: userId,
      p_guest_fingerprint: guestFingerprint
    });
    
    if (usageError) {
      console.error('[AI-CODE-ASSISTANT] Usage check error:', usageError);
    } else if (usageCheck && !usageCheck.allowed) {
      console.log('[AI-CODE-ASSISTANT] Usage limit reached');
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

    let systemPrompt = "";
    let userPrompt = "";

    // Different prompts based on action type
    switch (action) {
      case "scan":
        systemPrompt = `You are an expert code reviewer for ${language}. Analyze the code and provide:
1. Potential bugs or errors
2. Performance improvements
3. Best practices suggestions
4. Security concerns
Keep suggestions concise and actionable.`;
        userPrompt = `Review this ${language} code:\n\n${code}`;
        break;

      case "autofill":
        systemPrompt = `You are an expert ${language} developer. Based on the user's goal, write complete, functional code.
Return ONLY the code, no explanations or markdown formatting.`;
        userPrompt = `Goal: ${prompt}\n\nGenerate ${language} code to accomplish this goal.`;
        break;

      case "autocomplete":
        systemPrompt = `You are an expert ${language} developer. Complete the user's code based on their goal and existing code.
Return ONLY the completed code, no explanations or markdown formatting.`;
        userPrompt = prompt 
          ? `Goal: ${prompt}\n\nComplete this ${language} code:\n\n${code}`
          : `Complete this ${language} code based on context:\n\n${code}`;
        break;

      case "explain":
        systemPrompt = `You are an expert ${language} educator. Explain the selected code in plain English for a college student:
1. What does this code do? (high-level purpose)
2. How does it work? (step-by-step breakdown)
3. Key concepts used (e.g., loops, functions, data structures)
4. Common use cases for this pattern
Be clear, educational, and encouraging.`;
        userPrompt = `Explain this ${language} code:\n\n${selectedCode || code}`;
        break;

      case "check":
        systemPrompt = `You are an expert ${language} code analyzer. Check the selected code for:
1. Syntax errors
2. Logic errors
3. Functionality issues
4. Improvement suggestions
Be specific and actionable.`;
        userPrompt = `Check this ${language} code:\n\n${selectedCode || code}`;
        break;

      case "optimize":
        const languageGuidelines: Record<string, string> = {
          python: 'IMPORTANT: Only use libraries that work in Pyodide (browser Python). NEVER use: tkinter, PyQt, turtle, threading, multiprocessing, sqlite3, or any GUI libraries. For data viz use matplotlib/plotly, for data use pandas/numpy.',
          r: 'Use webR-compatible R code with base R or common packages (dplyr, ggplot2, tidyr, stringr). Use ggplot2 for visualizations. Avoid packages requiring system dependencies or compiled code.',
          javascript: 'Use modern ES6+ syntax. Prefer async/await over promises. Use functional patterns (map, filter, reduce). Avoid unnecessary dependencies.',
          sql: 'Write standard SQLite-compatible SQL. Use proper indexing, joins, and query optimization. Avoid vendor-specific extensions.',
        };

        systemPrompt = `You are an expert ${language} developer specializing in code optimization and best practices.
Your task:
1. Optimize the code for performance, readability, and maintainability
2. Apply ${language} best practices and idiomatic patterns
3. Add clear, concise comments explaining:
   - What each major section/function does
   - Why specific optimizations were made
   - Any important logic or edge cases
4. ${languageGuidelines[language] || ''}
5. ${isMobile ? 'CRITICAL: This code will run on a MOBILE device. Optimize for limited memory and processing power. Avoid heavy computations and large data processing.' : ''}

Return ONLY the optimized code with inline comments. No explanations outside the code.`;
        userPrompt = `Optimize this ${language} code with best practices and explanatory comments:\n\n${code}`;
        break;

      default:
        throw new Error("Invalid action type");
    }

    console.log(`AI Assistant: ${action} request for ${language}`);

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
        temperature: 0.7,
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
    const result = data.choices[0].message.content;

    console.log(`AI Assistant: ${action} completed successfully`);
    
    // Record usage (fire and forget)
    supabase.rpc('record_ai_usage', {
      p_feature_name: 'ai-code-assistant',
      p_user_id: userId,
      p_guest_fingerprint: guestFingerprint,
      p_action_type: action
    }).then(() => console.log('[AI-CODE-ASSISTANT] Usage recorded'));

    return new Response(
      JSON.stringify({ result, action }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-code-assistant:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
