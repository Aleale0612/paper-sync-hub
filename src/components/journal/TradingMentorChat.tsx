// This file was migrated from the journalpapers repository
// Original path: src/components/TradingMentorChat.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Send, Bot, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

export const TradingMentorChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm your AI Trading Mentor. I can help you analyze your trading performance, provide market insights, and answer questions about trading strategies. How can I assist you today?",
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // This is a placeholder for the AI response
      // In the real implementation, this would call the Supabase Edge Function
      setTimeout(() => {
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: `I understand you're asking about "${inputMessage}". As your trading mentor, I'd recommend focusing on risk management and maintaining a trading journal to track your performance. Would you like me to analyze your recent trades or discuss specific trading strategies?`,
          isBot: true,
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, botResponse]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-[600px] flex flex-col">
      <ScrollArea className="flex-1 p-4 border rounded-lg mb-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isBot ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`flex max-w-[80%] ${
                  message.isBot ? "flex-row" : "flex-row-reverse"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.isBot ? "bg-primary mr-2" : "bg-secondary ml-2"
                  }`}
                >
                  {message.isBot ? (
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  ) : (
                    <User className="w-4 h-4 text-secondary-foreground" />
                  )}
                </div>
                <Card
                  className={`p-3 ${
                    message.isBot
                      ? "bg-muted"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </Card>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex">
                <div className="w-8 h-8 rounded-full bg-primary mr-2 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <Card className="p-3 bg-muted">
                  <p className="text-sm">Thinking...</p>
                </Card>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      <div className="flex space-x-2">
        <Input
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask your trading mentor anything..."
          disabled={isLoading}
        />
        <Button onClick={sendMessage} disabled={isLoading || !inputMessage.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};