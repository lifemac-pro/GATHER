/**
 * Simple in-memory cache implementation with TTL support
 */

class Cache {
  constructor() {
    this.cache = new Map();
    this.DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    // Clean up expired cache entries every minute
    setInterval(() => this.cleanupExpiredEntries(), 60 * 1000);
  }

  /**
   * Set a value in the cache
   * @param {string} key Cache key
   * @param {any} value Value to cache
   * @param {Object} options Cache options
   * @param {number} [options.ttl] Time to live in milliseconds
   */
  set(key, value, options = {}) {
    const ttl = options.ttl || this.DEFAULT_TTL;
    const expiresAt = Date.now() + ttl;
    
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Get a value from the cache
   * @param {string} key Cache key
   * @returns {any} The cached value or undefined if not found or expired
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }
    
    // Check if the entry has expired
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.value;
  }

  /**
   * Delete a value from the cache
   * @param {string} key Cache key
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all entries from the cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get a value from the cache or compute it if not found
   * @param {string} key Cache key
   * @param {Function} fn Function to compute the value if not in cache
   * @param {Object} options Cache options
   * @param {number} [options.ttl] Time to live in milliseconds
   * @returns {Promise<any>} The cached or computed value
   */
  async getOrSet(key, fn, options = {}) {
    const cachedValue = this.get(key);
    
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
  cleanupExpiredEntries() {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
      }
    }
  }
}

// Export a singleton instance
const cache = new Cache();
module.exports = { cache };
