/**
 * Smart Cache Manager for Spotify Data
 * Reduces API calls and improves performance
 */

import { AnalyticsResponse } from '../types/spotify'

interface CacheEntry<T> {
  data: T
  timestamp: number
  key: string
  expiresAt: number
}

interface CacheConfig {
  defaultTTL: number // Time to live in milliseconds
  maxSize: number // Maximum number of entries
  cleanupInterval: number // Cleanup interval in milliseconds
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>()
  private config: CacheConfig = {
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
    cleanupInterval: 10 * 60 * 1000 // 10 minutes
  }
  private cleanupTimer: number | null = null

  constructor(config?: Partial<CacheConfig>) {
    if (config) {
      this.config = { ...this.config, ...config }
    }
    this.startCleanupTimer()
  }

  private startCleanupTimer() {
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)
  }

  private cleanup() {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))

    // If cache is still too large, remove oldest entries
    if (this.cache.size > this.config.maxSize) {
      const sortedEntries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
      
      const entriesToRemove = sortedEntries.slice(0, this.cache.size - this.config.maxSize)
      entriesToRemove.forEach(([key]) => this.cache.delete(key))
    }
  }

  private generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|')
    return `${prefix}:${sortedParams}`
  }

  public get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  public set<T>(key: string, data: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.config.defaultTTL)
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      key,
      expiresAt
    }

    this.cache.set(key, entry)

    // Trigger cleanup if cache is getting too large
    if (this.cache.size > this.config.maxSize * 1.2) {
      this.cleanup()
    }
  }

  public invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear()
      return
    }

    const keysToDelete: string[] = []
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
  }

  public getStats() {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        timestamp: entry.timestamp,
        expiresAt: entry.expiresAt,
        isExpired: Date.now() > entry.expiresAt
      }))
    }
  }

  // Spotify-specific cache methods
  public cacheAnalytics<T>(
    window: string, 
    analysisType: string, 
    data: AnalyticsResponse<T>,
    ttl?: number
  ): void {
    const key = this.generateKey('analytics', { window, analysisType })
    this.set(key, data, ttl)
  }

  public getCachedAnalytics<T>(
    window: string, 
    analysisType: string
  ): AnalyticsResponse<T> | null {
    const key = this.generateKey('analytics', { window, analysisType })
    return this.get<AnalyticsResponse<T>>(key)
  }

  public cacheTimeSegments<T>(data: AnalyticsResponse<T>, ttl?: number, window: string = '30d'): void {
    const key = this.generateKey('timeSegments', { window })
    this.set(key, data, ttl)
  }

  public getCachedTimeSegments<T>(window: string = '30d'): AnalyticsResponse<T> | null {
    const key = this.generateKey('timeSegments', { window })
    return this.get<AnalyticsResponse<T>>(key)
  }

  public cacheTopAlbums(window: string, data: any[], ttl?: number): void {
    const key = this.generateKey('topAlbums', { window })
    this.set(key, data, ttl)
  }

  public getCachedTopAlbums(window: string): any[] | null {
    const key = this.generateKey('topAlbums', { window })
    return this.get<any[]>(key)
  }

  public cacheUserProfile(data: any, ttl?: number): void {
    this.set('userProfile', data, ttl || 15 * 60 * 1000) // 15 minutes for user profile
  }

  public getCachedUserProfile(): any | null {
    return this.get('userProfile')
  }

  // Batch operations
  public prefetchAnalytics(windows: string[], analysisTypes: string[]): string[] {
    const prefetchKeys: string[] = []
    
    for (const window of windows) {
      for (const analysisType of analysisTypes) {
        const key = this.generateKey('analytics', { window, analysisType })
        if (!this.cache.has(key)) {
          prefetchKeys.push(key)
        }
      }
    }
    
    return prefetchKeys
  }

  public invalidateUserData(): void {
    this.invalidate('analytics')
    this.invalidate('timeSegments')
    this.invalidate('topAlbums')
    this.invalidate('userProfile')
  }

  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
    this.cache.clear()
  }
}

// Export singleton instance
export const cacheManager = new CacheManager({
  defaultTTL: 5 * 60 * 1000, // 5 minutes for most data
  maxSize: 50, // Limit cache size for memory efficiency
  cleanupInterval: 5 * 60 * 1000 // Clean up every 5 minutes
})

export default cacheManager