import { ChatCompletionMessageParam } from "openai/resources/chat";

interface CacheEntry {
  response: string;
  timestamp: number;
}

interface RateLimitInfo {
  lastRequestTime: number;
  requestCount: number;
}

class AICache {
  private static instance: AICache;
  private cache: Map<string, CacheEntry>;
  private rateLimitInfo: RateLimitInfo;
  private readonly CACHE_EXPIRY = 1000 * 60 * 60; // 1 hour
  private readonly RATE_LIMIT_WINDOW = 1000 * 60; // 1 minute
  private readonly MAX_REQUESTS_PER_WINDOW = 50;

  private constructor() {
    this.cache = new Map();
    this.rateLimitInfo = {
      lastRequestTime: 0,
      requestCount: 0,
    };
  }

  public static getInstance(): AICache {
    if (!AICache.instance) {
      AICache.instance = new AICache();
    }
    return AICache.instance;
  }

  private generateCacheKey(messages: ChatCompletionMessageParam[]): string {
    return JSON.stringify(messages.map(msg => ({
      role: msg.role,
      content: msg.content
    })));
  }

  private isEntryValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < this.CACHE_EXPIRY;
  }

  private cleanExpiredEntries(): void {
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isEntryValid(entry)) {
        this.cache.delete(key);
      }
    }
  }

  public async getCachedResponse(messages: ChatCompletionMessageParam[]): Promise<string | null> {
    const key = this.generateCacheKey(messages);
    const entry = this.cache.get(key);

    if (entry && this.isEntryValid(entry)) {
      return entry.response;
    }

    return null;
  }

  public setCachedResponse(messages: ChatCompletionMessageParam[], response: string): void {
    const key = this.generateCacheKey(messages);
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
    });

    // Clean expired entries periodically
    if (Math.random() < 0.1) { // 10% chance to clean on each set
      this.cleanExpiredEntries();
    }
  }

  public async checkRateLimit(): Promise<boolean> {
    const now = Date.now();
    
    // Reset counter if we're in a new window
    if (now - this.rateLimitInfo.lastRequestTime > this.RATE_LIMIT_WINDOW) {
      this.rateLimitInfo = {
        lastRequestTime: now,
        requestCount: 0,
      };
      return true;
    }

    // Increment counter
    this.rateLimitInfo.requestCount++;
    this.rateLimitInfo.lastRequestTime = now;

    // Check if we're over the limit
    return this.rateLimitInfo.requestCount <= this.MAX_REQUESTS_PER_WINDOW;
  }

  public async waitForRateLimit(): Promise<void> {
    while (!(await this.checkRateLimit())) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

export const aiCache = AICache.getInstance();
