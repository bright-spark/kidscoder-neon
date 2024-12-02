import React, { createContext, useContext, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { SessionContext as SessionContextType } from '@/lib/types';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const LOCAL_STORAGE_KEY = 'kidscoder_session';

const SessionContext = createContext<SessionContextType | null>(null);

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

interface SessionProviderProps {
  children: React.ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  // Initialize state from localStorage or create new session
  const [sessionState, setSessionState] = useState<Omit<SessionContextType, keyof {
    updateLastActive: never;
    setProjectName: never;
    addCodeHistory: never;
    clearSession: never;
  }>>(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        startTime: new Date(parsed.startTime),
        lastActive: new Date(parsed.lastActive),
        codeHistory: parsed.codeHistory.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }))
      };
    }
    return {
      sessionId: uuidv4(),
      startTime: new Date(),
      lastActive: new Date(),
      projectName: 'Untitled Project',
      isActive: true,
      codeHistory: []
    };
  });

  // Update localStorage when session state changes
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessionState));
  }, [sessionState]);

  // Check session timeout
  useEffect(() => {
    const checkTimeout = () => {
      if (!sessionState.isActive) return;

      const now = new Date();
      const timeSinceLastActive = now.getTime() - sessionState.lastActive.getTime();

      if (timeSinceLastActive > SESSION_TIMEOUT) {
        setSessionState(prev => ({ ...prev, isActive: false }));
      }
    };

    const interval = setInterval(checkTimeout, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [sessionState.isActive, sessionState.lastActive]);

  // Session context methods
  const updateLastActive = () => {
    setSessionState(prev => ({
      ...prev,
      lastActive: new Date(),
      isActive: true
    }));
  };

  const setProjectName = (name: string) => {
    setSessionState(prev => ({
      ...prev,
      projectName: name
    }));
  };

  const addCodeHistory = (code: string, type: 'generate' | 'debug' | 'improve') => {
    setSessionState(prev => ({
      ...prev,
      codeHistory: [
        ...prev.codeHistory,
        {
          timestamp: new Date(),
          code,
          type
        }
      ]
    }));
  };

  const clearSession = () => {
    const newSession = {
      sessionId: uuidv4(),
      startTime: new Date(),
      lastActive: new Date(),
      projectName: 'Untitled Project',
      isActive: true,
      codeHistory: []
    };
    setSessionState(newSession);
  };

  const value: SessionContextType = {
    ...sessionState,
    updateLastActive,
    setProjectName,
    addCodeHistory,
    clearSession
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}
