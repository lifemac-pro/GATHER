/**
 * Simple in-memory cache implementation with TTL support
 */

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class Cache {
  private static instance: Cache;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  private constructor() {
    // Private constructor for singleton pattern
    
    // Clean up expired cache entries every minute
    setInterval(() => this.cleanupExpiredEntries(), 60 * 1000);
  }

  public static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache();
    }
    return Cache.instance;
  }

  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Value to cache
   * @param options Cache options
   */
  public set<T>(key: string, value: T, options: CacheOptions = {}): void {
    const ttl = options.ttl || this.DEFAULT_TTL;
    const expiresAt = Date.now() + ttl;
    
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns The cached value or undefined if not found or expired
   */
  public get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }
    
    // Check if the entry has expired
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.value as T;
  }

  /**
   * Delete a value from the cache
   * @param key Cache key
   */
  public delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all entries from the cache
   */
  public clear(): void {
    this.cache.clear();
  }

  /**
   * Get a value from the cache or compute it if not found
   * @param key Cache key
   * @param fn Function to compute the value if not in cache
   * @param options Cache options
   * @returns The cached or computed value
   */
  public async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cachedValue = this.get<T>(key);
    
    if (cachedValue !== undefined) {
      return cachedValue;
    }
    
    const value = await fn();
    this.set(key, value, options);
    return value;
  }

  /**
   * Remove expired entries from the cache
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
      }
    }
  }
}

// Export a singleton instance
export const cache = Cache.getInstance();
