interface CacheItem<T> {
  value: T
  timestamp: number
  ttl: number
}

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  maxSize?: number // Maximum number of items
  strategy?: 'lru' | 'fifo' | 'lfu' // Cache eviction strategy
}

export class CacheManager<T = any> {
  private cache = new Map<string, CacheItem<T>>()
  private accessCount = new Map<string, number>()
  private accessOrder: string[] = []
  private options: Required<CacheOptions>

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl || 5 * 60 * 1000, // 5 minutes default
      maxSize: options.maxSize || 100,
      strategy: options.strategy || 'lru'
    }
  }

  set(key: string, value: T, ttl?: number): void {
    const item: CacheItem<T> = {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.options.ttl
    }

    // Remove existing item if it exists
    if (this.cache.has(key)) {
      this.remove(key)
    }

    // Check if cache is full
    if (this.cache.size >= this.options.maxSize) {
      this.evict()
    }

    this.cache.set(key, item)
    this.accessCount.set(key, 1)
    this.accessOrder.push(key)
  }

  get(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.remove(key)
      return null
    }

    // Update access tracking
    this.updateAccess(key)
    
    return item.value
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  remove(key: string): boolean {
    const existed = this.cache.delete(key)
    if (existed) {
      this.accessCount.delete(key)
      const index = this.accessOrder.indexOf(key)
      if (index > -1) {
        this.accessOrder.splice(index, 1)
      }
    }
    return existed
  }

  clear(): void {
    this.cache.clear()
    this.accessCount.clear()
    this.accessOrder = []
  }

  size(): number {
    return this.cache.size
  }

  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  values(): T[] {
    return Array.from(this.cache.values()).map(item => item.value)
  }

  private updateAccess(key: string): void {
    // Update access count
    const count = this.accessCount.get(key) || 0
    this.accessCount.set(key, count + 1)

    // Update access order for LRU
    if (this.options.strategy === 'lru') {
      const index = this.accessOrder.indexOf(key)
      if (index > -1) {
        this.accessOrder.splice(index, 1)
        this.accessOrder.push(key)
      }
    }
  }

  private evict(): void {
    if (this.cache.size === 0) return

    let keyToRemove: string

    switch (this.options.strategy) {
      case 'lru':
        keyToRemove = this.accessOrder[0] // Least recently used
        break
      case 'fifo':
        keyToRemove = this.accessOrder[0] // First in, first out
        break
      case 'lfu':
        // Find least frequently used
        let minCount = Infinity
        keyToRemove = this.accessOrder[0]
        for (const [key, count] of this.accessCount) {
          if (count < minCount) {
            minCount = count
            keyToRemove = key
          }
        }
        break
      default:
        keyToRemove = this.accessOrder[0]
    }

    this.remove(keyToRemove)
  }

  // Clean up expired items
  cleanup(): number {
    const now = Date.now()
    let removedCount = 0

    for (const [key, item] of this.cache) {
      if (now - item.timestamp > item.ttl) {
        this.remove(key)
        removedCount++
      }
    }

    return removedCount
  }

  // Get cache statistics
  getStats() {
    const now = Date.now()
    let expiredCount = 0
    let totalAge = 0

    for (const [key, item] of this.cache) {
      const age = now - item.timestamp
      totalAge += age
      if (age > item.ttl) {
        expiredCount++
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      expiredCount,
      averageAge: this.cache.size > 0 ? totalAge / this.cache.size : 0,
      hitRate: this.calculateHitRate(),
      strategy: this.options.strategy
    }
  }

  private hitCount = 0
  private missCount = 0

  private calculateHitRate(): number {
    const total = this.hitCount + this.missCount
    return total > 0 ? (this.hitCount / total) * 100 : 0
  }

  // Override get method to track hits/misses
  getWithStats(key: string): { value: T | null; hit: boolean } {
    const value = this.get(key)
    if (value !== null) {
      this.hitCount++
      return { value, hit: true }
    } else {
      this.missCount++
      return { value: null, hit: false }
    }
  }
}

// Global cache instances
export const apiCache = new CacheManager({ ttl: 5 * 60 * 1000, maxSize: 1000 })
export const imageCache = new CacheManager({ ttl: 30 * 60 * 1000, maxSize: 500 })
export const userCache = new CacheManager({ ttl: 15 * 60 * 1000, maxSize: 100 })

// Cache utilities
export class CacheUtils {
  static async withCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    cache: CacheManager<T> = apiCache,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = cache.get(key)
    if (cached !== null) {
      return cached
    }

    // Fetch fresh data
    const data = await fetcher()
    
    // Store in cache
    cache.set(key, data, ttl)
    
    return data
  }

  static generateCacheKey(prefix: string, ...params: any[]): string {
    return `${prefix}:${params.map(p => 
      typeof p === 'object' ? JSON.stringify(p) : String(p)
    ).join(':')}`
  }

  static invalidatePattern(pattern: string, cache: CacheManager = apiCache): number {
    let removedCount = 0
    const regex = new RegExp(pattern)
    
    for (const key of cache.keys()) {
      if (regex.test(key)) {
        cache.remove(key)
        removedCount++
      }
    }
    
    return removedCount
  }

  static preload<T>(key: string, fetcher: () => Promise<T>, cache: CacheManager<T> = apiCache): Promise<T> {
    return this.withCache(key, fetcher, cache)
  }
}

// React hook for caching
export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { cache?: CacheManager<T>; ttl?: number; deps?: any[] } = {}
) {
  const { cache = apiCache, ttl, deps = [] } = options
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const result = await CacheUtils.withCache(key, fetcher, cache, ttl)
        
        if (!cancelled) {
          setData(result)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [key, ...deps])

  return { data, loading, error }
}

// Service Worker cache management
export class ServiceWorkerCache {
  static async clearAll(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames.map(name => caches.delete(name))
      )
    }
  }

  static async clearPattern(pattern: string): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      const matchingCaches = cacheNames.filter(name => name.includes(pattern))
      
      await Promise.all(
        matchingCaches.map(name => caches.delete(name))
      )
    }
  }

  static async getCacheSize(): Promise<number> {
    if (!('caches' in window)) return 0

    let totalSize = 0
    const cacheNames = await caches.keys()

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName)
      const keys = await cache.keys()
      
      for (const request of keys) {
        const response = await cache.match(request)
        if (response) {
          const blob = await response.blob()
          totalSize += blob.size
        }
      }
    }

    return totalSize
  }
}

export default CacheManager

