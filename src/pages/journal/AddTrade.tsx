// This file was migrated from the journalpapers repository
// Original path: src/pages/AddTrade.tsx

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const tradeSchema = z.object({
  pair: z.string().min(1, "Trading pair is required"),
  direction: z.enum(["buy", "sell"]),
  lotSize: z.number().min(0.01, "Lot size must be at least 0.01"),
  entryPrice: z.number().min(0, "Entry price must be positive"),
  exitPrice: z.number().min(0, "Exit price must be positive"),
  stopLoss: z.number().optional(),
  takeProfit: z.number().optional(),
  notes: z.string().optional(),
  emotionalPsychology: z.string().optional(),
});

type TradeFormData = z.infer<typeof tradeSchema>;

const AddTrade = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<TradeFormData>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      pair: "XAUUSD",
      direction: "buy",
      lotSize: 0.01,
      entryPrice: 0,
      exitPrice: 0,
    },
  });

  const calculatePnL = (direction: "buy" | "sell", entryPrice: number, exitPrice: number, lotSize: number) => {
    const contractSize = 100; // XAUUSD contract size
    const pipValue = 1; // For XAUUSD, 1 pip = $1 per 0.01 lot
    
    let pnlUSD = 0;
    if (direction === "buy") {
      pnlUSD = (exitPrice - entryPrice) * lotSize * contractSize;
    } else {
      pnlUSD = (entryPrice - exitPrice) * lotSize * contractSize;
    }
    
    const pnlPercent = ((exitPrice - entryPrice) / entryPrice) * 100;
    return { pnlUSD, pnlPercent: direction === "buy" ? pnlPercent : -pnlPercent };
  };

  const onSubmit = async (data: TradeFormData) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to add trades",
          variant: "destructive",
        });
        return;
      }

      const contractSize = 100;
      const { pnlUSD, pnlPercent } = calculatePnL(data.direction, data.entryPrice, data.exitPrice, data.lotSize);

      const { error } = await supabase.from("trades").insert({
        pair: data.pair,
        direction: data.direction,
        lot_size: data.lotSize,
        entry_price: data.entryPrice,
        exit_price: data.exitPrice,
        stop_loss: data.stopLoss,
        take_profit: data.takeProfit,
        notes: data.notes,
        emotional_psychology: data.emotionalPsychology,
        result_usd: pnlUSD,
        pnl_percent: pnlPercent,
        contract_size: contractSize,
        user_id: user.id,
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Trade added successfully",
      });

      form.reset();
    } catch (error) {
      console.error("Error adding trade:", error);
      toast({
        title: "Error",
        description: "Failed to add trade. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Trade</CardTitle>
          <CardDescription>Record your trading activity for analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pair"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trading Pair</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select trading pair" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="XAUUSD">XAUUSD (Gold)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="direction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Direction</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select direction" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="buy">Buy</SelectItem>
                          <SelectItem value="sell">Sell</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="lotSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lot Size</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="entryPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entry Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="2000.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="exitPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exit Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="2010.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="stopLoss"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stop Loss (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="1990.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="takeProfit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Take Profit (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="2020.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trade Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any notes about this trade..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emotionalPsychology"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emotional Psychology (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="How did you feel during this trade? What was your mindset?"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Adding Trade..." : "Add Trade"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddTrade;