import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-guest-fingerprint',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { headers, sampleRows, targetColumn, language } = await req.json();
    
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
    
    console.log('[DATA-ADVISOR] Request from:', userId ? `user:${userId}` : `guest:${guestFingerprint}`);
    
    // Check usage limits
    const { data: usageCheck, error: usageError } = await supabase.rpc('check_ai_usage_limit', {
      p_user_id: userId,
      p_guest_fingerprint: guestFingerprint
    });
    
    if (usageError) {
      console.error('[DATA-ADVISOR] Usage check error:', usageError);
    } else if (usageCheck && !usageCheck.allowed) {
      console.log('[DATA-ADVISOR] Usage limit reached');
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
    
    console.log('Data advisor request:', { 
      headersCount: headers?.length, 
      sampleRowsCount: sampleRows?.length,
      targetColumn,
      language 
    });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build context from sample data
    const dataContext = `
Dataset Info:
- Columns: ${headers.join(', ')}
- Sample rows: ${sampleRows.length}
- Target column: ${targetColumn || 'None specified'}
- Language: ${language.toUpperCase()}

Sample data (first 3 rows):
${JSON.stringify(sampleRows.slice(0, 3), null, 2)}
`;

    const systemPrompt = `You are an expert data scientist helping users clean and analyze their datasets. 
Based on the dataset information provided, suggest 3-5 actionable next steps for data cleaning, exploration, or modeling.
Then generate a complete, executable ${language.toUpperCase()} code snippet that implements your top recommendations.

Your recommendations should be:
- Specific to the actual columns and data types present
- Practical and immediately actionable
- Ordered by priority (most important first)

Format your response as:
RECOMMENDATIONS:
1. [First recommendation]
2. [Second recommendation]
3. [Third recommendation]
...

CODE:
\`\`\`${language}
[Complete executable code here]
\`\`\``;

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
          { role: 'user', content: dataContext }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
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
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('AI response received, length:', aiResponse.length);

    // Parse the response
    const recommendationsMatch = aiResponse.match(/RECOMMENDATIONS:(.*?)(?=CODE:|$)/s);
    const codeMatch = aiResponse.match(/CODE:\s*```(?:\w+)?\s*([\s\S]*?)```/);

    const recommendations = recommendationsMatch
      ? recommendationsMatch[1]
          .trim()
          .split('\n')
          .filter((line: string) => line.match(/^\d+\./))
          .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
      : ['Check for missing values', 'Explore data distributions', 'Validate data types'];

    const suggestedCode = codeMatch ? codeMatch[1].trim() : '';

    console.log('[DATA-ADVISOR] Recommendations generated successfully');
    
    // Record usage (fire and forget)
    supabase.rpc('record_ai_usage', {
      p_feature_name: 'data-advisor',
      p_user_id: userId,
      p_guest_fingerprint: guestFingerprint,
      p_action_type: language
    }).then(() => console.log('[DATA-ADVISOR] Usage recorded'));

    return new Response(
      JSON.stringify({ recommendations, suggestedCode }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in data-advisor function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
