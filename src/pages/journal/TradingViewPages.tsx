import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import TradingViewWidget from "@/components/journal/TradingViewWidget";

const TradingViewPage = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="w-full border-b border-border p-3 bg-background z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/journal/add-trade")}
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Add Trade
            </Button>
            <h1 className="text-lg font-semibold text-foreground">
              TradingView Full Chart
            </h1>
          </div>
        </div>
      </div>

      {/* Chart - full flex */}
      <div className="flex-1 w-full overflow-hidden">
        <TradingViewWidget />
      </div>
    </div>
  );
};

export default TradingViewPage;
