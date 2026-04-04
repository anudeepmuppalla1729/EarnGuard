// =============================================================
// SWR Cache — Stale-While-Revalidate Pattern
// Serve cached data instantly → refresh in background → update store
// =============================================================
import { CacheStorage } from './storage';

interface SWROptions<T> {
  cacheKey: string;
  ttlMs: number;                          // e.g. 60_000 = 60s
  fetcher: () => Promise<T>;             // the mock/real API call
  onData: (data: T) => void;             // update store
}

/**
 * Stale-while-revalidate data loader.
 * 
 * 1. Check cache → if exists, call onData immediately (instant UI)
 * 2. If stale (or no cache), call fetcher in background
 * 3. On fetch success → call onData + update cache
 */
export async function swrFetch<T>({
  cacheKey,
  ttlMs,
  fetcher,
  onData,
}: SWROptions<T>): Promise<void> {
  // Step 1: Serve from cache (instant)
  const cached = await CacheStorage.getWithMeta<T>(cacheKey);
  let needsRefresh = true;

  if (cached) {
    onData(cached.data);
    needsRefresh = CacheStorage.isStale(cached.timestamp, ttlMs);
  }

  // Step 2: Background refresh if stale or no cache
  if (needsRefresh) {
    try {
      const fresh = await fetcher();
      onData(fresh);
      await CacheStorage.set(cacheKey, fresh);
    } catch (e) {
      // If fetch fails but we have cache, silently continue with stale data
      if (!cached) {
        console.warn('[SWR] Fetch failed with no cache for:', cacheKey, e);
      }
    }
  }
}
