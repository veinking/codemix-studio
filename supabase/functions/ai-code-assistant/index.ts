import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, code, prompt, language, selectedCode } = await req.json();
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

      case "check":
        systemPrompt = `You are an expert ${language} code analyzer. Check the selected code for:
1. Syntax errors
2. Logic errors
3. Functionality issues
4. Improvement suggestions
Be specific and actionable.`;
        userPrompt = `Check this ${language} code:\n\n${selectedCode || code}`;
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
