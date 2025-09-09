// This file was migrated from the journalpapers repository
// Original path: src/pages/TradeHistory.tsx

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Trade {
  id: string;
  pair: string;
  direction: "buy" | "sell";
  lot_size: number;
  entry_price: number;
  exit_price: number;
  stop_loss?: number;
  take_profit?: number;
  notes?: string;
  emotional_psychology?: string;
  result_usd: number;
  pnl_percent: number;
  created_at: string;
}

const TradeHistory = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
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
          description: "You must be logged in to view trades",
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

  const deleteTrade = async (id: string) => {
    try {
      const { error } = await supabase.from("trades").delete().eq("id", id);

      if (error) throw error;

      setTrades(trades.filter((trade) => trade.id !== id));
      toast({
        title: "Success",
        description: "Trade deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting trade:", error);
      toast({
        title: "Error",
        description: "Failed to delete trade",
        variant: "destructive",
      });
    }
  };

  const totalProfitLoss = trades.reduce((sum, trade) => sum + trade.result_usd, 0);
  const winningTrades = trades.filter((trade) => trade.result_usd > 0).length;
  const totalTrades = trades.length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading trades...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            {totalProfitLoss >= 0 ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalProfitLoss >= 0 ? "text-success" : "text-destructive"}`}>
              ${totalProfitLoss.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {winningTrades} wins out of {totalTrades} trades
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTrades}</div>
          </CardContent>
        </Card>
      </div>

      {/* Trades Table */}
      <Card>
        <CardHeader>
          <CardTitle>Trade History</CardTitle>
          <CardDescription>View and manage your trading history</CardDescription>
        </CardHeader>
        <CardContent>
          {trades.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No trades found. Start by adding your first trade!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Pair</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Lot Size</TableHead>
                    <TableHead>Entry</TableHead>
                    <TableHead>Exit</TableHead>
                    <TableHead>P&L ($)</TableHead>
                    <TableHead>P&L (%)</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell>
                        {format(new Date(trade.created_at), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>{trade.pair}</TableCell>
                      <TableCell>
                        <Badge variant={trade.direction === "buy" ? "default" : "secondary"}>
                          {trade.direction.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{trade.lot_size}</TableCell>
                      <TableCell>${trade.entry_price.toFixed(2)}</TableCell>
                      <TableCell>${trade.exit_price.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={trade.result_usd >= 0 ? "text-success" : "text-destructive"}>
                          ${trade.result_usd.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={trade.pnl_percent >= 0 ? "text-success" : "text-destructive"}>
                          {trade.pnl_percent.toFixed(2)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Trade</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this trade? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteTrade(trade.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TradeHistory;