// This file was migrated from the journalpapers repository
// Original path: src/pages/Analytics.tsx

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Target, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

interface Trade {
  id: string;
  pair: string;
  direction: "buy" | "sell";
  lot_size: number;
  entry_price: number;
  exit_price: number;
  result_usd: number;
  pnl_percent: number;
  created_at: string;
}

interface AnalyticsData {
  totalPnL: number;
  winRate: number;
  totalTrades: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  bestTrade: number;
  worstTrade: number;
  consecutiveWins: number;
  consecutiveLosses: number;
}

const Analytics = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to view analytics",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTrades(data || []);
      calculateAnalytics(data || []);
    } catch (error) {
      console.error("Error fetching trades:", error);
      toast({
        title: "Error",
        description: "Failed to fetch trades",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (trades: Trade[]) => {
    if (trades.length === 0) {
      setAnalytics(null);
      return;
    }

    const winningTrades = trades.filter(t => t.result_usd > 0);
    const losingTrades = trades.filter(t => t.result_usd < 0);
    
    const totalPnL = trades.reduce((sum, t) => sum + t.result_usd, 0);
    const winRate = (winningTrades.length / trades.length) * 100;
    const averageWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t.result_usd, 0) / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, t) => sum + t.result_usd, 0) / losingTrades.length) : 0;
    const profitFactor = averageLoss > 0 ? averageWin / averageLoss : 0;
    const bestTrade = Math.max(...trades.map(t => t.result_usd));
    const worstTrade = Math.min(...trades.map(t => t.result_usd));

    // Calculate consecutive wins/losses
    let maxConsecutiveWins = 0;
    let maxConsecutiveLosses = 0;
    let currentWins = 0;
    let currentLosses = 0;

    trades.forEach(trade => {
      if (trade.result_usd > 0) {
        currentWins++;
        currentLosses = 0;
        maxConsecutiveWins = Math.max(maxConsecutiveWins, currentWins);
      } else {
        currentLosses++;
        currentWins = 0;
        maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLosses);
      }
    });

    setAnalytics({
      totalPnL,
      winRate,
      totalTrades: trades.length,
      averageWin,
      averageLoss,
      profitFactor,
      bestTrade,
      worstTrade,
      consecutiveWins: maxConsecutiveWins,
      consecutiveLosses: maxConsecutiveLosses,
    });
  };

  // Prepare chart data
  const monthlyData = trades.reduce((acc, trade) => {
    const month = new Date(trade.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    if (!acc[month]) {
      acc[month] = { month, pnl: 0, trades: 0 };
    }
    acc[month].pnl += trade.result_usd;
    acc[month].trades += 1;
    return acc;
  }, {} as Record<string, { month: string; pnl: number; trades: number }>);

  const chartData = Object.values(monthlyData).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

  const directionData = [
    { name: 'Buy', value: trades.filter(t => t.direction === 'buy').length, color: '#0088FE' },
    { name: 'Sell', value: trades.filter(t => t.direction === 'sell').length, color: '#00C49F' },
  ];

  const winLossData = [
    { name: 'Wins', value: trades.filter(t => t.result_usd > 0).length, color: '#22c55e' },
    { name: 'Losses', value: trades.filter(t => t.result_usd <= 0).length, color: '#ef4444' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No data available. Start by adding some trades!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            {analytics.totalPnL >= 0 ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${analytics.totalPnL >= 0 ? "text-success" : "text-destructive"}`}>
              ${analytics.totalPnL.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.winRate.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.profitFactor.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Avg Win / Avg Loss
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalTrades}</div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Win</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-success">
              ${analytics.averageWin.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-destructive">
              ${analytics.averageLoss.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Best Trade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-success">
              ${analytics.bestTrade.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Worst Trade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-destructive">
              ${analytics.worstTrade.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly P&L Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly P&L</CardTitle>
            <CardDescription>Profit and loss over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`$${value}`, 'P&L']}
                />
                <Bar 
                  dataKey="pnl" 
                  fill="#0088FE"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Trade Direction Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Trade Direction</CardTitle>
            <CardDescription>Distribution of buy vs sell trades</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={directionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {directionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Win/Loss Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Win/Loss Ratio</CardTitle>
            <CardDescription>Distribution of winning vs losing trades</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={winLossData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {winLossData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Consecutive Wins/Losses */}
        <Card>
          <CardHeader>
            <CardTitle>Streak Analysis</CardTitle>
            <CardDescription>Maximum consecutive wins and losses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Max Consecutive Wins</span>
                <Badge variant="default" className="bg-success">
                  {analytics.consecutiveWins}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Max Consecutive Losses</span>
                <Badge variant="destructive">
                  {analytics.consecutiveLosses}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;