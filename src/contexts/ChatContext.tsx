import { createContext, useContext, useState } from 'react';
import type { ChatContext, Message } from '@/lib/types';

const ChatContext = createContext<ChatContext | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [contextId, setContextId] = useState<string>(crypto.randomUUID());

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  const clearLastMessage = () => {
    setMessages((prev) => {
      const lastUserMessageIndex = [...prev].reverse().findIndex(msg => msg.role === 'user');
      if (lastUserMessageIndex === -1) return prev;
      return prev.slice(0, prev.length - lastUserMessageIndex - 1);
    });
  };

  const clearMessages = () => {
    setMessages([]);
    setContextId(crypto.randomUUID());
  };

  return (
    <ChatContext.Provider value={{ messages, addMessage, clearMessages, clearLastMessage, contextId }}>
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