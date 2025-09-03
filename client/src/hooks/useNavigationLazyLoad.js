import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useLazyData } from './useLazyData';

/**
 * Hook that automatically loads data when navigating to a specific route
 * Perfect for pages that should load data when the user clicks a nav link
 */
export const useNavigationLazyLoad = (fetchFunction, options = {}) => {
  const {
    triggerPaths = [], // Array of paths that should trigger loading
    loadOnMount = false, // Whether to load immediately on mount
    autoRefreshInterval = null, // Auto refresh interval in ms
    ...lazyOptions
  } = options;

  const location = useLocation();
  const hasTriggeredRef = useRef(false);
  const intervalRef = useRef(null);

  const lazyData = useLazyData(fetchFunction, lazyOptions);

  // Check if current path should trigger loading
  const shouldTriggerLoad = () => {
    if (triggerPaths.length === 0) return true; // Load for any path if none specified
    return triggerPaths.some(path => 
      location.pathname === path || location.pathname.startsWith(path)
    );
  };

  // Load data when navigating to trigger paths
  useEffect(() => {
    if (shouldTriggerLoad() && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      lazyData.loadData();
    }
  }, [location.pathname]);

  // Load on mount if specified
  useEffect(() => {
    if (loadOnMount && shouldTriggerLoad()) {
      lazyData.loadData();
    }
  }, [loadOnMount]);

  // Auto refresh interval
  useEffect(() => {
    if (autoRefreshInterval && lazyData.hasLoaded) {
      intervalRef.current = setInterval(() => {
        if (shouldTriggerLoad()) {
          lazyData.refresh();
        }
      }, autoRefreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [autoRefreshInterval, lazyData.hasLoaded]);

  // Reset trigger when leaving the page
  useEffect(() => {
    if (!shouldTriggerLoad()) {
      hasTriggeredRef.current = false;
    }
  }, [location.pathname]);

  return {
    ...lazyData,
    isOnTriggerPath: shouldTriggerLoad()
  };
};

/**
 * Hook for managing multiple data sources that load based on navigation
 */
export const useNavigationDataManager = (dataConfig) => {
  const location = useLocation();
  const loadedPagesRef = useRef(new Set());

  const dataHooks = {};
  
  // Create lazy data hooks for each configured data source
  Object.keys(dataConfig).forEach(key => {
    const config = dataConfig[key];
    dataHooks[key] = useNavigationLazyLoad(config.fetchFunction, {
      triggerPaths: config.paths || [],
      cacheTime: config.cacheTime,
      loadOnMount: config.loadOnMount,
      autoRefreshInterval: config.autoRefreshInterval
    });
  });

  // Track which pages have been loaded
  useEffect(() => {
    Object.keys(dataConfig).forEach(key => {
      const config = dataConfig[key];
      const shouldLoad = !config.paths || config.paths.some(path => 
        location.pathname === path || location.pathname.startsWith(path)
      );
      
      if (shouldLoad && !loadedPagesRef.current.has(key)) {
        loadedPagesRef.current.add(key);
      }
    });
  }, [location.pathname, dataConfig]);

  return {
    ...dataHooks,
    loadedPages: Array.from(loadedPagesRef.current),
    currentPath: location.pathname
  };
};

export default useNavigationLazyLoad;
