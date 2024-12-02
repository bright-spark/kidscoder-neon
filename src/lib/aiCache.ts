import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { showToast } from "./toast";

interface CacheEntry {
  response: string;
  timestamp: number;
  tokens: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  totalTokensSaved: number;
}

class AICache {
  private static instance: AICache;
  private memoryCache: Map<string, CacheEntry>;
  private readonly CACHE_KEY = 'ai_response_cache';
  private readonly STATS_KEY = 'ai_cache_stats';
  private readonly MAX_CACHE_AGE = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_CACHE_ENTRIES = 1000;
  private stats: CacheStats;

  private constructor() {
    this.memoryCache = new Map();
    this.stats = this.loadStats();
    this.loadCacheFromStorage();
  }

  public static getInstance(): AICache {
    if (!AICache.instance) {
      AICache.instance = new AICache();
    }
    return AICache.instance;
  }

  private generateCacheKey(messages: ChatCompletionMessageParam[]): string {
    // Ensure messages is an array and handle undefined cases
    const messageArray = Array.isArray(messages) ? messages : [];
    
    // Create a deterministic key from messages
    const key = messageArray.map(msg => ({
      role: msg.role,
      content: msg.content?.toString().trim() || ''
    }));
    
    // Use encodeURIComponent to handle Unicode characters properly
    return encodeURIComponent(JSON.stringify(key));
  }

  private loadStats(): CacheStats {
    try {
      const stats = localStorage.getItem(this.STATS_KEY);
      return stats ? JSON.parse(stats) : { hits: 0, misses: 0, totalTokensSaved: 0 };
    } catch {
      return { hits: 0, misses: 0, totalTokensSaved: 0 };
    }
  }

  private saveStats(): void {
    try {
      localStorage.setItem(this.STATS_KEY, JSON.stringify(this.stats));
    } catch (error) {
      console.warn('Failed to save cache stats:', error);
    }
  }

  private loadCacheFromStorage(): void {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached) {
        const entries = JSON.parse(cached) as [string, CacheEntry][];
        this.memoryCache = new Map(entries);
        this.cleanCache();
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
      this.memoryCache.clear();
    }
  }

  private saveCacheToStorage(): void {
    try {
      const entries = Array.from(this.memoryCache.entries());
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }

  private cleanCache(): void {
    const now = Date.now();
    let entriesRemoved = 0;

    // Remove expired entries
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > this.MAX_CACHE_AGE) {
        this.memoryCache.delete(key);
        entriesRemoved++;
      }
    }

    // If still over limit, remove oldest entries
    if (this.memoryCache.size > this.MAX_CACHE_ENTRIES) {
      const entries = Array.from(this.memoryCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = this.memoryCache.size - this.MAX_CACHE_ENTRIES;
      entries.slice(0, toRemove).forEach(([key]) => {
        this.memoryCache.delete(key);
        entriesRemoved++;
      });
    }

    if (entriesRemoved > 0) {
      this.saveCacheToStorage();
    }
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 chars per token
    return Math.ceil(text.length / 4);
  }

  public async get(messages: ChatCompletionMessageParam[]): Promise<string | null> {
    const key = this.generateCacheKey(messages);
    const entry = this.memoryCache.get(key);

    if (entry && Date.now() - entry.timestamp <= this.MAX_CACHE_AGE) {
      this.stats.hits++;
      this.stats.totalTokensSaved += entry.tokens;
      this.saveStats();
      
      showToast.system({
        title: 'Cache Hit',
        description: 'Using cached response to save tokens',
        duration: 2000
      });
      
      return entry.response;
    }

    this.stats.misses++;
    this.saveStats();
    return null;
  }

  public set(messages: ChatCompletionMessageParam[], response: string): void {
    const key = this.generateCacheKey(messages);
    const tokens = this.estimateTokens(response);

    this.memoryCache.set(key, {
      response,
      timestamp: Date.now(),
      tokens
    });

    // Clean cache if it's getting too large
    if (this.memoryCache.size > this.MAX_CACHE_ENTRIES) {
      this.cleanCache();
    }

    this.saveCacheToStorage();
  }

  public getStats(): CacheStats {
    return { ...this.stats };
  }

  public clearCache(): void {
    this.memoryCache.clear();
    localStorage.removeItem(this.CACHE_KEY);
    this.stats = { hits: 0, misses: 0, totalTokensSaved: 0 };
    this.saveStats();
    
    showToast.system({
      title: 'Cache Cleared',
      description: 'AI response cache has been cleared',
      duration: 2000
    });
  }
}

export const aiCache = AICache.getInstance();
