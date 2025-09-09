// This file was migrated from the journalpapers repository
// Original path: src/pages/TradingMentor.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TradingMentorChat } from "@/components/journal/TradingMentorChat";
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  History, 
  BarChart3, 
  Brain,
  TrendingUp,
  DollarSign,
  Target
} from "lucide-react";

interface ChatHistory {
  id: string;
  title: string;
  timestamp: Date;
  preview: string;
}

interface TradeStats {
  totalTrades: number;
  winRate: number;
  totalPnL: number;
  avgRiskReward: number;
}

const TradingMentor = () => {
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([
    {
      id: "1",
      title: "Market Analysis Discussion",
      timestamp: new Date(Date.now() - 86400000),
      preview: "Discussion about EUR/USD trends and..."
    },
    {
      id: "2", 
      title: "Risk Management Tips",
      timestamp: new Date(Date.now() - 172800000),
      preview: "How to calculate proper position sizes..."
    }
  ]);
  
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // Mock trade stats - in real app, fetch from Supabase
  const tradeStats: TradeStats = {
    totalTrades: 24,
    winRate: 67.5,
    totalPnL: 1250000,
    avgRiskReward: 1.8
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
    // Reset chat in TradingMentorChat component
  };

  const handleClearHistory = () => {
    setChatHistory([]);
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  return (
    <div className="flex h-screen bg-background">
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
                {chatHistory.map((chat) => (
                  <div
                    key={chat.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      currentChatId === chat.id 
                        ? "bg-primary/10 border border-primary/20" 
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setCurrentChatId(chat.id)}
                  >
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{chat.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{chat.preview}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {chat.timestamp.toLocaleDateString()}
                        </p>
                      </div>
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
              Trade History Review
            </h3>
            <Card className="mb-4">
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{tradeStats.totalTrades}</p>
                  <p className="text-xs text-muted-foreground">Total Trades</p>
                </div>
              </CardContent>
            </Card>
            <Button variant="outline" size="sm" className="w-full">
              <History className="h-4 w-4 mr-2" />
              View All Trades
            </Button>
          </div>

          <Separator />

          {/* Analytics Dashboard */}
          <div className="p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Quick Analytics
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Win Rate</span>
                <Badge variant="secondary">{tradeStats.winRate}%</Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Total P&L</span>
                <span className={`text-xs font-medium ${
                  tradeStats.totalPnL >= 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {formatCurrency(tradeStats.totalPnL)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Avg R:R</span>
                <Badge variant="outline">1:{tradeStats.avgRiskReward}</Badge>
              </div>
            </div>
            
            <Button variant="outline" size="sm" className="w-full mt-3">
              <BarChart3 className="h-4 w-4 mr-2" />
              Full Analytics
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
        <div className="flex-1 p-6">
          <TradingMentorChat key={currentChatId} />
        </div>
      </div>
    </div>
  );
};

export default TradingMentor;