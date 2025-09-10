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
      <div className="w-72 border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-bold">JournalPapersAI</h1>
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
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm">Chat History</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearHistory}
                className="text-muted-foreground hover:text-destructive p-1 h-auto"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            
            <ScrollArea className="h-[160px]">
              <div className="space-y-1">
                {chatSessions.map((chat) => (
                  <div
                    key={chat.id}
                    className={`p-2 rounded-md cursor-pointer transition-colors relative group ${
                      currentSession === chat.id 
                        ? "bg-primary/10 border border-primary/20" 
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setCurrentSession(chat.id)}
                  >
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs truncate">{chat.title}</p>
                        <p className="text-xs text-muted-foreground">
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
          <div className="p-3">
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-1">
              <History className="h-3 w-3" />
              Recent Trades
            </h3>
            
            {loadingTrades ? (
              <div className="text-xs text-muted-foreground">Loading...</div>
            ) : recentTrades.length > 0 ? (
              <div className="space-y-1 mb-3">
                {recentTrades.slice(0, 2).map((trade) => (
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
              <p className="text-xs text-muted-foreground mb-3">No trades yet</p>
            )}
            
            <Button variant="outline" size="sm" className="w-full text-xs" asChild>
              <a href="/journal/history">
                <History className="h-3 w-3 mr-1" />
                View All
              </a>
            </Button>
          </div>

          <Separator />

          {/* Analytics Dashboard */}
          <div className="p-3">
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              Analytics
            </h3>
            
            {analyticsLoading ? (
              <div className="text-xs text-muted-foreground">Loading...</div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    Trades
                  </span>
                  <Badge variant="secondary" className="text-xs">{analytics.totalTrades}</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Percent className="h-3 w-3" />
                    Win Rate
                  </span>
                  <Badge variant="secondary" className="text-xs">{analytics.winRate.toFixed(1)}%</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    P&L
                  </span>
                  <span className={`text-xs font-medium ${
                    analytics.totalPnL >= 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    {analytics.totalPnL >= 0 ? '+' : ''}{formatCurrency(analytics.totalPnL)}
                  </span>
                </div>
              </div>
            )}
            
            <Button variant="outline" size="sm" className="w-full mt-2 text-xs" asChild>
              <a href="/journal/analytics">
                <BarChart3 className="h-3 w-3 mr-1" />
                Full View
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">JournalPapersAI Chat</h2>
              <p className="text-sm text-muted-foreground">
                Your AI trading mentor for analysis and insights
              </p>
            </div>
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 p-4 overflow-hidden">
          <JournalPapersAIChat sessionId={currentSession} />
        </div>
      </div>
    </div>
  );
};

export default JournalPapersAI;