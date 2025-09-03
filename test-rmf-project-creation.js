/**
 * Test RMF Project Creation API
 */

const axios = require('axios');

async function testRMFProjectCreation() {
  console.log('🧪 Testing RMF Project Creation API...');
  
  try {
    // Step 1: Authenticate
    console.log('🔐 Authenticating...');
    const authResponse = await axios.post('http://localhost:3001/api/v1/auth/login', {
      email: 'admin@rasdash.com',
      password: 'Admin123!'
    });
    
    if (!authResponse.data.success) {
      throw new Error('Authentication failed');
    }
    
    const token = authResponse.data.data.accessToken;
    console.log('✅ Authentication successful');
    
    // Step 2: Test RMF Project Creation
    console.log('\n📝 Creating RMF Project...');
    const projectData = {
      title: 'Test RMF Project - ' + new Date().toISOString(),
      description: 'Test project created via API to verify project creation functionality',
      environment: 'cloud',
      sponsor_org: 'Test Organization',
      current_step: 'categorize',
      status: 'active'
    };
    
    const createResponse = await axios.post('http://localhost:3001/api/v1/rmf/projects', projectData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Project creation response:');
    console.log('Status:', createResponse.status);
    console.log('Success:', createResponse.data.success);
    console.log('Project ID:', createResponse.data.data?.id);
    console.log('Project Title:', createResponse.data.data?.title);
    console.log('Message:', createResponse.data.message);
    
    // Step 3: Verify project was saved by listing projects
    console.log('\n📋 Verifying project was saved...');
    const listResponse = await axios.get('http://localhost:3001/api/v1/rmf/projects', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Projects list response:');
    console.log('Success:', listResponse.data.success);
    console.log('Total projects:', listResponse.data.data?.length || 0);
    
    if (listResponse.data.data && listResponse.data.data.length > 0) {
      console.log('Recent projects:');
      listResponse.data.data.slice(0, 3).forEach((project, index) => {
        console.log(`  ${index + 1}. ${project.title} (ID: ${project.id}) - ${project.status}`);
      });
    }
    
    // Step 4: Test project retrieval by ID
    if (createResponse.data.data?.id) {
      console.log('\n🔍 Testing project retrieval by ID...');
      const projectId = createResponse.data.data.id;
      
      try {
        const getResponse = await axios.get(`http://localhost:3001/api/v1/rmf/projects/${projectId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('✅ Project retrieval successful:');
        console.log('Project:', getResponse.data.data?.title);
        console.log('Current Step:', getResponse.data.data?.current_step);
        
      } catch (getError) {
        console.log('❌ Project retrieval failed:', getError.response?.data?.message || getError.message);
      }
    }
    
    console.log('\n🎉 RMF Project Creation API test completed successfully!');
    
  } catch (error) {
    console.log('❌ Test failed');
    console.log('Error message:', error.message);
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    
    if (error.code) {
      console.log('Error code:', error.code);
    }
  }
}

testRMFProjectCreation();
