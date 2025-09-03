import React from "react";
import { useNavigationLazyLoad } from "@/hooks/useNavigationLazyLoad";
import { systemsApi } from "@/utils/systemsApi";
import SystemsMainPage from "./SystemsMain";

/**
 * Systems Page with Navigation-Aware Lazy Loading
 * 
 * This wrapper automatically loads systems data when the user navigates to /systems
 * Data is cached for 5 minutes to improve performance
 */
const SystemsPage = () => {
  // Auto-load systems data when navigating to /systems
  const systemsAutoLoad = useNavigationLazyLoad(
    async () => {
      console.log('🚀 Auto-loading systems data on navigation...');
      const response = await systemsApi.getSystems();
      return response.data || response || [];
    },
    {
      triggerPaths: ['/systems'], // Load when navigating to /systems
      cacheTime: 5 * 60 * 1000, // 5 minutes cache
      loadOnMount: true, // Load immediately if already on the page
      onSuccess: (data) => {
        console.log('✅ Systems auto-loaded successfully:', data.length, 'systems');
      },
      onError: (error) => {
        console.error('❌ Failed to auto-load systems:', error);
      }
    }
  );

  // Auto-load stats data when navigating to /systems
  const statsAutoLoad = useNavigationLazyLoad(
    async () => {
      console.log('📊 Auto-loading stats data on navigation...');
      const response = await systemsApi.getSystemsStats();
      return response.data || response || {};
    },
    {
      triggerPaths: ['/systems'],
      cacheTime: 10 * 60 * 1000, // 10 minutes cache for stats
      loadOnMount: true,
      onSuccess: (data) => {
        console.log('✅ Stats auto-loaded successfully:', data);
      }
    }
  );

  // Pass the auto-loaded data to the main page
  return (
    <SystemsMainPage 
      preloadedSystems={systemsAutoLoad.data}
      preloadedStats={statsAutoLoad.data}
      systemsLoading={systemsAutoLoad.loading}
      statsLoading={statsAutoLoad.loading}
      systemsError={systemsAutoLoad.error}
      statsError={statsAutoLoad.error}
      onRefreshSystems={systemsAutoLoad.refresh}
      onRefreshStats={statsAutoLoad.refresh}
    />
  );
};

export default SystemsPage;
