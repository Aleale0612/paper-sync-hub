import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { JournalPapersAIChat } from "@/components/journal/JournalPapersAIChat";
import { useChatHistory } from "@/hooks/useChatHistory";
import { useTradeAnalytics } from "@/hooks/useTradeAnalytics";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  History, 
  BarChart3, 
  Brain,
  TrendingUp,
  DollarSign,
  Target,
  Calendar,
  Percent
} from "lucide-react";

const JournalPapersAI = () => {
  const {
    chatSessions,
    currentSession,
    setCurrentSession,
    createNewSession,
    deleteSession,
    clearAllHistory
  } = useChatHistory();
  
  const { analytics, loading: analyticsLoading } = useTradeAnalytics();
  const { toast } = useToast();
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [loadingTrades, setLoadingTrades] = useState(true);

  // Load recent trades
  useEffect(() => {
    const loadRecentTrades = async () => {
      try {
        const { data, error } = await supabase
          .from('trades')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        setRecentTrades(data || []);
      } catch (error) {
        console.error('Error loading recent trades:', error);
      } finally {
        setLoadingTrades(false);
      }
    };

    loadRecentTrades();
  }, []);

  const handleNewChat = async () => {
    await createNewSession();
  };

  const handleClearHistory = () => {
    clearAllHistory();
  };

  const handleDeleteChat = (chatId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    deleteSession(chatId);
  };

  const formatCurrency = (amount: number) => {
    return `$${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="flex h-screen bg-background -mt-8 -mx-4">
      {/* Sidebar */}
      <div className="w-80 border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">JournalPapersAI</h1>
          </div>
          <Button 
            onClick={handleNewChat}
            className="w-full"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Chat History</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearHistory}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {chatSessions.map((chat) => (
                  <div
                    key={chat.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors relative group ${
                      currentSession === chat.id 
                        ? "bg-primary/10 border border-primary/20" 
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setCurrentSession(chat.id)}
                  >
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{chat.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(chat.updated_at)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                        onClick={(e) => handleDeleteChat(chat.id, e)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <Separator />

          {/* Trade History Review */}
          <div className="p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <History className="h-4 w-4" />
              Recent Trades
            </h3>
            
            {loadingTrades ? (
              <div className="text-sm text-muted-foreground">Loading trades...</div>
            ) : recentTrades.length > 0 ? (
              <div className="space-y-2 mb-4">
                {recentTrades.slice(0, 3).map((trade) => (
                  <Card key={trade.id} className="p-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs font-medium">{trade.pair}</p>
                        <p className="text-xs text-muted-foreground capitalize">{trade.direction}</p>
                      </div>
                      <div className={`text-xs font-medium ${
                        trade.result_usd >= 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        {trade.result_usd >= 0 ? '+' : ''}{formatCurrency(trade.result_usd)}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mb-4">No trades recorded yet</p>
            )}
            
            <Button variant="outline" size="sm" className="w-full" asChild>
              <a href="/journal/history">
                <History className="h-4 w-4 mr-2" />
                View All Trades
              </a>
            </Button>
          </div>

          <Separator />

          {/* Analytics Dashboard */}
          <div className="p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Quick Analytics
            </h3>
            
            {analyticsLoading ? (
              <div className="text-sm text-muted-foreground">Loading analytics...</div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    Total Trades
                  </span>
                  <Badge variant="secondary">{analytics.totalTrades}</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Percent className="h-3 w-3" />
                    Win Rate
                  </span>
                  <Badge variant="secondary">{analytics.winRate.toFixed(1)}%</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Total P&L
                  </span>
                  <span className={`text-xs font-medium ${
                    analytics.totalPnL >= 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    {analytics.totalPnL >= 0 ? '+' : ''}{formatCurrency(analytics.totalPnL)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Avg R:R
                  </span>
                  <Badge variant="outline">1:{analytics.avgRiskReward.toFixed(1)}</Badge>
                </div>
              </div>
            )}
            
            <Button variant="outline" size="sm" className="w-full mt-3" asChild>
              <a href="/journal/analytics">
                <BarChart3 className="h-4 w-4 mr-2" />
                Full Analytics
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">JournalPapersAI Chat</h2>
              <p className="text-sm text-muted-foreground">
                Your AI trading mentor for market analysis and performance insights
              </p>
            </div>
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 p-6 overflow-hidden">
          <JournalPapersAIChat sessionId={currentSession} />
        </div>
      </div>
    </div>
  );
};

export default JournalPapersAI;