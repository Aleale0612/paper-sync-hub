import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { JournalPapersAIChat } from "@/components/journal/JournalPapersAIChat";
import { useChatHistory } from "@/hooks/useChatHistory";
import { useTradeData } from "@/hooks/useTradeData";
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
  Percent,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const JournalPapersAI = () => {
  const {
    chatSessions,
    currentSession,
    setCurrentSession,
    createNewSession,
    deleteSession,
    clearAllHistory,
  } = useChatHistory();

  const { trades, analytics, loading: analyticsLoading } = useTradeData();
  const { toast } = useToast();
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [loadingTrades, setLoadingTrades] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(false);

  // Load recent trades
  useEffect(() => {
    const loadRecentTrades = async () => {
      try {
        const { data, error } = await supabase
          .from("trades")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) throw error;
        setRecentTrades(data || []);
      } catch (error) {
        console.error("Error loading recent trades:", error);
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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleChatHistory = () => {
    setIsChatHistoryOpen(!isChatHistoryOpen);
  };

  const formatCurrency = (amount: number) => {
    return `$${Math.abs(amount).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="flex h-[92.5vh] w-full bg-gradient-to-br from-background to-muted/20 overflow-hidden">
      {/* Toggle Sidebar Button */}
      {!isSidebarOpen && (
        <Button
          variant="outline"
          size="icon"
          className="absolute top-4 left-4 z-20 rounded-full shadow-md bg-background"
          onClick={toggleSidebar}
        >
          <Menu className="h-4 w-4" />
        </Button>
      )}

      {/* Sidebar */}
      <div
        className={`flex-shrink-0 border-r border-border/50 bg-card/50 backdrop-blur-sm h-full flex flex-col transition-all duration-300 ${
          isSidebarOpen ? "w-[20rem] max-w-[25vw] min-w-[16rem]" : "w-0"
        } overflow-hidden`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-border/50 bg-gradient-to-r from-primary/10 to-transparent flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
              </div>
              <div className="truncate">
                <h1 className="text-xl font-bold truncate">JournalPapersAI</h1>
                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  <Badge
                    variant="outline"
                    className="text-xs bg-primary/5 border-primary/20"
                  >
                    GLM-4.5
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="text-xs bg-green-100 text-green-800"
                  >
                    Active
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          <Button
            onClick={handleNewChat}
            className="w-full shadow-sm mt-4"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Scrollable Sidebar Content */}
        <div className="flex-1 overflow-auto flex flex-col">
          {/* Chat History */}
          <div className={`p-5 ${chatSessions.length === 0 ? "hidden" : "flex-shrink-0"}`} >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Chat History
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearHistory}
                className="text-muted-foreground hover:text-destructive p-1 h-auto"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>

            <div className="h-[10rem] max-h-[20vh]">
              <ScrollArea className="h-full w-full">
                <div className="space-y-2 pb-1">
                  {chatSessions.length === 0 ? (
                    <div className="text-center py-4">
                      <MessageSquare className="h-6 w-6 text-muted-foreground mx-auto mb-2 opacity-50" />
                      <p className="text-xs text-muted-foreground">
                        No chat history
                      </p>
                    </div>
                  ) : (
                    chatSessions.map((chat) => (
                      <div
                        key={chat.id}
                        className={`p-3 rounded-xl cursor-pointer transition-all relative group ${
                          currentSession === chat.id
                            ? "bg-primary/10 border border-primary/20 shadow-sm"
                            : "hover:bg-muted/60"
                        }`}
                        onClick={() => setCurrentSession(chat.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="bg-primary/10 p-1.5 rounded-md flex-shrink-0">
                            <MessageSquare className="h-3 w-3 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-xs truncate">
                              {chat.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
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
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          <Separator className="flex-shrink-0" />

          {/* Recent Trades */}
          <div className="p-5 flex-shrink-0">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Recent Trades
            </h3>

            {loadingTrades ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span className="text-xs text-muted-foreground">
                  Loading trades...
                </span>
              </div>
            ) : recentTrades.length > 0 ? (
              <div className="space-y-3 mb-4">
                {recentTrades.slice(0, 2).map((trade) => (
                  <Card
                    key={trade.id}
                    className="p-3 shadow-sm border-border/50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium">{trade.pair}</p>
                          <Badge
                            variant={
                              trade.direction === "buy"
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs h-5 px-1"
                          >
                            {trade.direction === "buy" ? (
                              <ArrowUpRight className="w-3 h-3" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3" />
                            )}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(trade.created_at)}
                        </p>
                      </div>
                      <div
                        className={`text-sm font-medium ${
                          trade.result_usd >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {trade.result_usd >= 0 ? "+" : ""}
                        {formatCurrency(trade.result_usd)}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 bg-muted/30 rounded-lg mb-4">
                <History className="h-6 w-6 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground mb-3">
                  No trades yet
                </p>
                <Button variant="outline" size="sm" className="text-xs" asChild>
                  <a href="/journal/add-trade">Add Your First Trade</a>
                </Button>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs justify-between"
              asChild
            >
              <a href="/journal/history">
                <span>View All Trades</span>
                <ChevronRight className="h-3 w-3" />
              </a>
            </Button>
          </div>

          <Separator className="flex-shrink-0" />

          {/* Analytics */}
          <div className="p-5 pb-6 flex-shrink-0">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Analytics Dashboard
            </h3>

            {analyticsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span className="text-xs text-muted-foreground">
                  Loading analytics...
                </span>
              </div>
            ) : analytics ? (
              <div className="space-y-3">
                <Card className="p-3 shadow-sm border-border/50">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      Total Trades
                    </span>
                    <Badge variant="secondary" className="text-sm">
                      {analytics.totalTrades}
                    </Badge>
                  </div>
                </Card>

                <Card className="p-3 shadow-sm border-border/50">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Percent className="h-4 w-4 text-primary" />
                      Win Rate
                    </span>
                    <Badge
                      variant={analytics.winRate >= 50 ? "default" : "destructive"}
                      className="text-sm"
                    >
                      {analytics.winRate.toFixed(1)}%
                    </Badge>
                  </div>
                </Card>

                <Card className="p-3 shadow-sm border-border/50">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      Total P&L
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        analytics.totalPnL >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {analytics.totalPnL >= 0 ? "+" : ""}
                      {formatCurrency(analytics.totalPnL)}
                    </span>
                  </div>
                </Card>

                {analytics.profitFactor && (
                  <Card className="p-3 shadow-sm border-border/50">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Profit Factor
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          analytics.profitFactor >= 1
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {analytics.profitFactor.toFixed(2)}
                      </span>
                    </div>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-4 bg-muted/30 rounded-lg">
                <BarChart3 className="h-6 w-6 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground mb-3">
                  No analytics data
                </p>
                <Button variant="outline" size="sm" className="text-xs" asChild>
                  <a href="/journal/add-trade">Add Trades to See Analytics</a>
                </Button>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4 text-xs justify-between"
              asChild
            >
              <a href="/journal/analytics">
                <span>Full Analytics View</span>
                <ChevronRight className="h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Sliding Panel (only visible when sidebar is hidden) */}
      {!isSidebarOpen && (
        <div
          className={`absolute top-0 left-0 h-full w-[20rem] max-w-[80vw] min-w-[16rem] bg-card/90 backdrop-blur-md border-r border-border/50 z-10 transform transition-transform duration-300 ${
            isChatHistoryOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-4 border-b border-border/50 flex justify-between items-center">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Chat History
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleChatHistory}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-4 h-full overflow-hidden flex flex-col">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearHistory}
              className="text-muted-foreground hover:text-destructive p-1 h-auto mb-4"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear History
            </Button>

            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full w-full">
                <div className="space-y-2 pb-1">
                  {chatSessions.length === 0 ? (
                    <div className="text-center py-4">
                      <MessageSquare className="h-6 w-6 text-muted-foreground mx-auto mb-2 opacity-50" />
                      <p className="text-xs text-muted-foreground">
                        No chat history
                      </p>
                    </div>
                  ) : (
                    chatSessions.map((chat) => (
                      <div
                        key={chat.id}
                        className={`p-3 rounded-xl cursor-pointer transition-all relative group ${
                          currentSession === chat.id
                            ? "bg-primary/10 border border-primary/20 shadow-sm"
                            : "hover:bg-muted/60"
                        }`}
                        onClick={() => {
                          setCurrentSession(chat.id);
                          setIsChatHistoryOpen(false);
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="bg-primary/10 p-1.5 rounded-md flex-shrink-0">
                            <MessageSquare className="h-3 w-3 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-xs truncate">
                              {chat.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
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
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button (only visible when sidebar is hidden) */}
      {!isSidebarOpen && !isChatHistoryOpen && (
        <Button
          variant="outline"
          size="icon"
          className="absolute top-16 left-4 z-20 rounded-full shadow-md bg-background"
          onClick={toggleChatHistory}
        >
          <MessageSquare className="h-4 w-4" />
        </Button>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <JournalPapersAIChat sessionId={currentSession} />
        </div>
      </div>
    </div>
  );
};

export default JournalPapersAI;