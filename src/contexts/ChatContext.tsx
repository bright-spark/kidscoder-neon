import { createContext, useContext, useState } from 'react';
import type { ChatContext, Message } from '@/lib/types';

const ChatContext = createContext<ChatContext | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [contextId, setContextId] = useState<string>(crypto.randomUUID());
  const [totalCharacters, setTotalCharacters] = useState<number>(0);

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
    setTotalCharacters((prev) => prev + message.content.length);
  };

  const updateLastMessage = (content: string) => {
    setMessages((prev) => {
      const newMessages = [...prev];
      if (newMessages.length > 0) {
        const lastMessage = newMessages[newMessages.length - 1];
        newMessages[newMessages.length - 1] = {
          ...lastMessage,
          content
        };
      }
      return newMessages;
    });
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
    setTotalCharacters(0);
  };

  const updateTotalCharacters = (count: number) => {
    setTotalCharacters((prev) => prev + count);
  };

  return (
    <ChatContext.Provider value={{
      messages,
      addMessage,
      clearMessages,
      clearLastMessage,
      updateLastMessage,
      contextId,
      totalCharacters,
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