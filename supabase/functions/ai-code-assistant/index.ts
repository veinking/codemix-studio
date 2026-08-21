import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const requestSchema = z.object({
  action: z.enum(["ask", "review", "complete"]),
  code: z.string().max(51_200, "Code must be less than 50KB"),
  prompt: z.string().max(2_000, "Prompt must be less than 2000 characters").optional(),
  selectedCode: z.string().max(51_200, "Selected code must be less than 50KB").optional(),
  language: z.string().min(1).max(50, "Language name too long"),
  model: z.enum(["gemini-2.5-flash-lite", "gemini-2.5-flash"]),
  apiKey: z.string().min(20, "Gemini API key is missing").max(256, "Gemini API key is invalid"),
});

type AssistInput = z.infer<typeof requestSchema>;

function prompts(input: AssistInput) {
  const target = input.selectedCode?.trim() || input.code.trim();

  if (input.action === "complete") {
    return {
      system: `You are a precise ${input.language} coding assistant inside a browser IDE. Complete or improve the supplied code while preserving the user's apparent intent. Return only code. Do not use markdown fences. Prefer browser-compatible dependencies and concise, maintainable code.`,
      user: input.prompt?.trim()
        ? `Goal: ${input.prompt.trim()}\n\nCurrent code:\n${target}`
        : `Complete this ${input.language} code:\n${target}`,
    };
  }

  if (input.action === "review") {
    return {
      system: `You are a concise ${input.language} code reviewer. Identify real bugs, correctness risks, security issues, performance problems, and the highest-value maintainability improvements. Do not invent problems. Prioritize concrete fixes and keep the response compact.`,
      user: `Review this ${input.language} code:\n${target}`,
    };
  }

  return {
    system: `You are a concise coding assistant inside bIDE. Answer the user's question about their ${input.language} code. Prefer specific, executable guidance. If the code is already correct, say so rather than manufacturing changes.`,
    user: `${input.prompt?.trim() || "Help me understand this code."}\n\nCurrent code:\n${target}`,
  };
}

function providerErrorMessage(status: number) {
  if (status === 400 || status === 401 || status === 403) {
    return "Gemini rejected this API key, model, or request. Check your key and Gemini API access.";
  }
  if (status === 429) return "Gemini rate limit reached for this key. Try again later or use a different key.";
  if (status >= 500) return "Gemini is temporarily unavailable. Try again later.";
  return "Gemini could not complete this request.";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed." }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const validation = requestSchema.safeParse(await req.json());
    if (!validation.success) {
      return new Response(JSON.stringify({
        error: validation.error.errors.map((issue) => issue.message).join(", "),
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const input = validation.data;
    if (input.action === "ask" && !input.prompt?.trim()) {
      return new Response(JSON.stringify({ error: "Ask a question first." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if ((input.action === "review" || input.action === "complete") && !(input.selectedCode?.trim() || input.code.trim())) {
      return new Response(JSON.stringify({ error: "There is no code to send." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { system, user } = prompts(input);
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${input.model}:generateContent`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": input.apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: {
          temperature: input.action === "complete" ? 0.2 : 0.35,
          maxOutputTokens: 2_000,
        },
      }),
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: providerErrorMessage(response.status) }), {
        status: response.status === 429 ? 429 : response.status >= 500 ? 502 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const result = Array.isArray(data?.candidates?.[0]?.content?.parts)
      ? data.candidates[0].content.parts
          .map((part: { text?: unknown }) => typeof part?.text === "string" ? part.text : "")
          .join("")
          .trim()
      : "";

    if (!result) {
      return new Response(JSON.stringify({ error: "Gemini returned no usable text for this request." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ result, action: input.action, model: input.model }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Code Assist request failed." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
});
