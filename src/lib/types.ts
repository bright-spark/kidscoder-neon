export type MessageRole = 'user' | 'assistant';

export interface Message {
  role: MessageRole;
  content: string;
}

export interface ChatContext {
  messages: Message[];
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  clearLastMessage: () => void;
  updateLastMessage: (content: string) => void;
  contextId: string;
  totalCharacters: number;
  updateTotalCharacters: (count: number) => void;
}

export interface EditorContext {
  code: string;
  setCode: (code: string) => void;
  isProcessing: boolean;
  promptCount: number;
  currentOperation: 'prompt';
  handleClear: () => void;
  handleGenerate: (prompt: string) => Promise<void>;
  handleShare?: () => void;
  cancelOperation: () => void;
  language: string;
  setLanguage: (language: string) => void;
}

export interface PreviewContext {
  html: string;
  setHtml: (html: string) => void;
}

export type ToastVariant = 'system' | 'error' | 'success' | 'warning' | 'progress';

export interface ToastOptions {
  title: string;
  description?: string;
  duration?: number;
}

export type ButtonIntent = "primary" | "secondary" | "preview" | "danger" | "success" | "ghost" | "link" | "debug" | "improve";

export interface SessionContext {
  sessionId: string;
  startTime: Date;
  lastActive: Date;
  projectName: string;
  isActive: boolean;
  codeHistory: Array<{
    timestamp: Date;
    code: string;
    type: 'generate' | 'debug' | 'improve';
  }>;
  messages: Message[];
  updateLastActive: () => void;
  setProjectName: (name: string) => void;
  addCodeHistory: (code: string, type: 'generate' | 'debug' | 'improve') => void;
  clearSession: () => void;
  updateTotalCharacters: (count: number) => void;
}