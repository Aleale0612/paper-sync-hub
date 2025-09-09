import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  content: string;
  is_bot: boolean;
  created_at: string;
}

export const useChatHistory = () => {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load chat sessions
  const loadChatSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setChatSessions(data || []);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load chat history",
        variant: "destructive",
      });
    }
  };

  // Load messages for a session
  const loadMessages = async (sessionId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load chat messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Create new chat session
  const createNewSession = async (firstMessage?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const title = firstMessage ? 
        firstMessage.substring(0, 50) + (firstMessage.length > 50 ? '...' : '') :
        'New Chat';

      const { data, error } = await supabase
        .from('chat_sessions')
        .insert([{
          user_id: user.id,
          title
        }])
        .select()
        .single();

      if (error) throw error;
      
      setCurrentSession(data.id);
      setMessages([]);
      await loadChatSessions();
      
      return data.id;
    } catch (error) {
      console.error('Error creating new session:', error);
      toast({
        title: "Error",
        description: "Failed to create new chat",
        variant: "destructive",
      });
      return null;
    }
  };

  // Save message to database
  const saveMessage = async (sessionId: string, content: string, isBot: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('chat_messages')
        .insert([{
          session_id: sessionId,
          user_id: user.id,
          content,
          is_bot: isBot
        }])
        .select()
        .single();

      if (error) throw error;

      // Update session timestamp
      await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId);

      return data;
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  };

  // Delete chat session
  const deleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      setChatSessions(prev => prev.filter(session => session.id !== sessionId));
      
      if (currentSession === sessionId) {
        setCurrentSession(null);
        setMessages([]);
      }

      toast({
        title: "Success",
        description: "Chat deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Error",
        description: "Failed to delete chat",
        variant: "destructive",
      });
    }
  };

  // Clear all chat history
  const clearAllHistory = async () => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all user sessions

      if (error) throw error;

      setChatSessions([]);
      setCurrentSession(null);
      setMessages([]);

      toast({
        title: "Success",
        description: "Chat history cleared successfully",
      });
    } catch (error) {
      console.error('Error clearing history:', error);
      toast({
        title: "Error",
        description: "Failed to clear chat history",
        variant: "destructive",
      });
    }
  };

  // Load chat sessions on mount
  useEffect(() => {
    loadChatSessions();
  }, []);

  // Load messages when session changes
  useEffect(() => {
    if (currentSession) {
      loadMessages(currentSession);
    } else {
      setMessages([]);
    }
  }, [currentSession]);

  return {
    chatSessions,
    currentSession,
    messages,
    loading,
    setCurrentSession,
    setMessages,
    createNewSession,
    saveMessage,
    deleteSession,
    clearAllHistory,
    loadChatSessions
  };
};