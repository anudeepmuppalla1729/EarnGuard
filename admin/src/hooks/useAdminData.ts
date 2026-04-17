import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient, type ApiResponse } from '../api/client';

/**
 * Polls an admin API endpoint at the given interval.
 * - Pauses polling when the browser tab is hidden (Page Visibility API).
 * - Fetches fresh data immediately when the tab becomes visible again.
 * - Cleans up the interval when the component unmounts (i.e. when the
 *   user navigates away from the page that uses this hook).
 */
export function usePolledData<T>(endpoint: string, intervalMs: number) {
  const [data, setData] = useState<T | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await apiClient.get<ApiResponse<T>>(endpoint);
      setData(res.data.data);
      setTimestamp(res.data.timestamp);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  // Start / stop the polling interval
  const startPolling = useCallback(() => {
    if (intervalRef.current) return; // already running
    intervalRef.current = setInterval(fetchData, intervalMs);
  }, [fetchData, intervalMs]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Fetch immediately on mount
    fetchData();
    startPolling();

    // Pause when the browser tab is hidden, resume when visible
    const handleVisibility = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        fetchData(); // refresh immediately on tab focus
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchData, startPolling, stopPolling]);

  return { data, timestamp, error, loading };
}

// Preset timers — slowed down to reduce server load
export const FAST_POLL = 15_000;  // was 5s  → now 15s  (health, risk, queues)
export const MED_POLL  = 30_000;  // was 15s → now 30s  (claims, fraud, payouts)
export const SLOW_POLL = 60_000;  // unchanged at 60s
