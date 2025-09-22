import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getUpdateData } from "@/lib/getUpdateData";
import { Calculator, DollarSign, TrendingUp, FileText, CheckCircle, XCircle, ExternalLink } from "lucide-react";

const AddTrade = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    pair: "XAUUSD",
    direction: "buy" as "buy" | "sell",
    entryPrice: "",
    exitPrice: "",
    stopLoss: "",
    takeProfit: "",
    lotSize: "",
    riskPercent: "2",
    notes: "",
    emotionalPsychology: "calm",
    balanceType: "IDR" as "IDR" | "USD_CENT" | "USD",
    session: "",
    strategyTag: "",
    confidenceLevel: 3,
    commission: "",
    swap: "",
    screenshotUrl: "",
  });

  const [calculations, setCalculations] = useState({
    profitLossIDR: 0,
    profitLossUSD: 0,
    profitLossUSDCent: 0,
    profitLossPercent: 0,
    riskReward: 0,
  });

  const psychologyColors: Record<string, string> = {
    calm: "bg-green-100 text-green-800",
    fear: "bg-blue-100 text-blue-800",
    greedy: "bg-yellow-100 text-yellow-800",
    overconfident: "bg-purple-100 text-purple-800",
    neutral: "bg-gray-100 text-gray-800",
  };

  const calculateResults = () => {
    const entry = parseFloat(formData.entryPrice);
    const sl = parseFloat(formData.stopLoss);
    const tp = parseFloat(formData.takeProfit);
    const risk = parseFloat(formData.riskPercent);
    const exit = parseFloat(formData.exitPrice);

    if ([entry, sl, tp, risk].some((v) => isNaN(v))) return;

    const contractSize = 100;
    const pipSize = 0.01;

    const riskPips = Math.abs(entry - sl) / pipSize;
    if (riskPips === 0) return;

    const rewardPips = Math.abs(tp - entry) / pipSize;
    const riskReward = rewardPips / riskPips;

    const accountBalance = 10000;
    const riskAmount = (accountBalance * risk) / 100;
    const lotSize = riskAmount / (riskPips * pipSize * contractSize);

    setFormData((prev) => ({ ...prev, lotSize: lotSize.toFixed(2) }));

    let profitLossIDR = 0;
    let profitLossUSD = 0;
    let profitLossUSDCent = 0;
    let profitLossPercent = 0;

    if (!isNaN(exit)) {
      let pnlUSD = 0;
      if (formData.direction === "buy") {
        pnlUSD = (exit - entry) * lotSize * contractSize;
      } else {
        pnlUSD = (entry - exit) * lotSize * contractSize;
      }
      profitLossIDR = pnlUSD * 15500;
      profitLossUSD = pnlUSD;
      profitLossUSDCent = pnlUSD * 100;
      profitLossPercent = (pnlUSD / (entry * lotSize * contractSize)) * 100;
    }

    setCalculations({
      profitLossIDR,
      profitLossUSD,
      profitLossUSDCent,
      profitLossPercent,
      riskReward,
    });
  };

  const validateInputs = () => {
    const entry = parseFloat(formData.entryPrice);
    const sl = parseFloat(formData.stopLoss);
    const tp = parseFloat(formData.takeProfit);

    if ([entry, sl, tp].some((v) => isNaN(v))) return true;

    return formData.direction === "buy"
      ? sl < entry && entry < tp
      : tp < entry && entry < sl;
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const insertTemplateNotes = () => {
    const template = "Market sentiment: ...\nPattern observed: ...\nNews impact: ...";
    setFormData((prev) => ({ ...prev, notes: template }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Not Logged In",
        description: "You must be logged in to add trades.",
        variant: "destructive",
      });
      return;
    }

    if (
      !formData.entryPrice ||
      !formData.stopLoss ||
      !formData.takeProfit ||
      !formData.lotSize
    ) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!validateInputs()) {
      toast({
        title: "Invalid Input",
        description:
          formData.direction === "buy"
            ? "For Buy orders: SL < Entry < TP"
            : "For Sell orders: TP < Entry < SL",
        variant: "destructive",
      });
      return;
    }

    try {
      const entryPrice = parseFloat(formData.entryPrice);
      const exitPrice =
        parseFloat(formData.exitPrice) || parseFloat(formData.takeProfit);
      const lotSize = parseFloat(formData.lotSize);
      const contractSize = 100;

      let resultUSD = 0;
      let pnlPercent = 0;
      let pnlIDR = 0;
      let pnlUSDCent = 0;

      if (!isNaN(entryPrice) && !isNaN(exitPrice) && !isNaN(lotSize)) {
        if (formData.direction === "buy") {
          resultUSD = (exitPrice - entryPrice) * lotSize * contractSize;
        } else {
          resultUSD = (entryPrice - exitPrice) * lotSize * contractSize;
        }
        pnlIDR = resultUSD * 15500;
        pnlUSDCent = resultUSD * 100;
        pnlPercent = (resultUSD / (entryPrice * lotSize * contractSize)) * 100;
      }

      let resultBalance = 0;
      if (formData.balanceType === "IDR") {
        resultBalance = pnlIDR;
      } else if (formData.balanceType === "USD") {
        resultBalance = resultUSD;
      } else if (formData.balanceType === "USD_CENT") {
        resultBalance = pnlUSDCent;
      }

      const { error: insertError } = await supabase.from("trades").insert({
        pair: formData.pair,
        direction: formData.direction,
        entry_price: entryPrice,
        exit_price: exitPrice,
        stop_loss: parseFloat(formData.stopLoss),
        take_profit: parseFloat(formData.takeProfit),
        lot_size: lotSize,
        contract_size: contractSize,
        result_usd: resultUSD,
        pnl_idr: pnlIDR,
        pnl_usd_cent: pnlUSDCent,
        pnl_percent: pnlPercent,
        risk_reward: calculations.riskReward,
        risk_percent: parseFloat(formData.riskPercent),
        notes: formData.notes || null,
        emotional_psychology: formData.emotionalPsychology,
        balance_type: formData.balanceType,
        result_balance: resultBalance,
        user_id: user.id,
        session: formData.session || null,
        strategy_tag: formData.strategyTag || null,
        confidence_level: formData.confidenceLevel || null,
        commission: formData.commission ? parseFloat(formData.commission) : null,
        swap: formData.swap ? parseFloat(formData.swap) : null,
        screenshot_url: formData.screenshotUrl || null,
      });

      if (insertError) throw insertError;

      const { data: user_id, error: fetchError } = await supabase
        .from("profiles")
        .select("idr_balance, usd_balance, usd_cent_balance")
        .eq("user_id", user.id)
        .single();  

      if (fetchError) throw fetchError;

      const updateData = getUpdateData(
        formData.balanceType,
        user_id,
        resultBalance
      );

      const { error: updateError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      toast({
        title: "Trade Added",
        description: `Your trade has been recorded and ${formData.balanceType} balance updated.`,
      });

      setFormData({
        pair: "XAUUSD",
        direction: "buy",
        entryPrice: "",
        exitPrice: "",
        stopLoss: "",
        takeProfit: "",
        lotSize: "",
        riskPercent: "2",
        notes: "",
        emotionalPsychology: "calm",
        balanceType: "IDR",
        session: "",
        strategyTag: "",
        confidenceLevel: 3,
        commission: "",
        swap: "",
        screenshotUrl: "",
      });
    } catch (error) {
      console.error("Error adding trade:", error);
      toast({
        title: "Error",
        description: "Failed to add trade. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (
      formData.entryPrice &&
      formData.stopLoss &&
      formData.takeProfit &&
      formData.riskPercent
    ) {
      calculateResults();
    }
  }, [
    formData.entryPrice,
    formData.exitPrice,
    formData.stopLoss,
    formData.takeProfit,
    formData.riskPercent,
    formData.direction,
  ]);

  const formatCurrency = (value: number, type: string) => {
    if (type === "IDR") {
      return `Rp ${Math.abs(value).toLocaleString("id-ID")}`;
    } else if (type === "USD") {
      return `$${Math.abs(value).toFixed(2)}`;
    } else if (type === "USD_CENT") {
      return `${Math.abs(value).toFixed(0)} cents`;
    }
    return value.toString();
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Add New Trade</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            Record your XAUUSD trading performance with detailed analysis
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form (2/3 width) */}
          <div className="lg:col-span-2">
            <Card className="bg-card border-border shadow-lg h-full">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-xl">
                  <DollarSign className="w-6 h-6 mr-3 text-primary" />
                  Trade Information
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <Tabs defaultValue="entry" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 mb-6">
                    <TabsTrigger value="entry" className="py-3">
                      Entry
                    </TabsTrigger>
                    <TabsTrigger value="risk" className="py-3">
                      Risk
                    </TabsTrigger>
                    <TabsTrigger value="meta" className="py-3">
                      Meta
                    </TabsTrigger>
                    <TabsTrigger value="extra" className="py-3">
                      Extra
                    </TabsTrigger>
                  </TabsList>

                  {/* Entry Tab */}
                  <TabsContent value="entry" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="pair" className="text-base font-medium">
                          Trading Pair
                        </Label>
                        <Select
                          value={formData.pair}
                          onValueChange={(value) => handleInputChange("pair", value)}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="XAUUSD">XAU/USD (Gold)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="direction" className="text-base font-medium">
                          Direction
                        </Label>
                        <Select
                          value={formData.direction}
                          onValueChange={(value) => handleInputChange("direction", value)}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="buy">Buy (Long)</SelectItem>
                            <SelectItem value="sell">Sell (Short)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="entryPrice" className="text-base font-medium">
                          Entry Price
                        </Label>
                        <Input
                          id="entryPrice"
                          type="number"
                          step="0.01"
                          placeholder="2050.00"
                          value={formData.entryPrice}
                          onChange={(e) => handleInputChange("entryPrice", e.target.value)}
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="exitPrice" className="text-base font-medium">
                          Exit Price (Optional)
                        </Label>
                        <Input
                          id="exitPrice"
                          type="number"
                          step="0.01"
                          placeholder="2055.00"
                          value={formData.exitPrice}
                          onChange={(e) => handleInputChange("exitPrice", e.target.value)}
                          className="h-12"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="stopLoss" className="text-base font-medium">
                          Stop Loss (SL)
                        </Label>
                        <Input
                          id="stopLoss"
                          type="number"
                          step="0.01"
                          placeholder="2045.00"
                          value={formData.stopLoss}
                          onChange={(e) => handleInputChange("stopLoss", e.target.value)}
                          className={`h-12 ${
                            !validateInputs() && formData.entryPrice && formData.stopLoss
                              ? "border-destructive"
                              : ""
                          }`}
                        />
                        {formData.entryPrice && formData.stopLoss && formData.takeProfit && (
                          <div className="flex items-center text-sm mt-1">
                            {validateInputs() ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-success mr-1" />
                                <span className="text-success">Valid SL</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 text-destructive mr-1" />
                                <span className="text-destructive">Invalid SL</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="takeProfit" className="text-base font-medium">
                          Take Profit (TP)
                        </Label>
                        <Input
                          id="takeProfit"
                          type="number"
                          step="0.01"
                          placeholder="2055.00"
                          value={formData.takeProfit}
                          onChange={(e) => handleInputChange("takeProfit", e.target.value)}
                          className={`h-12 ${
                            !validateInputs() && formData.entryPrice && formData.takeProfit
                              ? "border-destructive"
                              : ""
                          }`}
                        />
                        {formData.entryPrice && formData.stopLoss && formData.takeProfit && (
                          <div className="flex items-center text-sm mt-1">
                            {validateInputs() ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-success mr-1" />
                                <span className="text-success">Valid TP</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 text-destructive mr-1" />
                                <span className="text-destructive">Invalid TP</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Risk Tab */}
                  <TabsContent value="risk" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="lotSize" className="text-base font-medium">
                          Lot Size (Auto)
                        </Label>
                        <Input
                          id="lotSize"
                          type="number"
                          step="0.01"
                          placeholder="0.10"
                          value={formData.lotSize}
                          readOnly
                          className="h-12 bg-secondary/20"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="riskPercent" className="text-base font-medium">
                          Risk %
                        </Label>
                        <Input
                          id="riskPercent"
                          type="number"
                          step="0.1"
                          placeholder="2.0"
                          value={formData.riskPercent}
                          onChange={(e) => handleInputChange("riskPercent", e.target.value)}
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-base font-medium">Balance Type</Label>
                        <div className="flex space-x-2">
                          {["IDR", "USD", "USD_CENT"].map((type) => (
                            <Button
                              key={type}
                              type="button"
                              variant={formData.balanceType === type ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleInputChange("balanceType", type)}
                              className="flex-1 h-12 text-sm"
                            >
                              {type}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Meta Tab */}
                  <TabsContent value="meta" className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="emotionalPsychology" className="text-base font-medium">
                        Emotional Psychology
                      </Label>
                      <div className="flex items-center space-x-3">
                        <Select
                          value={formData.emotionalPsychology}
                          onValueChange={(value) => handleInputChange("emotionalPsychology", value)}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="calm">Calm</SelectItem>
                            <SelectItem value="fear">Fear</SelectItem>
                            <SelectItem value="greedy">Greedy</SelectItem>
                            <SelectItem value="overconfident">Overconfident</SelectItem>
                            <SelectItem value="neutral">Neutral</SelectItem>
                          </SelectContent>
                        </Select>
                        <Badge
                          className={
                            psychologyColors[formData.emotionalPsychology] || "bg-gray-100 text-gray-800"
                          }
                        >
                          {formData.emotionalPsychology}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="notes" className="text-base font-medium">
                          Notes (Optional)
                        </Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={insertTemplateNotes}
                          className="text-sm h-8 px-3"
                        >
                          Insert Template
                        </Button>
                      </div>
                      <Textarea
                        id="notes"
                        placeholder="Trade analysis, market conditions, etc..."
                        value={formData.notes}
                        onChange={(e) => handleInputChange("notes", e.target.value)}
                        className="min-h-[120px] whitespace-pre-wrap"
                      />
                    </div>
                  </TabsContent>

                  {/* Extra Tab */}
                  <TabsContent value="extra" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="session" className="text-base font-medium">
                          Session
                        </Label>
                        <Select
                          value={formData.session}
                          onValueChange={(value) => handleInputChange("session", value)}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select session" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="london">London</SelectItem>
                            <SelectItem value="newyork">New York</SelectItem>
                            <SelectItem value="asia">Asia</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="strategyTag" className="text-base font-medium">
                          Strategy Tag
                        </Label>
                        <Select
                          value={formData.strategyTag}
                          onValueChange={(value) => handleInputChange("strategyTag", value)}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select strategy" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="scalping">Scalping</SelectItem>
                            <SelectItem value="swing">Swing</SelectItem>
                            <SelectItem value="news">News</SelectItem>
                            <SelectItem value="breakout">Breakout</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="confidenceLevel" className="text-base font-medium">
                        Confidence Level: {formData.confidenceLevel}
                      </Label>
                      <Slider
                        value={[formData.confidenceLevel]}
                        onValueChange={(value) => handleInputChange("confidenceLevel", value[0])}
                        max={5}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="commission" className="text-base font-medium">
                          Commission
                        </Label>
                        <Input
                          id="commission"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.commission}
                          onChange={(e) => handleInputChange("commission", e.target.value)}
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="swap" className="text-base font-medium">
                          Swap
                        </Label>
                        <Input
                          id="swap"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.swap}
                          onChange={(e) => handleInputChange("swap", e.target.value)}
                          className="h-12"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="screenshotUrl" className="text-base font-medium">
                        Screenshot URL
                      </Label>
                      <div className="flex space-x-2">
                        <Input
                          id="screenshotUrl"
                          type="text"
                          placeholder="https://example.com/screenshot.png"
                          value={formData.screenshotUrl}
                          onChange={(e) => handleInputChange("screenshotUrl", e.target.value)}
                          className="h-12 flex-1"
                        />
                        {formData.screenshotUrl && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(formData.screenshotUrl, "_blank")}
                            className="h-12"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Results Panel (1/3 width) */}
          <div className="lg:col-span-1">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg border border-primary/20 h-full flex flex-col">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg text-primary">
                  <Calculator className="w-5 h-5 mr-2" />
                  Trade Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                <div className="space-y-6">
                  <div className="p-5 rounded-lg bg-background border border-border">
                    <h3 className="font-medium mb-4">Trade Metrics</h3>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Risk Reward</span>
                        <span className="text-sm font-bold text-primary">
                          1:{calculations.riskReward.toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Auto Lot</span>
                        <span className="text-sm font-bold">
                          {formData.lotSize || "0.00"}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          PNL ({formData.balanceType})
                        </span>
                        <span
                          className={`text-sm font-bold ${
                            calculations.profitLossIDR >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatCurrency(
                            formData.balanceType === "IDR"
                              ? calculations.profitLossIDR
                              : formData.balanceType === "USD"
                              ? calculations.profitLossUSD
                              : calculations.profitLossUSDCent,
                            formData.balanceType
                          )}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-5 pt-4 border-t border-border">
                      <div className="text-xs text-muted-foreground mb-2">
                        Validation:
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">
                          {formData.direction === "buy"
                            ? "Buy: SL < Entry < TP"
                            : "Sell: TP < Entry < SL"}
                        </span>
                        {validateInputs() ? (
                          <CheckCircle className="w-4 h-4 text-success" />
                        ) : (
                          <XCircle className="w-4 h-4 text-destructive" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-5 rounded-lg bg-background border border-border">
                    <h3 className="font-medium mb-4">Trade Summary</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                        <span className="text-sm">Entry: {formData.entryPrice || "-"}</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                        <span className="text-sm">Stop Loss: {formData.stopLoss || "-"}</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-sm">Take Profit: {formData.takeProfit || "-"}</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                        <span className="text-sm">Direction: {formData.direction.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t border-border">
                <Button
                  type="submit"
                  className="w-full h-12"
                  disabled={!validateInputs()}
                  onClick={handleSubmit}
                >
                  Save Trade
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTrade;