import { useState, useEffect } from 'react';
import { apiClient, type ApiResponse } from '../api/client';

export function usePolledData<T>(endpoint: string, intervalMs: number) {
  const [data, setData] = useState<T | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        const res = await apiClient.get<ApiResponse<T>>(endpoint);
        if (isMounted) {
          setData(res.data.data);
          setTimestamp(res.data.timestamp);
          setError(null);
        }
      } catch (err) {
        if (isMounted) setError(err as Error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData(); // Fetch immediately on mount
    const interval = setInterval(fetchData, intervalMs);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [endpoint, intervalMs]);

  return { data, timestamp, error, loading };
}

// Preset timers
export const FAST_POLL = 5000;
export const MED_POLL = 15000;
export const SLOW_POLL = 60000;
