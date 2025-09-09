import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, sessionId, userId } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Processing chat request for user:', userId);

    // Get user's trade data for context
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (tradesError) {
      console.error('Error fetching trades:', tradesError);
    }

    // Calculate trading analytics
    const totalTrades = trades?.length || 0;
    const profitableTrades = trades?.filter(trade => trade.result_usd > 0).length || 0;
    const winRate = totalTrades > 0 ? (profitableTrades / totalTrades * 100).toFixed(1) : '0';
    const totalPnL = trades?.reduce((sum, trade) => sum + (trade.result_usd || 0), 0) || 0;

    // Create trading context for AI
    const tradingContext = `
Trading Performance Summary:
- Total Trades: ${totalTrades}
- Win Rate: ${winRate}%
- Total P&L: ${totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString()} USD
- Recent Trades: ${trades?.slice(0, 5).map(trade => 
  `${trade.pair} ${trade.direction} - ${trade.result_usd > 0 ? 'Profit' : 'Loss'}: $${trade.result_usd}`
).join(', ') || 'No recent trades'}

Trading Psychology Notes from Recent Trades:
${trades?.slice(0, 3).filter(trade => trade.emotional_psychology).map(trade => 
  `- ${trade.pair}: ${trade.emotional_psychology}`
).join('\n') || 'No psychology notes recorded'}
    `;

    // Create system prompt for trading mentor
    const systemPrompt = `You are JournalPapersAI, an intelligent trading companion and mentor specializing in trading psychology and performance analysis. 

Your core capabilities:
1. Trading Psychology: Help with emotional control, FOMO, revenge trading, discipline, mindset improvement
2. Performance Analysis: Analyze trading patterns, suggest improvements
3. Market Insights: Provide educational content about trading strategies and risk management
4. Trade Review: Help analyze past trades and identify learning opportunities

Current User Context:
${tradingContext}

Guidelines:
- Be supportive and constructive in your feedback
- Focus on psychological aspects of trading and continuous improvement
- Provide actionable advice based on the user's trading data
- If asked about specific trades, reference their actual performance data
- Always prioritize risk management and emotional discipline
- Keep responses concise but informative
- When discussing analytics, use the actual data provided above

Remember: You're not providing financial advice, but rather helping with trading psychology, education, and performance analysis.`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('AI response generated successfully');

    return new Response(JSON.stringify({ 
      response: aiResponse,
      sessionId: sessionId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in journalpapers-ai-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});