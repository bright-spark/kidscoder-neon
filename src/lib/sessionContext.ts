import { Message } from '@/lib/types';

interface SessionState {
  messages: Message[];
  code: string;
  promptCount: number;
  totalCharacters: number;
}

class SessionContext {
  private static instance: SessionContext;
  private sessionState: SessionState;

  private constructor() {
    this.sessionState = {
      messages: [],
      code: '',
      promptCount: 0,
      totalCharacters: 0
    };
  }

  public static getInstance(): SessionContext {
    if (!SessionContext.instance) {
      SessionContext.instance = new SessionContext();
    }
    return SessionContext.instance;
  }

  public getState(): SessionState {
    return { ...this.sessionState };
  }

  public updateState(updates: Partial<SessionState>) {
    this.sessionState = {
      ...this.sessionState,
      ...updates
    };
  }

  public addMessage(message: Message) {
    this.sessionState.messages = [...this.sessionState.messages, message];
    this.sessionState.totalCharacters += message.content.length;
  }

  public updateCode(code: string) {
    this.sessionState.code = code;
  }

  public incrementPromptCount() {
    this.sessionState.promptCount += 1;
  }

  public clearSession() {
    this.sessionState = {
      messages: [],
      code: '',
      promptCount: 0,
      totalCharacters: 0
    };
  }

  public getCode(): string {
    return this.sessionState.code;
  }

  public getPromptCount(): number {
    return this.sessionState.promptCount;
  }

  public setPromptCount(count: number) {
    this.sessionState.promptCount = count;
  }
}

export const sessionContext = SessionContext.getInstance();
