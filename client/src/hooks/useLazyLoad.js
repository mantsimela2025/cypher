import React, { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook for lazy loading data
 * Only loads data when explicitly triggered (e.g., when component becomes visible)
 */
export const useLazyLoad = (fetchFunction, options = {}) => {
  const [data, setData] = useState(options.initialData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const abortControllerRef = useRef(null);

  const loadData = useCallback(async (forceReload = false) => {
    // Don't reload if already loaded and not forcing reload
    if (hasLoaded && !forceReload) {
      return data;
    }

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const result = await fetchFunction(abortControllerRef.current.signal);
      
      // Check if request was aborted
      if (abortControllerRef.current.signal.aborted) {
        return;
      }

      setData(result);
      setHasLoaded(true);
      return result;
    } catch (err) {
      // Don't set error if request was aborted
      if (!abortControllerRef.current.signal.aborted) {
        setError(err);
        console.error('Lazy load error:', err);
      }
    } finally {
      if (!abortControllerRef.current.signal.aborted) {
        setLoading(false);
      }
    }
  }, [fetchFunction, hasLoaded, data]);

  const reset = useCallback(() => {
    setData(options.initialData || null);
    setLoading(false);
    setError(null);
    setHasLoaded(false);
    
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, [options.initialData]);

  return {
    data,
    loading,
    error,
    hasLoaded,
    loadData,
    reset,
    reload: () => loadData(true)
  };
};

/**
 * Hook for lazy loading with intersection observer
 * Automatically loads data when element becomes visible
 */
export const useLazyLoadOnVisible = (fetchFunction, options = {}) => {
  const { threshold = 0.1, rootMargin = '50px' } = options;
  const [elementRef, setElementRef] = useState(null);
  const lazyLoad = useLazyLoad(fetchFunction, options);

  // Set up intersection observer
  useEffect(() => {
    if (!elementRef || lazyLoad.hasLoaded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !lazyLoad.hasLoaded) {
            lazyLoad.loadData();
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(elementRef);

    return () => {
      observer.disconnect();
    };
  }, [elementRef, lazyLoad, threshold, rootMargin]);

  return {
    ...lazyLoad,
    ref: setElementRef
  };
};

/**
 * Hook for lazy loading with manual trigger
 * Loads data only when user interacts (click, navigation, etc.)
 */
export const useLazyLoadOnDemand = (fetchFunction, options = {}) => {
  return useLazyLoad(fetchFunction, options);
};

export default useLazyLoad;
