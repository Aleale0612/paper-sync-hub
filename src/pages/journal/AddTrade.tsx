import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getUpdateData } from "@/lib/getUpdateData";
import { 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Calculator, 
  FileImage, 
  TrendingUp, 
  Brain,
  Clock,
  Target,
  Percent,
  FileText,
  Info
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
    tradeDuration: "",
    marketCondition: "",
    tradeReason: "",
    lessonsLearned: "",
  });

  const [calculations, setCalculations] = useState({
    profitLossIDR: 0,
    profitLossUSD: 0,
    profitLossUSDCent: 0,
    profitLossPercent: 0,
    riskReward: 0,
    pips: 0,
    riskAmount: 0,
    potentialProfit: 0,
  });

  const psychologyOptions = [
    { value: "calm", label: "Calm", icon: <CheckCircle className="w-4 h-4" /> },
    { value: "fear", label: "Fear", icon: <XCircle className="w-4 h-4" /> },
    { value: "greedy", label: "Greedy", icon: <TrendingUp className="w-4 h-4" /> },
    { value: "overconfident", label: "Overconfident", icon: <Target className="w-4 h-4" /> },
    { value: "neutral", label: "Neutral", icon: <Percent className="w-4 h-4" /> },
  ];

  const marketConditions = [
    "Trending Up", "Trending Down", "Ranging", "Volatile", 
    "Low Volatility", "Breakout", "Reversal", "News Event"
  ];

  const sessions = ["London", "New York", "Tokyo", "Sydney", "Asian", "European", "US"];
  
  const strategies = [
    "Scalping", "Day Trading", "Swing Trading", "Position Trading",
    "Breakout", "Trend Following", "Counter-trend", "Range Trading",
    "News Trading", "Price Action", "Indicator Based", "Pattern Recognition"
  ];

  const psychologyColors: Record<string, string> = {
    calm: "bg-green-100 text-green-800 border-green-200",
    fear: "bg-blue-100 text-blue-800 border-blue-200",
    greedy: "bg-yellow-100 text-yellow-800 border-yellow-200",
    overconfident: "bg-purple-100 text-purple-800 border-purple-200",
    neutral: "bg-gray-100 text-gray-800 border-gray-200",
  };

  const formatCurrency = (value: number, type: string) => {
    if (type === "IDR") return `Rp ${value.toLocaleString()}`;
    if (type === "USD") return `$ ${value.toFixed(2)}`;
    if (type === "USD_CENT") return `${(value / 100).toFixed(2)}¢`;
    return value.toString();
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
    let pips = 0;

    if (!isNaN(exit)) {
      pips = Math.abs(exit - entry) / pipSize;
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
      pips,
      riskAmount,
      potentialProfit: rewardPips * lotSize * contractSize * pipSize,
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
    const template = `Market sentiment: ${formData.marketCondition || "Trending"}
Pattern observed: ${formData.strategyTag || "Breakout"}
News impact: ${formData.tradeReason || "Technical setup"}
Trade duration: ${formData.tradeDuration || "Intraday"}
Lessons: ${formData.lessonsLearned || "None"}`;
    setFormData((prev) => ({ ...prev, notes: template }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({ title: "Not Logged In", description: "You must be logged in to add trades.", variant: "destructive" });
      return;
    }

    if (!formData.entryPrice || !formData.stopLoss || !formData.takeProfit || !formData.lotSize) {
      toast({ title: "Missing Fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    if (!validateInputs()) {
      toast({
        title: "Invalid Input",
        description: formData.direction === "buy"
          ? "For Buy orders: SL < Entry < TP"
          : "For Sell orders: TP < Entry < SL",
        variant: "destructive",
      });
      return;
    }

    try {
      const entryPrice = parseFloat(formData.entryPrice);
      const exitPrice = parseFloat(formData.exitPrice) || parseFloat(formData.takeProfit);
      const lotSize = parseFloat(formData.lotSize);
      const contractSize = 100;

      let resultUSD = 0;
      let pnlPercent = 0;
      let pnlIDR = 0;
      let pnlUSDCent = 0;

      if (!isNaN(entryPrice) && !isNaN(exitPrice) && !isNaN(lotSize)) {
        resultUSD = formData.direction === "buy"
          ? (exitPrice - entryPrice) * lotSize * contractSize
          : (entryPrice - exitPrice) * lotSize * contractSize;

        pnlIDR = resultUSD * 15500;
        pnlUSDCent = resultUSD * 100;
        pnlPercent = (resultUSD / (entryPrice * lotSize * contractSize)) * 100;
      }

      let resultBalance = formData.balanceType === "IDR" ? pnlIDR
        : formData.balanceType === "USD" ? resultUSD
        : pnlUSDCent;

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
        trade_duration: formData.tradeDuration || null,
        market_condition: formData.marketCondition || null,
        trade_reason: formData.tradeReason || null,
        lessons_learned: formData.lessonsLearned || null,
      });

      if (insertError) throw insertError;

      const { data: profileData, error: fetchError } = await supabase
        .from("profiles")
        .select("idr_balance, usd_balance, usd_cent_balance")
        .eq("user_id", user.id)
        .single();

      if (fetchError) throw fetchError;

      const updateData = getUpdateData(formData.balanceType, profileData, resultBalance);

      const { error: updateError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      toast({ 
        title: "Trade Added Successfully", 
        description: `Your trade has been recorded and ${formData.balanceType} balance updated.`,
        variant: "default"
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
        tradeDuration: "",
        marketCondition: "",
        tradeReason: "",
        lessonsLearned: "",
      });
    } catch (error) {
      console.error("Error adding trade:", error);
      toast({ 
        title: "Error Adding Trade", 
        description: "Failed to add trade. Please try again.", 
        variant: "destructive" 
      });
    }
  };

  useEffect(() => {
    if (formData.entryPrice && formData.stopLoss && formData.takeProfit && formData.riskPercent) {
      calculateResults();
    }
  }, [formData.entryPrice, formData.exitPrice, formData.stopLoss, formData.takeProfit, formData.riskPercent, formData.direction]);

  return (
    <div className="w-full min-h-[80vh] bg-gradient-to-br from-background to-muted/20 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Add New Trade</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            Record your XAUUSD trading performance with detailed analysis and insights
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    <TabsTrigger value="entry" className="py-3">Entry</TabsTrigger>
                    <TabsTrigger value="risk" className="py-3">Risk</TabsTrigger>
                    <TabsTrigger value="meta" className="py-3">Meta</TabsTrigger>
                    <TabsTrigger value="extra" className="py-3">Analysis</TabsTrigger>
                  </TabsList>

                  {/* Entry tab */}
                  <TabsContent value="entry" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="pair">Trading Pair</Label>
                        <Select value={formData.pair} onValueChange={(value) => handleInputChange("pair", value)}>
                          <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="XAUUSD">XAU/USD (Gold)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="direction">Direction</Label>
                        <Select value={formData.direction} onValueChange={(value) => handleInputChange("direction", value)}>
                          <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="buy">Buy (Long)</SelectItem>
                            <SelectItem value="sell">Sell (Short)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="entryPrice">Entry Price</Label>
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
                      <div>
                        <Label htmlFor="exitPrice">Exit Price</Label>
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
                      <div>
                        <Label htmlFor="stopLoss">Stop Loss</Label>
                        <Input 
                          id="stopLoss" 
                          type="number" 
                          step="0.01" 
                          placeholder="2045.00" 
                          value={formData.stopLoss} 
                          onChange={(e) => handleInputChange("stopLoss", e.target.value)} 
                          className={`h-12 ${!validateInputs() && formData.entryPrice && formData.stopLoss ? "border-destructive" : ""}`} 
                        />
                        {!validateInputs() && formData.entryPrice && formData.stopLoss && (
                          <p className="text-destructive text-sm mt-1">
                            {formData.direction === "buy" 
                              ? "For Buy orders: SL must be less than Entry" 
                              : "For Sell orders: SL must be greater than Entry"}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="takeProfit">Take Profit</Label>
                        <Input 
                          id="takeProfit" 
                          type="number" 
                          step="0.01" 
                          placeholder="2055.00" 
                          value={formData.takeProfit} 
                          onChange={(e) => handleInputChange("takeProfit", e.target.value)} 
                          className={`h-12 ${!validateInputs() && formData.entryPrice && formData.takeProfit ? "border-destructive" : ""}`} 
                        />
                        {!validateInputs() && formData.entryPrice && formData.takeProfit && (
                          <p className="text-destructive text-sm mt-1">
                            {formData.direction === "buy" 
                              ? "For Buy orders: TP must be greater than Entry" 
                              : "For Sell orders: TP must be less than Entry"}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="tradeDuration">Trade Duration</Label>
                      <Select value={formData.tradeDuration} onValueChange={(value) => handleInputChange("tradeDuration", value)}>
                        <SelectTrigger className="h-12"><SelectValue placeholder="Select duration" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Scalp">Scalp (minutes)</SelectItem>
                          <SelectItem value="Intraday">Intraday (hours)</SelectItem>
                          <SelectItem value="Swing">Swing (days)</SelectItem>
                          <SelectItem value="Position">Position (weeks)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>

                  {/* Risk tab */}
                  <TabsContent value="risk" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <Label htmlFor="lotSize">Lot Size (Auto-calculated)</Label>
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
                      <div>
                        <Label htmlFor="riskPercent">Risk %</Label>
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
                      <div>
                        <Label>Balance Type</Label>
                        <div className="flex space-x-2 mt-1">
                          {["IDR", "USD", "USD_CENT"].map((type) => (
                            <Button 
                              key={type} 
                              variant={formData.balanceType === type ? "default" : "outline"} 
                              onClick={() => handleInputChange("balanceType", type)}
                              size="sm"
                            >
                              {type}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="commission">Commission</Label>
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
                      <div>
                        <Label htmlFor="swap">Swap</Label>
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

                    <div>
                      <Label htmlFor="screenshotUrl">Screenshot URL</Label>
                      <div className="flex space-x-2">
                        <Input 
                          id="screenshotUrl" 
                          type="url" 
                          placeholder="https://example.com/screenshot.png" 
                          value={formData.screenshotUrl} 
                          onChange={(e) => handleInputChange("screenshotUrl", e.target.value)} 
                          className="h-12" 
                        />
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => {
                            // In a real app, this would open a file picker
                            handleInputChange("screenshotUrl", "https://example.com/screenshot.png");
                          }}
                        >
                          <FileImage className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Meta tab */}
                  <TabsContent value="meta" className="space-y-6">
                    <div>
                      <Label>Emotional Psychology</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {psychologyOptions.map((option) => (
                          <Badge 
                            key={option.value}
                            variant={formData.emotionalPsychology === option.value ? "default" : "outline"}
                            className={`cursor-pointer ${psychologyColors[option.value]}`}
                            onClick={() => handleInputChange("emotionalPsychology", option.value)}
                          >
                            <span className="flex items-center gap-1">
                              {option.icon}
                              {option.label}
                            </span>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="session">Trading Session</Label>
                        <Select value={formData.session} onValueChange={(value) => handleInputChange("session", value)}>
                          <SelectTrigger className="h-12"><SelectValue placeholder="Select session" /></SelectTrigger>
                          <SelectContent>
                            {sessions.map((session) => (
                              <SelectItem key={session} value={session}>{session}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="strategyTag">Strategy</Label>
                        <Select value={formData.strategyTag} onValueChange={(value) => handleInputChange("strategyTag", value)}>
                          <SelectTrigger className="h-12"><SelectValue placeholder="Select strategy" /></SelectTrigger>
                          <SelectContent>
                            {strategies.map((strategy) => (
                              <SelectItem key={strategy} value={strategy}>{strategy}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="marketCondition">Market Condition</Label>
                      <Select value={formData.marketCondition} onValueChange={(value) => handleInputChange("marketCondition", value)}>
                        <SelectTrigger className="h-12"><SelectValue placeholder="Select condition" /></SelectTrigger>
                        <SelectContent>
                          {marketConditions.map((condition) => (
                            <SelectItem key={condition} value={condition}>{condition}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="tradeReason">Trade Reason</Label>
                      <Textarea 
                        id="tradeReason" 
                        placeholder="Why did you take this trade?" 
                        value={formData.tradeReason} 
                        onChange={(e) => handleInputChange("tradeReason", e.target.value)} 
                        className="min-h-[100px]"
                      />
                    </div>
                  </TabsContent>

                  {/* Analysis tab */}
                  <TabsContent value="extra" className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="confidenceLevel">Confidence Level</Label>
                        <Badge variant="outline">{formData.confidenceLevel}/5</Badge>
                      </div>
                      <Slider
                        value={[formData.confidenceLevel]}
                        onValueChange={(value) => handleInputChange("confidenceLevel", value[0])}
                        max={5}
                        min={1}
                        step={1}
                        className="mt-4"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Low</span>
                        <span>Medium</span>
                        <span>High</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="notes">Trade Notes</Label>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={insertTemplateNotes}
                          className="text-xs"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          Use Template
                        </Button>
                      </div>
                      <Textarea 
                        id="notes" 
                        placeholder="Detailed notes about your trade..." 
                        value={formData.notes} 
                        onChange={(e) => handleInputChange("notes", e.target.value)} 
                        className="min-h-[150px]"
                      />
                    </div>

                    <div>
                      <Label htmlFor="lessonsLearned">Lessons Learned</Label>
                      <Textarea 
                        id="lessonsLearned" 
                        placeholder="What did you learn from this trade?" 
                        value={formData.lessonsLearned} 
                        onChange={(e) => handleInputChange("lessonsLearned", e.target.value)} 
                        className="min-h-[100px]"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex justify-between border-t px-6 py-4">
                <Button variant="outline" onClick={() => navigate("/trades")}>
                  Cancel
                </Button>
                <Button type="submit" className="w-full md:w-auto" onClick={handleSubmit}>
                  Save Trade
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Right Column - Calculations */}
          <div>
            <Card className="bg-card border-border shadow-lg sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Calculator className="w-6 h-6 mr-3 text-primary" />
                  Trade Calculations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <div className="text-xs text-muted-foreground">Risk Reward</div>
                    <div className="text-lg font-semibold">{calculations.riskReward.toFixed(2)}</div>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <div className="text-xs text-muted-foreground">Pips</div>
                    <div className="text-lg font-semibold">{calculations.pips.toFixed(1)}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Risk Amount</span>
                    <span className="font-medium">
                      {formatCurrency(calculations.riskAmount, formData.balanceType)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Potential Profit</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(calculations.potentialProfit, formData.balanceType)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">PnL (IDR)</span>
                    <span className={`font-medium ${calculations.profitLossIDR >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(calculations.profitLossIDR, "IDR")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">PnL (USD)</span>
                    <span className={`font-medium ${calculations.profitLossUSD >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(calculations.profitLossUSD, "USD")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">PnL (USD Cent)</span>
                    <span className={`font-medium ${calculations.profitLossUSDCent >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(calculations.profitLossUSDCent, "USD_CENT")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">PnL %</span>
                    <span className={`font-medium ${calculations.profitLossPercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {calculations.profitLossPercent.toFixed(2)}%
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Info className="w-4 h-4 mr-1" />
                    Calculations update automatically as you enter values
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTrade;