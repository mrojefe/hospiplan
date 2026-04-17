import { useState, useCallback } from 'react';

export function useFetch(apiFunc) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFunc();
      // Handle both {results: [...]} and direct array responses
      const extractedData = response.data?.results || response.data || [];
      setData(extractedData);
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  }, [apiFunc]);

  return { data, loading, error, execute };
}
