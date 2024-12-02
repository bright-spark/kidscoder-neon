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
  isImproving: boolean;
  isDebugging: boolean;
  currentOperation: 'debug' | 'improve' | 'prompt';
  promptCount: number;
  handleClear: () => void;
  handleGenerate: (prompt: string) => Promise<void>;
  handleShare: () => Promise<void>;
  handleDebug: () => Promise<void>;
  handleImprove: () => Promise<void>;
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