/**
 * Debug Authentication Issues
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';

async function debugAuth() {
  console.log('🔍 Debugging authentication...');
  
  // Test 1: Check if API is responding
  try {
    console.log('\n1. Testing API health...');
    const healthResponse = await axios.get('http://localhost:3001/health');
    console.log('✅ API is responding:', healthResponse.status);
    console.log('   Health data:', healthResponse.data);
  } catch (error) {
    console.log('❌ API health check failed:', error.message);
    return;
  }
  
  // Test 2: Try authentication with different credentials
  const testCredentials = [
    { email: 'admin@rasdash.com', password: 'Admin123!' },
    { email: 'user@rasdash.com', password: 'User123!' },
    { email: 'admin@cypher.com', password: 'admin123' }
  ];
  
  for (const creds of testCredentials) {
    try {
      console.log(`\n2. Testing login with ${creds.email}...`);
      
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: creds.email,
        password: creds.password
      });
      
      console.log('✅ Login successful!');
      console.log('   Response:', response.data);
      
      // Test the token
      if (response.data.data && response.data.data.accessToken) {
        console.log('\n3. Testing token...');
        const token = response.data.data.accessToken;
        
        const profileResponse = await axios.get(`${API_BASE_URL}/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('✅ Token is valid!');
        console.log('   User:', profileResponse.data.data);
        return { token, user: profileResponse.data.data };
      }
      
    } catch (error) {
      console.log(`❌ Login failed for ${creds.email}:`, error.response?.data?.message || error.message);
    }
  }
  
  console.log('\n❌ All authentication attempts failed');
}

debugAuth().catch(console.error);
