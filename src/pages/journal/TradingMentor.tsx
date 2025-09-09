// This file was migrated from the journalpapers repository
// Original path: src/pages/TradingMentor.tsx

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TradingMentorChat } from "@/components/journal/TradingMentorChat";

const TradingMentor = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Trading Mentor</CardTitle>
          <CardDescription>
            Get personalized trading advice, market analysis, and performance insights from your AI mentor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TradingMentorChat />
        </CardContent>
      </Card>
    </div>
  );
};

export default TradingMentor;