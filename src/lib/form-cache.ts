// Form Cache Utilities for localStorage

const CACHE_KEY = 'reseller-application-draft';
const CACHE_VERSION = '1.0';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
}

export function saveFormData<T>(data: T): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch (error) {
    console.warn('Failed to save form data to cache:', error);
    // Silently fail - caching is optional
  }
}

export function loadFormData<T>(): T | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const entry: CacheEntry<T> = JSON.parse(cached);
    
    // Check version compatibility
    if (entry.version !== CACHE_VERSION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.warn('Failed to load form data from cache:', error);
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
}

export function clearFormData(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.warn('Failed to clear form data from cache:', error);
  }
}

export function hasCachedData(): boolean {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return false;

    const entry = JSON.parse(cached);
    
    // Check version and TTL
    return entry.version === CACHE_VERSION && 
           (Date.now() - entry.timestamp) < CACHE_TTL;
  } catch {
    return false;
  }
}

