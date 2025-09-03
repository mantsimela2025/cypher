/**
 * Simple Authentication Test
 */

const axios = require('axios');

async function testAuth() {
  console.log('🔐 Testing authentication directly...');
  
  try {
    const response = await axios.post('http://localhost:3001/api/v1/auth/login', {
      email: 'admin@rasdash.com',
      password: 'Admin123!'
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Authentication successful!');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.data && response.data.data.accessToken) {
      const token = response.data.data.accessToken;
      console.log('\n🧪 Testing AI health endpoint...');
      
      const aiHealthResponse = await axios.get('http://localhost:3001/api/v1/rmf/ai/health', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('✅ AI Health check successful!');
      console.log('AI Status:', aiHealthResponse.data);
      
      return { success: true, token };
    }
    
  } catch (error) {
    console.log('❌ Test failed');
    console.log('Error message:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
    if (error.code) {
      console.log('Error code:', error.code);
    }
    return { success: false, error: error.message };
  }
}

testAuth().catch(console.error);
