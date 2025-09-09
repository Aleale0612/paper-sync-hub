import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, MessageCircle, BarChart3, Calendar, Target } from 'lucide-react';
import TradingMentorChat from '@/components-from-github/TradingMentorChat';

const TradingMentor: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Trading Mentor AI</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mb-6">
            Your personal trading psychology coach and market fundamentals analyst. 
            Get guidance on emotional control, discipline, and real-time market insights.
          </p>
          
          <div className="flex flex-wrap gap-2 mb-8">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Brain className="h-3 w-3" />
              Psychology Guidance
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Market Analysis
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              Interactive Chat
            </Badge>
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Box */}
          <div className="lg:col-span-2">
            <TradingMentorChat />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Psychology Support
                </CardTitle>
                <CardDescription>
                  Get help with common trading challenges
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {['Emotional control & discipline', 'FOMO & revenge trading', 'Confidence building', 'Risk management mindset'].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    {item}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Market Fundamentals
                </CardTitle>
                <CardDescription>
                  Real-time analysis and insights
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {['Central bank decisions', 'Economic news impact', 'Market sentiment analysis', 'Gold & forex insights'].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    {item}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Coming Soon
                </CardTitle>
                <CardDescription>
                  Expanded features in development
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-muted-foreground">
                <div className="flex items-center gap-2 text-sm">
                  <BarChart3 className="h-4 w-4" />
                  Psychology Dashboard
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  Economic Calendar
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4" />
                  Mood Tracking
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingMentor;
