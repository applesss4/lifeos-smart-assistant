/**
 * Cache Management Module
 * Implements LRU (Least Recently Used) caching with TTL (Time To Live) support
 * Integrates with memory management for adaptive caching
 * Validates: Requirements 6.2, 10.1, 10.2, 10.4, 8.4
 */

import { memoryManager, memoryMonitor } from './memoryManager';

interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;  // Creation time
  ttl: number;  // Time to live (ms)
  accessCount: number;  // Access count for statistics
  lastAccessed: number;  // Last access time for LRU
}

interface CacheConfig {
  ttl: number;  // Default time to live (ms)
  maxSize: number;  // Maximum cache entries
  strategy: 'lru' | 'lfu' | 'fifo';  // Cache eviction strategy
}

interface RefreshConfig<T> {
  key: string;
  fetcher: () => Promise<T>;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

/**
 * CacheManager class implementing LRU caching with TTL support
 */
export class CacheManager {
  private cache: Map<string, CacheEntry<any>>;
  private config: CacheConfig;
  private refreshQueue: Set<string>;  // Track ongoing refresh operations

  constructor(config?: Partial<CacheConfig>) {
    this.cache = new Map();
    this.config = {
      ttl: 5 * 60 * 1000,  // Default 5 minutes
      maxSize: 100,  // Default max 100 entries
      strategy: 'lru',  // Default LRU strategy
      ...config
    };
    this.refreshQueue = new Set();
    
    // Integrate with memory management
    this.initMemoryIntegration();
  }

  /**
   * Initialize memory management integration
   */
  private initMemoryIntegration(): void {
    // Subscribe to memory changes
    memoryMonitor.subscribe((memoryInfo) => {
      if (memoryInfo.isLowMemory) {
        // Reduce cache size on low memory
        this.reduceCacheSize();
      }
      
      // Update cache config based on memory
      const memoryConfig = memoryManager.getCacheConfig();
      this.config.maxSize = memoryConfig.maxCacheSize;
      this.config.ttl = memoryConfig.ttl;
      
      // Clean up if exceeding new max size
      this.checkMemoryPressure();
    });
    
    // Register cleanup callback
    memoryManager.registerCleanupCallback(() => {
      this.cleanup();
      this.reduceCacheSize();
    });
  }

  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Optional TTL override (ms)
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: now,
      ttl: ttl ?? this.config.ttl,
      accessCount: 0,
      lastAccessed: now
    };

    // Check if we need to evict entries
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evict();
    }

    this.cache.set(key, entry);
  }

  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns Cached value or null if not found/expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    const now = Date.now();
    const age = now - entry.timestamp;
    
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics for LRU
    entry.accessCount++;
    entry.lastAccessed = now;

    return entry.value as T;
  }

  /**
   * Check if a key exists in the cache and is not expired
   * @param key Cache key
   * @returns True if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // Check if entry has expired
    const now = Date.now();
    const age = now - entry.timestamp;
    
    if (age > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear cache entries
   * @param key Optional specific key to clear, or clear all if not provided
   */
  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Evict entries based on the configured strategy
   */
  private evict(): void {
    if (this.cache.size === 0) {
      return;
    }

    switch (this.config.strategy) {
      case 'lru':
        this.evictLRU();
        break;
      case 'lfu':
        this.evictLFU();
        break;
      case 'fifo':
        this.evictFIFO();
        break;
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Evict least frequently used entry
   */
  private evictLFU(): void {
    let leastUsedKey: string | null = null;
    let leastCount = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessCount < leastCount) {
        leastCount = entry.accessCount;
        leastUsedKey = key;
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
    }
  }

  /**
   * Evict first in first out (oldest entry)
   */
  private evictFIFO(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Refresh cache in background using stale-while-revalidate strategy
   * Returns stale data immediately while fetching fresh data in background
   * @param config Refresh configuration
   * @returns Cached value (may be stale) or null
   */
  async refreshInBackground<T>(config: RefreshConfig<T>): Promise<T | null> {
    const { key, fetcher, onSuccess, onError } = config;
    
    // Get current cached value (even if stale)
    const entry = this.cache.get(key);
    const staleValue = entry ? entry.value as T : null;

    // Check if already refreshing this key
    if (this.refreshQueue.has(key)) {
      return staleValue;
    }

    // Check if cache is still valid
    if (entry) {
      const now = Date.now();
      const age = now - entry.timestamp;
      
      // If not expired, return cached value without refresh
      if (age <= entry.ttl) {
        return staleValue;
      }
    }

    // Mark as refreshing
    this.refreshQueue.add(key);

    // Fetch fresh data in background
    fetcher()
      .then((freshData) => {
        // Update cache with fresh data
        this.set(key, freshData);
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess(freshData);
        }
      })
      .catch((error) => {
        console.warn(`Background refresh failed for key "${key}":`, error);
        
        // Call error callback if provided
        if (onError) {
          onError(error);
        }
      })
      .finally(() => {
        // Remove from refresh queue
        this.refreshQueue.delete(key);
      });

    // Return stale value immediately (stale-while-revalidate)
    return staleValue;
  }

  /**
   * Get cache statistics
   * @returns Cache statistics object
   */
  getStats() {
    const entries = Array.from(this.cache.values());
    const now = Date.now();
    
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: this.calculateHitRate(),
      expiredCount: entries.filter(e => (now - e.timestamp) > e.ttl).length,
      oldestEntry: entries.reduce((oldest, entry) => 
        entry.timestamp < oldest ? entry.timestamp : oldest, 
        Infinity
      ),
      refreshingCount: this.refreshQueue.size
    };
  }

  /**
   * Calculate cache hit rate (simplified)
   */
  private calculateHitRate(): number {
    const entries = Array.from(this.cache.values());
    if (entries.length === 0) return 0;
    
    const totalAccesses = entries.reduce((sum, e) => sum + e.accessCount, 0);
    return totalAccesses / entries.length;
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Check memory pressure and reduce cache size if needed
   */
  checkMemoryPressure(): void {
    // Check if cache size exceeds limit
    if (this.cache.size > this.config.maxSize) {
      const excessCount = this.cache.size - this.config.maxSize;
      for (let i = 0; i < excessCount; i++) {
        this.evict();
      }
    }

    // Check device memory if available
    if ('deviceMemory' in navigator) {
      const deviceMemory = (navigator as any).deviceMemory;
      if (deviceMemory && deviceMemory < 4) {
        // Reduce cache size on low memory devices
        this.reduceCacheSize();
      }
    }
  }

  /**
   * Reduce cache size for low memory devices
   */
  private reduceCacheSize(): void {
    const targetSize = Math.floor(this.config.maxSize * 0.5);
    while (this.cache.size > targetSize) {
      this.evict();
    }
  }
}

// Create and export a default cache instance
export const defaultCache = new CacheManager({
  ttl: 5 * 60 * 1000,  // 5 minutes
  maxSize: 100,
  strategy: 'lru'
});
