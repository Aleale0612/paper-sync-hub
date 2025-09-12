import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Trade {
  id: string;
  pair: string;
  direction: "buy" | "sell";
  lot_size: number;
  entry_price: number;
  exit_price: number;
  result_usd: number;
  pnl_percent: number;
  created_at: string;
  notes?: string;
  emotional_psychology?: string;
}

export interface AnalyticsData {
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

// Global state for trade data synchronization across components
let globalTrades: Trade[] = [];
let globalAnalytics: AnalyticsData | null = null;
let subscribers: Set<() => void> = new Set();

const notifySubscribers = () => {
  subscribers.forEach(callback => callback());
};

export const useTradeData = () => {
  const [trades, setTrades] = useState<Trade[]>(globalTrades);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(globalAnalytics);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Subscribe to global state changes
  const forceUpdate = useCallback(() => {
    setTrades([...globalTrades]);
    setAnalytics(globalAnalytics ? { ...globalAnalytics } : null);
  }, []);

  useEffect(() => {
    subscribers.add(forceUpdate);
    return () => {
      subscribers.delete(forceUpdate);
    };
  }, [forceUpdate]);

  const calculateAnalytics = useCallback((tradesData: Trade[]) => {
    if (tradesData.length === 0) {
      globalAnalytics = null;
      return null;
    }

    const winningTrades = tradesData.filter(t => t.result_usd > 0);
    const losingTrades = tradesData.filter(t => t.result_usd < 0);
    
    const totalPnL = tradesData.reduce((sum, t) => sum + t.result_usd, 0);
    const winRate = (winningTrades.length / tradesData.length) * 100;
    const averageWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t.result_usd, 0) / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, t) => sum + t.result_usd, 0) / losingTrades.length) : 0;
    const profitFactor = averageLoss > 0 ? averageWin / averageLoss : 0;
    const bestTrade = Math.max(...tradesData.map(t => t.result_usd));
    const worstTrade = Math.min(...tradesData.map(t => t.result_usd));

    // Calculate consecutive wins/losses
    let maxConsecutiveWins = 0;
    let maxConsecutiveLosses = 0;
    let currentWins = 0;
    let currentLosses = 0;

    tradesData.forEach(trade => {
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

    const analyticsData: AnalyticsData = {
      totalPnL,
      winRate,
      totalTrades: tradesData.length,
      averageWin,
      averageLoss,
      profitFactor,
      bestTrade,
      worstTrade,
      consecutiveWins: maxConsecutiveWins,
      consecutiveLosses: maxConsecutiveLosses,
    };

    globalAnalytics = analyticsData;
    return analyticsData;
  }, []);

  const fetchTrades = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to view your trading data",
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

      globalTrades = data || [];
      calculateAnalytics(globalTrades);
      notifySubscribers();
    } catch (error) {
      console.error("Error fetching trades:", error);
      toast({
        title: "Error",
        description: "Failed to fetch trading data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, calculateAnalytics]);

  const refreshData = useCallback(() => {
    return fetchTrades();
  }, [fetchTrades]);

  // Auto-fetch on mount if no data exists
  useEffect(() => {
    if (globalTrades.length === 0) {
      fetchTrades();
    }
  }, [fetchTrades]);

  return {
    trades,
    analytics,
    loading,
    refreshData,
    calculateAnalytics,
  };
};