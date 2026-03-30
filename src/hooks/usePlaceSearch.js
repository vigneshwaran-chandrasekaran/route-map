import { useState, useRef, useCallback, useEffect } from 'react';
import api from '../api/axios';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

/**
 * Shared hook for place search via Nominatim.
 * Debounces requests to respect the 1 req/sec rate limit.
 */
export function usePlaceSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  // Clean up debounce timer and abort controller on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const search = useCallback((value) => {
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 3) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      // Cancel any in-flight request
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      setLoading(true);
      try {
        const res = await api.get(NOMINATIM_URL, {
          baseURL: '', // override the default baseURL
          params: {
            q: value,
            format: 'json',
            addressdetails: 1,
            limit: 5,
          },
          headers: {
            // Nominatim requires a valid User-Agent
            'User-Agent': 'RouteMapApp/1.0',
          },
          signal: abortRef.current.signal,
        });
        setResults(
          res.data.map((item) => ({
            id: item.place_id,
            name: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          }))
        );
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 600);
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setQuery('');
  }, []);

  return { query, results, loading, search, clearResults };
}
