import { useState, useCallback, useRef } from 'react';

/**
 * Simple and efficient lazy loading hook
 * Data is only loaded when explicitly requested
 * Includes caching to prevent unnecessary re-fetches
 */
export const useLazyData = (fetchFunction, options = {}) => {
  const {
    cacheTime = 5 * 60 * 1000, // 5 minutes default cache
    enableCache = true,
    onSuccess,
    onError
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [lastFetch, setLastFetch] = useState(null);
  
  const abortControllerRef = useRef(null);

  // Check if cached data is still valid
  const isCacheValid = useCallback(() => {
    if (!enableCache || !lastFetch) return false;
    return Date.now() - lastFetch < cacheTime;
  }, [enableCache, cacheTime, lastFetch]);

  // Load data function
  const loadData = useCallback(async (forceRefresh = false) => {
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && isCacheValid() && data) {
      return data;
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const result = await fetchFunction({
        signal: abortControllerRef.current.signal
      });

      setData(result);
      setHasLoaded(true);
      setLastFetch(Date.now());
      
      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (err) {
      // Don't set error if request was aborted
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to load data');
        if (onError) {
          onError(err);
        }
      }
      throw err;
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [fetchFunction, isCacheValid, data, onSuccess, onError]);

  // Refresh data (force reload)
  const refresh = useCallback(() => {
    return loadData(true);
  }, [loadData]);

  // Clear data and cache
  const clear = useCallback(() => {
    setData(null);
    setError(null);
    setHasLoaded(false);
    setLastFetch(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    data,
    loading,
    error,
    hasLoaded,
    loadData,
    refresh,
    clear,
    isCached: isCacheValid()
  };
};

/**
 * Hook for managing multiple lazy-loaded data sources
 */
export const useLazyDataMap = (fetchFunctions, options = {}) => {
  const [dataMap, setDataMap] = useState({});
  const [loadingMap, setLoadingMap] = useState({});
  const [errorMap, setErrorMap] = useState({});
  const [loadedMap, setLoadedMap] = useState({});

  const loadData = useCallback(async (key, params = {}) => {
    if (!fetchFunctions[key]) {
      throw new Error(`No fetch function defined for key: ${key}`);
    }

    setLoadingMap(prev => ({ ...prev, [key]: true }));
    setErrorMap(prev => ({ ...prev, [key]: null }));

    try {
      const result = await fetchFunctions[key](params);
      setDataMap(prev => ({ ...prev, [key]: result }));
      setLoadedMap(prev => ({ ...prev, [key]: true }));
      return result;
    } catch (error) {
      setErrorMap(prev => ({ ...prev, [key]: error.message }));
      throw error;
    } finally {
      setLoadingMap(prev => ({ ...prev, [key]: false }));
    }
  }, [fetchFunctions]);

  const clearData = useCallback((key) => {
    setDataMap(prev => {
      const newMap = { ...prev };
      delete newMap[key];
      return newMap;
    });
    setLoadedMap(prev => ({ ...prev, [key]: false }));
    setErrorMap(prev => ({ ...prev, [key]: null }));
  }, []);

  return {
    dataMap,
    loadingMap,
    errorMap,
    loadedMap,
    loadData,
    clearData
  };
};

export default useLazyData;
