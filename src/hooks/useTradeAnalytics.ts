import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TradeAnalytics {
  totalTrades: number;
  winRate: number;
  totalPnL: number;
  avgRiskReward: number;
  profitableTrades: number;
  losingTrades: number;
  avgProfit: number;
  avgLoss: number;
  bestTrade: number;
  worstTrade: number;
  lastTradeDate: string | null;
}

export const useTradeAnalytics = () => {
  const [analytics, setAnalytics] = useState<TradeAnalytics>({
    totalTrades: 0,
    winRate: 0,
    totalPnL: 0,
    avgRiskReward: 0,
    profitableTrades: 0,
    losingTrades: 0,
    avgProfit: 0,
    avgLoss: 0,
    bestTrade: 0,
    worstTrade: 0,
    lastTradeDate: null
  });
  const [loading, setLoading] = useState(true);

  const calculateAnalytics = async () => {
    try {
      setLoading(true);
      const { data: trades, error } = await supabase
        .from('trades')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching trades:', error);
        return;
      }

      if (!trades || trades.length === 0) {
        setLoading(false);
        return;
      }

      const totalTrades = trades.length;
      const profitableTrades = trades.filter(trade => trade.result_usd > 0);
      const losingTrades = trades.filter(trade => trade.result_usd < 0);
      
      const winRate = totalTrades > 0 ? (profitableTrades.length / totalTrades) * 100 : 0;
      const totalPnL = trades.reduce((sum, trade) => sum + (trade.result_usd || 0), 0);
      
      const avgProfit = profitableTrades.length > 0 
        ? profitableTrades.reduce((sum, trade) => sum + trade.result_usd, 0) / profitableTrades.length 
        : 0;
      
      const avgLoss = losingTrades.length > 0 
        ? Math.abs(losingTrades.reduce((sum, trade) => sum + trade.result_usd, 0) / losingTrades.length)
        : 0;

      const avgRiskReward = avgLoss > 0 ? avgProfit / avgLoss : 0;
      
      const bestTrade = Math.max(...trades.map(trade => trade.result_usd || 0));
      const worstTrade = Math.min(...trades.map(trade => trade.result_usd || 0));
      
      const lastTradeDate = trades.length > 0 ? trades[0].created_at : null;

      setAnalytics({
        totalTrades,
        winRate,
        totalPnL,
        avgRiskReward,
        profitableTrades: profitableTrades.length,
        losingTrades: losingTrades.length,
        avgProfit,
        avgLoss,
        bestTrade,
        worstTrade,
        lastTradeDate
      });
    } catch (error) {
      console.error('Error calculating analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateAnalytics();
  }, []);

  return { analytics, loading, refreshAnalytics: calculateAnalytics };
};