import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BalanceData {
  idr_balance: number;
  usd_balance: number;
  usd_cent_balance: number;
}

export const useBalance = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [balance, setBalance] = useState<BalanceData>({
    idr_balance: 0,
    usd_balance: 0,
    usd_cent_balance: 0,
  });
  const [loading, setLoading] = useState(true);

  // Fetch user balance
  const refreshBalance = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('idr_balance, usd_balance, usd_cent_balance')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      setBalance({
        idr_balance: data.idr_balance || 0,
        usd_balance: data.usd_balance || 0,
        usd_cent_balance: data.usd_cent_balance || 0,
      });
    } catch (error) {
      console.error('Error fetching balance:', error);
      await logError(error, 'useBalance', 'refreshBalance');
      toast({
        title: 'Error',
        description: 'Failed to fetch balance. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast, logError]);

  // Update user balance
  const updateBalance = useCallback(async (
    balanceType: 'IDR' | 'USD' | 'USD_CENT',
    amount: number,
    tradeId?: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      // Get current balance
      const { data: currentBalance, error: fetchError } = await supabase
        .from('profiles')
        .select('idr_balance, usd_balance, usd_cent_balance')
        .eq('id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Prepare update data
      let updateData: Partial<BalanceData> = {};
      
      if (balanceType === 'IDR') {
        updateData = { 
          idr_balance: (currentBalance.idr_balance || 0) + amount 
        };
      } else if (balanceType === 'USD') {
        updateData = { 
          usd_balance: (currentBalance.usd_balance || 0) + amount 
        };
      } else if (balanceType === 'USD_CENT') {
        updateData = { 
          usd_cent_balance: (currentBalance.usd_cent_balance || 0) + amount 
        };
      }

      // Update balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Log balance change - wrapped in try-catch to prevent failures
      try {
        if (tradeId) {
          await supabase.from('balance_changes').insert({
            user_id: user.id,
            trade_id: tradeId,
            balance_type: balanceType,
            amount,
            previous_balance: currentBalance,
            new_balance: { ...currentBalance, ...updateData },
          });
        }
      } catch (logError) {
        // Don't throw here, just log to console
        console.error('Failed to log balance change:', logError);
      }

      // Update local state
      setBalance(prev => ({
        ...prev,
        ...updateData,
      }));

      return true;
    } catch (error) {
      console.error('Error updating balance:', error);
      
      // Log error using the custom hook
      await logError(error, 'useBalance', 'updateBalance', { balanceType, amount, tradeId });
      
      toast({
        title: 'Error',
        description: 'Failed to update balance. Please try again.',
        variant: 'destructive',
      });
      
      return false;
    }
  }, [user, toast, logError]);

  // Initialize balance on component mount
  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  return {
    balance,
    loading,
    refreshBalance,
    updateBalance,
  };
};