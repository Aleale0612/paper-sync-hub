import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Edit2,
  Trash2,
  Search,
  TrendingUp,
  TrendingDown,
  Eye,
  ExternalLink,
  Calendar,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import EditTradeDialog from "@/components/journal/EditTradeDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface Trade {
  id: string;
  created_at: string;
  pair: string;
  direction: "buy" | "sell";
  entry_price: number;
  exit_price: number;
  stop_loss: number | null;
  take_profit: number | null;
  lot_size: number;
  result_usd: number;
  pnl_idr: number;
  pnl_usd_cent: number;
  pnl_percent: number;
  risk_reward: number | null;
  notes: string | null;
  emotional_psychology: string | null;
  balance_type: "IDR" | "USD" | "USD_CENT";
  // New fields
  session: string | null;
  strategy_tag: string | null;
  confidence_level: number | null;
  commission: number | null;
  swap: number | null;
  screenshot_url: string | null;
}

const TradeHistory = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [viewingTrade, setViewingTrade] = useState<Trade | null>(null);

  const fetchTrades = async () => {
    if (!user) return;

    try {
      setLoading(true);
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
        description: "Failed to load trades.",
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
      setSelectedTrades((prev) => prev.filter((tid) => tid !== id));
      toast({
        title: "Trade Deleted",
        description: "The trade has been successfully removed.",
      });
    } catch (error) {
      console.error("Error deleting trade:", error);
      toast({
        title: "Error",
        description: "Failed to delete trade.",
        variant: "destructive",
      });
    }
  };

  const deleteSelectedTrades = async () => {
    if (selectedTrades.length === 0) return;

    try {
      const { error } = await supabase
        .from("trades")
        .delete()
        .in("id", selectedTrades);

      if (error) throw error;

      setTrades(trades.filter((t) => !selectedTrades.includes(t.id)));
      setSelectedTrades([]);
      setSelectAll(false);

      toast({
        title: "Trades Deleted",
        description: "Selected trades have been successfully removed.",
      });
    } catch (error) {
      console.error("Error deleting selected trades:", error);
      toast({
        title: "Error",
        description: "Failed to delete selected trades.",
        variant: "destructive",
      });
    }
  };

  const handleEditTrade = (trade: Trade) => {
    setEditingTrade(trade);
    setIsEditDialogOpen(true);
  };

  const handleViewTrade = (trade: Trade) => {
    setViewingTrade(trade);
  };

  const handleTradeUpdated = () => {
    fetchTrades();
  };

  const formatPnL = (trade: Trade) => {
    if (trade.balance_type === "IDR") {
      return `Rp ${Math.abs(trade.pnl_idr).toLocaleString("id-ID")}`;
    }
    if (trade.balance_type === "USD") {
      return `$${Math.abs(trade.result_usd).toFixed(2)}`;
    }
    if (trade.balance_type === "USD_CENT") {
      return `${Math.abs(trade.pnl_usd_cent).toFixed(0)} cents`;
    }
    return "-";
  };

  const isProfit = (trade: Trade) => {
    if (trade.balance_type === "IDR") return trade.pnl_idr >= 0;
    if (trade.balance_type === "USD") return trade.result_usd >= 0;
    if (trade.balance_type === "USD_CENT") return trade.pnl_usd_cent >= 0;
    return false;
  };

  const formatCommissionSwap = (trade: Trade) => {
    const commission =
      trade.commission !== null ? `$${trade.commission.toFixed(2)}` : "-";
    const swap = trade.swap !== null ? `$${trade.swap.toFixed(2)}` : "-";

    if (commission === "-" && swap === "-") return "-";
    return `${commission} / ${swap}`;
  };

  const formatConfidence = (level: number | null) => {
    if (level === null) return "-";
    return `${level}/5`;
  };

  const formatSession = (session: string | null) => {
    if (!session) return "-";
    return session.charAt(0).toUpperCase() + session.slice(1);
  };

  const formatStrategy = (strategy: string | null) => {
    if (!strategy) return "-";
    return strategy.charAt(0).toUpperCase() + strategy.slice(1);
  };

  const formatSLTP = (value: number | null) => {
    if (value === null) return "-";
    return `$${value}`;
  };

  const filteredTrades = trades.filter(
    (trade) =>
      trade.pair.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.session?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.strategy_tag?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedTrades([]);
    } else {
      setSelectedTrades(filteredTrades.map((t) => t.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectRow = (id: string) => {
    setSelectedTrades((prev) =>
      prev.includes(id) ? prev.filter((tid) => tid !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    if (user) {
      fetchTrades();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading trades...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Trade History</h1>
          <p className="text-muted-foreground">Track your trading performance</p>
        </div>

        <div className="flex items-center space-x-2">
          {selectedTrades.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={deleteSelectedTrades}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete Selected ({selectedTrades.length})
            </Button>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search trades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      <Card className="theme-transition shadow-lg border border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-primary" />
            All Trades ({filteredTrades.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTrades.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No trades found.</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Pair</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Entry</TableHead>
                    <TableHead>SL</TableHead>
                    <TableHead>TP</TableHead>
                    <TableHead>Exit</TableHead>
                    <TableHead>Lot</TableHead>
                    <TableHead>RR</TableHead>
                    <TableHead>P&L</TableHead>
                    <TableHead>Balance Type</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Strategy</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Comm/Swap</TableHead>
                    <TableHead>Screenshot</TableHead>
                    <TableHead>Psychology</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrades.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedTrades.includes(trade.id)}
                          onChange={() => handleSelectRow(trade.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {format(new Date(trade.created_at), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{trade.pair}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={trade.direction === "buy" ? "default" : "secondary"}
                        >
                          {trade.direction === "buy" ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          ) : (
                            <TrendingDown className="w-3 h-3 mr-1" />
                          )}
                          {trade.direction.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>${trade.entry_price}</TableCell>
                      <TableCell className="text-loss">
                        {formatSLTP(trade.stop_loss)}
                      </TableCell>
                      <TableCell className="text-success">
                        {formatSLTP(trade.take_profit)}
                      </TableCell>
                      <TableCell>${trade.exit_price}</TableCell>
                      <TableCell>{trade.lot_size}</TableCell>
                      <TableCell className="text-primary">
                        {trade.risk_reward ? `1:${trade.risk_reward.toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell
                        className={isProfit(trade) ? "text-success" : "text-loss"}
                      >
                        {formatPnL(trade)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{trade.balance_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {formatSession(trade.session)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {formatStrategy(trade.strategy_tag)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {trade.confidence_level !== null ? (
                            <>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <div
                                    key={i}
                                    className={`w-2 h-2 rounded-full mx-0.5 ${
                                      i < trade.confidence_level!
                                        ? "bg-primary"
                                        : "bg-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="ml-1 text-xs">
                                {formatConfidence(trade.confidence_level)}
                              </span>
                            </>
                          ) : (
                            "-"
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatCommissionSwap(trade)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {trade.screenshot_url ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(trade.screenshot_url!, "_blank")
                            }
                            className="h-8 px-2"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {trade.emotional_psychology || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {trade.notes ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="theme-transition hover:bg-primary/10"
                                onClick={() => handleViewTrade(trade)}
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle className="flex items-center">
                                  <Badge variant="outline" className="mr-2">
                                    {trade.pair}
                                  </Badge>
                                  Trade Details
                                </DialogTitle>
                                <DialogDescription>
                                  <div className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    {format(new Date(trade.created_at), "MMM dd, yyyy")}
                                  </div>
                                </DialogDescription>
                              </DialogHeader>
                              <Tabs defaultValue="overview" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                  <TabsTrigger value="overview">Overview</TabsTrigger>
                                  <TabsTrigger value="notes">Notes</TabsTrigger>
                                  <TabsTrigger value="metrics">Metrics</TabsTrigger>
                                </TabsList>
                                <TabsContent value="overview" className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="text-sm font-medium text-muted-foreground">Direction</h4>
                                      <p className="capitalize">{trade.direction}</p>
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-medium text-muted-foreground">Balance Type</h4>
                                      <p>{trade.balance_type}</p>
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-medium text-muted-foreground">Entry Price</h4>
                                      <p>${trade.entry_price}</p>
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-medium text-muted-foreground">Exit Price</h4>
                                      <p>${trade.exit_price}</p>
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-medium text-muted-foreground">Stop Loss</h4>
                                      <p>{trade.stop_loss ? `$${trade.stop_loss}` : "-"}</p>
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-medium text-muted-foreground">Take Profit</h4>
                                      <p>{trade.take_profit ? `$${trade.take_profit}` : "-"}</p>
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-medium text-muted-foreground">Lot Size</h4>
                                      <p>{trade.lot_size}</p>
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-medium text-muted-foreground">Risk/Reward</h4>
                                      <p>{trade.risk_reward ? `1:${trade.risk_reward.toFixed(2)}` : "-"}</p>
                                    </div>
                                  </div>
                                </TabsContent>
                                <TabsContent value="notes">
                                  <Card className="shadow-lg border border-border/50">
                                    <CardContent className="pt-6">
                                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                        {trade.notes}
                                      </p>
                                    </CardContent>
                                  </Card>
                                </TabsContent>
                                <TabsContent value="metrics" className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="text-sm font-medium text-muted-foreground">Session</h4>
                                      <p className="capitalize">{trade.session || "-"}</p>
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-medium text-muted-foreground">Strategy</h4>
                                      <p className="capitalize">{trade.strategy_tag || "-"}</p>
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-medium text-muted-foreground">Confidence Level</h4>
                                      <p>{formatConfidence(trade.confidence_level)}</p>
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-medium text-muted-foreground">Psychology</h4>
                                      <p className="capitalize">{trade.emotional_psychology || "-"}</p>
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-medium text-muted-foreground">Commission</h4>
                                      <p>{trade.commission ? `$${trade.commission.toFixed(2)}` : "-"}</p>
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-medium text-muted-foreground">Swap</h4>
                                      <p>{trade.swap ? `$${trade.swap.toFixed(2)}` : "-"}</p>
                                    </div>
                                  </div>
                                </TabsContent>
                              </Tabs>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="theme-transition hover:bg-primary/10"
                            onClick={() => handleEditTrade(trade)}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="theme-transition hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Trade</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this trade? This action
                                  cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteTrade(trade.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
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

      <EditTradeDialog
        trade={editingTrade}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onTradeUpdated={handleTradeUpdated}
      />
    </div>
  );
};

export default TradeHistory;