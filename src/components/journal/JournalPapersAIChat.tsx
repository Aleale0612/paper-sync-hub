import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Send, Bot, User, Brain, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useChatHistory, type ChatMessage } from "@/hooks/useChatHistory";

interface JournalPapersAIChatProps {
  sessionId?: string | null;
}

export const JournalPapersAIChat = ({ sessionId }: JournalPapersAIChatProps) => {
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const { toast } = useToast();
  const { messages, saveMessage, createNewSession } = useChatHistory();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Default welcome message
  const welcomeMessage: ChatMessage = {
    id: "welcome",
    session_id: sessionId || "welcome",
    content: "Hello! I'm JournalPapersAI, powered by GLM-4.5. I'm your intelligent trading companion specializing in trading psychology, brain science, algorithmic psychology, and technical expertise. I can help you analyze your trading performance, provide market insights, and answer questions about trading strategies. How can I assist you today?",
    is_bot: true,
    created_at: new Date().toISOString(),
  };

  // Auto scroll to bottom
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [localMessages]);

  // Sync messages from hook with local state
  useEffect(() => {
    if (sessionId && messages.length > 0) {
      setLocalMessages(messages);
    } else {
      setLocalMessages([welcomeMessage]);
    }
  }, [sessionId, messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    try {
      setIsLoading(true);
      let currentSessionId = sessionId;

      // Create new session if none exists
      if (!currentSessionId) {
        currentSessionId = await createNewSession(inputMessage);
        if (!currentSessionId) {
          throw new Error('Failed to create chat session');
        }
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Save user message to database
      await saveMessage(currentSessionId, inputMessage, false);
      
      // Add user message to local state
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        content: inputMessage,
        is_bot: false,
        created_at: new Date().toISOString(),
        session_id: currentSessionId,
      };
      setLocalMessages(prev => [...prev, userMessage]);
      setInputMessage("");

      // Call the AI edge function
      const { data, error } = await supabase.functions.invoke('journalpapers-ai-chat', {
        body: {
          message: inputMessage,
          sessionId: currentSessionId,
          userId: user.id
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to get AI response');
      }

      if (data?.response) {
        // Save AI response to database
        await saveMessage(currentSessionId, data.response, true);
        
        // Add AI response to local state
        const botResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: data.response,
          is_bot: true,
          created_at: new Date().toISOString(),
          session_id: currentSessionId,
        };
        setLocalMessages(prev => [...prev, botResponse]);
      } else {
        throw new Error('No response from AI');
      }

    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Display local messages
  const displayMessages = localMessages;

  return (
    <div className="h-full flex flex-col">
      
      {/* Chat Messages */}
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4 space-y-6">
          {displayMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.is_bot ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`flex max-w-[80%] ${
                  message.is_bot ? "flex-row" : "flex-row-reverse"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.is_bot ? "bg-primary mr-3" : "bg-secondary ml-3"
                  }`}
                >
                  {message.is_bot ? (
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  ) : (
                    <User className="w-4 h-4 text-secondary-foreground" />
                  )}
                </div>
                <div className="flex flex-col">
                  <div
                    className={`p-3 rounded-xl ${
                      message.is_bot
                        ? "bg-muted text-foreground rounded-tl-none"
                        : "bg-primary text-primary-foreground rounded-tr-none"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  <p className={`text-xs opacity-70 mt-1 ${
                    message.is_bot ? "text-left" : "text-right"
                  }`}>
                    {formatTimestamp(message.created_at)}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex">
                <div className="w-8 h-8 rounded-full bg-primary mr-3 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="p-3 rounded-xl bg-muted rounded-tl-none">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Input Area */}
      <div className="p-4 border-t border-border/50 bg-gradient-to-t from-background to-transparent flex-shrink-0">
        <Card className="shadow-sm">
          <CardContent className="p-3">
            <div className="flex space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask JournalPapersAI anything about trading psychology, performance analysis..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                onClick={sendMessage} 
                disabled={isLoading || !inputMessage.trim()}
                size="sm"
                className="px-4"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                Press Enter to send, Shift+Enter for new line
              </p>
              <Badge variant="outline" className="text-xs">
                GLM-4.5
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};