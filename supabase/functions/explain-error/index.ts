import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-guest-fingerprint',
};

// Input validation schema
const requestSchema = z.object({
  error: z.string().max(5000, 'Error message too long'),
  code: z.string().max(51200, 'Code must be less than 50KB'),
  language: z.string().max(50, 'Language name too long'),
  lineNumber: z.number().int().positive().optional()
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const validation = requestSchema.safeParse(body);
    if (!validation.success) {
      console.error('[EXPLAIN-ERROR] Validation error:', validation.error.flatten());
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input: ' + validation.error.errors.map(e => e.message).join(', ')
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { error, code, language, lineNumber } = validation.data;
    
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
    
    console.log('[EXPLAIN-ERROR] Request from:', userId ? `user:${userId}` : `guest:${guestFingerprint}`);
    
    // Check usage limits
    const { data: usageCheck, error: usageError } = await supabase.rpc('check_ai_usage_limit', {
      p_user_id: userId,
      p_guest_fingerprint: guestFingerprint
    });
    
    if (usageError) {
      console.error('[EXPLAIN-ERROR] Usage check error:', usageError);
    } else if (usageCheck && !usageCheck.allowed) {
      console.log('[EXPLAIN-ERROR] Usage limit reached');
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
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an educational programming assistant that explains coding errors to students in Plain English.

Your goal is to help students LEARN from their mistakes, not just fix them.

For each error, provide:
1. **What happened**: Explain the error in simple, student-friendly language (1-2 sentences)
2. **Why it happened**: Explain the root cause - what concept or rule was violated (2-3 sentences)
3. **How to fix it**: Provide actionable steps with a small code example if relevant (2-4 sentences)
4. **Learn more**: Suggest 1-2 key concepts to study (e.g., "Learn about: variable scope, function declarations")

Guidelines:
- Use analogies and everyday examples when helpful
- Avoid jargon, but introduce proper terminology gently
- Be encouraging and positive - errors are learning opportunities
- Reference the specific line number when available
- Keep explanations concise but thorough
- If the error involves a specific ${language} concept, explain it clearly

Return your response as a JSON object with this structure:
{
  "what": "Plain English description of what went wrong",
  "why": "Explanation of the root cause",
  "fix": "How to fix it with example code if relevant",
  "concepts": ["Concept 1", "Concept 2"]
}`;

    const userPrompt = `Language: ${language}
${lineNumber ? `Line number: ${lineNumber}` : ''}

Error message:
${error}

Code context:
\`\`\`${language}
${code}
\`\`\`

Please explain this error to a student learning to code.`;

    console.log('Calling Lovable AI to explain error:', { language, lineNumber });

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Parse the JSON response from the AI
    let explanation;
    try {
      explanation = JSON.parse(aiResponse);
    } catch (e) {
      // Fallback if AI doesn't return valid JSON
      explanation = {
        what: aiResponse.substring(0, 200),
        why: 'Unable to parse detailed explanation',
        fix: 'Please review the error message and code carefully',
        concepts: ['Error handling']
      };
    }

    console.log('[EXPLAIN-ERROR] Explanation generated successfully');
    
    // Record usage (fire and forget)
    supabase.rpc('record_ai_usage', {
      p_feature_name: 'explain-error',
      p_user_id: userId,
      p_guest_fingerprint: guestFingerprint,
      p_action_type: null
    }).then(() => console.log('[EXPLAIN-ERROR] Usage recorded'));

    return new Response(
      JSON.stringify({ explanation }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in explain-error function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
