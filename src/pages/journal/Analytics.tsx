import { useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Calendar, 
  BarChart3, 
  RefreshCw, 
  Award, 
  AlertTriangle,
  Download,
  FileText,
  Filter,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { useTradeData } from "@/hooks/useTradeData";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const Analytics = () => {
  const { trades, analytics, loading, refreshData } = useTradeData();
  const analyticsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (trades.length === 0 && !loading) {
      refreshData();
    }
  }, [trades.length, loading, refreshData]);

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
    { name: 'Buy', value: trades.filter(t => t.direction === 'buy').length, color: 'hsl(var(--primary))' },
    { name: 'Sell', value: trades.filter(t => t.direction === 'sell').length, color: 'hsl(var(--secondary))' },
  ];

  const winLossData = [
    { name: 'Wins', value: trades.filter(t => t.result_usd > 0).length, color: 'hsl(142 76% 36%)' },
    { name: 'Losses', value: trades.filter(t => t.result_usd <= 0).length, color: 'hsl(var(--destructive))' },
  ];

  // Function to download as PDF
  const downloadPDF = async () => {
    if (analyticsRef.current) {
      const canvas = await html2canvas(analyticsRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('trading-analytics.pdf');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading your trading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="text-center space-y-4">
          <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto" />
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">No Trading Data</h3>
            <p className="text-muted-foreground max-w-md">
              Start building your trading analytics by adding your first trade. 
              Track your performance and improve your trading strategy.
            </p>
          </div>
          <Button onClick={refreshData} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Trading Analytics</h1>
          <p className="text-muted-foreground">Comprehensive overview of your trading performance</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={refreshData} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={downloadPDF} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div ref={analyticsRef} className="flex-1 overflow-y-auto space-y-6 pr-2">
        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-primary shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
              {analytics.totalPnL >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-emerald-600" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-destructive" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${analytics.totalPnL >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                ${analytics.totalPnL.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.totalPnL >= 0 ? 'Profit' : 'Loss'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.winRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.winRate >= 50 ? 'Above average' : 'Below average'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${analytics.profitFactor >= 1 ? "text-emerald-600" : "text-destructive"}`}>
                {analytics.profitFactor.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Avg Win / Avg Loss
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalTrades}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Executed trades
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-emerald-600" />
                Average Win
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-emerald-600">
                ${analytics.averageWin.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <TrendingDown className="h-4 w-4 mr-2 text-destructive" />
                Average Loss
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-destructive">
                ${analytics.averageLoss.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Award className="h-4 w-4 mr-2 text-emerald-600" />
                Best Trade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-emerald-600">
                ${analytics.bestTrade.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-destructive" />
                Worst Trade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-destructive">
                ${analytics.worstTrade.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly P&L Chart */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Monthly P&L Performance
              </CardTitle>
              <CardDescription>Track your profit and loss trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="month" 
                    fontSize={12}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    fontSize={12}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    formatter={(value) => [`$${value}`, 'P&L']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar 
                    dataKey="pnl" 
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Trade Direction Distribution */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Trade Direction Split</CardTitle>
              <CardDescription>Distribution of buy vs sell positions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
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
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Win/Loss Distribution */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Win/Loss Distribution</CardTitle>
              <CardDescription>Performance breakdown of your trades</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
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
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Streak Analysis */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Streak Analysis</CardTitle>
              <CardDescription>Your longest winning and losing streaks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex justify-between items-center p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                  <div className="flex items-center">
                    <Award className="h-5 w-5 mr-3 text-emerald-600" />
                    <span className="text-sm font-medium">Max Consecutive Wins</span>
                  </div>
                  <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-600">
                    {analytics.consecutiveWins}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-3 text-destructive" />
                    <span className="text-sm font-medium">Max Consecutive Losses</span>
                  </div>
                  <Badge variant="destructive">
                    {analytics.consecutiveLosses}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Analytics Section */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Detailed Performance Metrics
            </CardTitle>
            <CardDescription>In-depth analysis of your trading performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Risk Management</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Risk/Reward Ratio</span>
                    <span className="font-medium">{analytics.averageRiskReward ? `1:${analytics.averageRiskReward.toFixed(2)}` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Max Drawdown</span>
                    <span className="font-medium">{analytics.maxDrawdown ? `${analytics.maxDrawdown.toFixed(2)}%` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Recovery Factor</span>
                    <span className="font-medium">{analytics.recoveryFactor ? analytics.recoveryFactor.toFixed(2) : 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Trade Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Average Trade Duration</span>
                    <span className="font-medium">{analytics.avgTradeDuration ? `${analytics.avgTradeDuration.toFixed(2)} hours` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Most Traded Pair</span>
                    <span className="font-medium">{analytics.mostTradedPair || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Most Profitable Pair</span>
                    <span className="font-medium">{analytics.mostProfitablePair || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;