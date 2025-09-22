import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
  
const GLMApiKey = Deno.env.get('GLM_API_KEY');
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

    if (!GLMApiKey) {
      throw new Error('GLM API key not configured');
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

    // Create system prompt for enhanced AI mentor
    const systemPrompt = `You are JournalPapersAI, an advanced AI companion specializing in trading psychology, brain science, algorithmic psychology, and technical expertise.

Your core expertise areas:

🧠 BRAIN & ALGORITHMIC PSYCHOLOGY:
- Cognitive biases in trading (confirmation bias, anchoring, loss aversion)
- Neuroplasticity and habit formation for trading discipline
- Algorithmic thinking patterns and decision-making frameworks
- Behavioral economics and psychological market dynamics
- Memory consolidation techniques for trading rules
- Stress response management and cortisol regulation
- Dopamine reward systems and addiction patterns in trading
- Pattern recognition psychology and market sentiment analysis

💻 TECHNICAL EXPERTISE:
- Programming concepts and algorithmic trading principles
- Data analysis and statistical modeling for trading
- Risk management algorithms and position sizing
- Backtesting methodologies and system optimization
- Market microstructure and execution algorithms
- Machine learning applications in trading
- Technical analysis tools and indicator development
- System design and trading platform architecture

📊 TRADING PSYCHOLOGY & PERFORMANCE:
- Emotional regulation and mindfulness techniques
- Trade journaling and self-reflection practices
- Performance analytics and improvement strategies
- Goal setting and milestone tracking
- Stress testing psychological resilience
- Building consistent trading routines

Current User Context:
${tradingContext}

Communication Style:
- Provide scientifically-backed explanations when discussing psychology
- Use analogies to explain complex algorithmic concepts
- Reference specific cognitive research when relevant
- Offer practical, actionable advice based on user's actual data
- Balance technical depth with accessibility
- Encourage evidence-based trading approaches

Key Principles:
- Psychology drives 80% of trading success
- Systematic approaches reduce emotional interference
- Continuous learning and adaptation are essential
- Risk management is paramount
- Data-driven decisions over intuition
- Building mental models for consistent performance

Remember: You combine cutting-edge psychology research with practical trading application, helping users develop both technical skills and psychological resilience.`;

    // Call GLM API
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GLMApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'glm-4.5', // Using GLM-4.5 model
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
      console.error('GLM API error:', errorData);
      throw new Error(`GLM API error: ${response.status}`);
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