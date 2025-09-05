import { apiClient } from './apiClient';
import { log } from './config';

// Test script to verify assets API is working
const testAssetsApi = async () => {
  log.info('🧪 Testing Assets API...');

  try {
    // Test the assets endpoint using apiClient
    log.info('🌐 Testing assets endpoint with apiClient...');

    const data = await apiClient.get('/assets?limit=5');

    log.info('✅ API Response received');
    log.info('📊 Assets count:', data.data?.length || 0);
    log.info('📊 Pagination:', data.pagination);

  } catch (error) {
    log.error('💥 Test failed:', error.message);
    log.error('Error details:', error);
  }
};

// Export for use in browser console
window.testAssetsApi = testAssetsApi;

export default testAssetsApi;
