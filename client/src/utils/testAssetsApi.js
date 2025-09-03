// Test script to verify assets API is working
const testAssetsApi = async () => {
  console.log('🧪 Testing Assets API...');
  
  try {
    // Get token from localStorage
    const token = localStorage.getItem('accessToken');
    console.log('🔑 Token found:', token ? 'Yes' : 'No');
    
    if (!token) {
      console.error('❌ No access token found in localStorage');
      return;
    }
    
    // Test the assets endpoint
    const response = await fetch('http://localhost:3001/api/v1/assets?limit=5', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:', data);
      console.log('📊 Assets count:', data.data?.length || 0);
      console.log('📊 Pagination:', data.pagination);
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ API Error:', errorData);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
};

// Export for use in browser console
window.testAssetsApi = testAssetsApi;

export default testAssetsApi;
