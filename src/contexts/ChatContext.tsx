import { createContext, useContext, useState, useEffect } from 'react';
import type { ChatContext, Message } from '@/lib/types';
import { sessionContext } from '@/lib/sessionContext';

const ChatContext = createContext<ChatContext | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [contextId] = useState<string>(crypto.randomUUID());
  const [totalCharacters, setTotalCharacters] = useState<number>(0);

  // Initialize state from session context
  useEffect(() => {
    const state = sessionContext.getState();
    setMessages(state.messages);
    setTotalCharacters(state.totalCharacters);
  }, []);

  const addMessage = (message: Message) => {
    sessionContext.addMessage(message);
    setMessages(prev => [...prev, message]);
    setTotalCharacters(prev => prev + message.content.length);
  };

  const updateLastMessage = (content: string) => {
    setMessages(prev => {
      const newMessages = [...prev];
      if (newMessages.length > 0) {
        const lastMessage = newMessages[newMessages.length - 1];
        newMessages[newMessages.length - 1] = {
          ...lastMessage,
          content
        };
        sessionContext.updateState({ messages: newMessages });
      }
      return newMessages;
    });
  };

  const clearLastMessage = () => {
    setMessages(prev => {
      const lastUserMessageIndex = [...prev].reverse().findIndex(msg => msg.role === 'user');
      if (lastUserMessageIndex === -1) return prev;
      const newMessages = prev.slice(0, prev.length - lastUserMessageIndex - 1);
      sessionContext.updateState({ messages: newMessages });
      return newMessages;
    });
  };

  const clearMessages = () => {
    sessionContext.clearSession();
    setMessages([]);
    setTotalCharacters(0);
  };

  const updateTotalCharacters = (count: number) => {
    const newTotal = totalCharacters + count;
    sessionContext.updateState({ totalCharacters: newTotal });
    setTotalCharacters(newTotal);
  };

  return (
    <ChatContext.Provider value={{
      messages,
      contextId,
      totalCharacters,
      addMessage,
      clearMessages,
      clearLastMessage,
      updateLastMessage,
      updateTotalCharacters
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}