const { client } = require('../src/db');

async function testSystemMetricsAPI() {
  try {
    console.log('🧪 Testing System Metrics API...');
    
    // First, let's get a valid user and create a token for testing
    const users = await client`SELECT id, email FROM users WHERE role = 'admin' LIMIT 1`;
    
    if (users.length === 0) {
      console.log('❌ No admin users found. Please create an admin user first.');
      return;
    }
    
    const user = users[0];
    console.log(`👤 Using admin user: ${user.email}`);
    
    // Create a simple JWT token for testing
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: 'admin'
      }, 
      JWT_SECRET, 
      { expiresIn: '1h' }
    );
    
    console.log('🔑 Generated test token');
    
    // Test endpoints
    const baseUrl = 'http://localhost:3001/api/v1/system-metrics';
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    // Test 1: Get all metrics
    console.log('\n📊 Testing GET /system-metrics');
    try {
      const response = await fetch(baseUrl, { headers });
      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Success: Found ${data.total} metrics`);
        console.log(`Sample metric: ${data.data[0]?.name} = ${data.data[0]?.value} ${data.data[0]?.unit}`);
      } else {
        const error = await response.text();
        console.log(`❌ Error: ${error}`);
      }
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
    
    // Test 2: Get metrics by category
    console.log('\n📊 Testing GET /system-metrics/by-category');
    try {
      const response = await fetch(`${baseUrl}/by-category`, { headers });
      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Success: Grouped metrics`);
        console.log(`Systems: ${data.summary.systems} metrics`);
        console.log(`Assets: ${data.summary.assets} metrics`);
        console.log(`Vulnerabilities: ${data.summary.vulnerabilities} metrics`);
        console.log(`Patches: ${data.summary.patches} metrics`);
        console.log(`Risk Scores: ${data.summary.risk_scores} metrics`);
        console.log(`Maturity: ${data.summary.maturity} metrics`);
      } else {
        const error = await response.text();
        console.log(`❌ Error: ${error}`);
      }
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
    
    // Test 3: Get dashboard summary
    console.log('\n📊 Testing GET /system-metrics/dashboard-summary');
    try {
      const response = await fetch(`${baseUrl}/dashboard-summary`, { headers });
      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Success: Dashboard summary`);
        console.log(`Key metrics:`);
        Object.entries(data.data.metrics).forEach(([key, metric]) => {
          console.log(`  ${key}: ${metric.value} ${metric.unit}`);
        });
        console.log(`Insights:`);
        Object.entries(data.data.insights).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      } else {
        const error = await response.text();
        console.log(`❌ Error: ${error}`);
      }
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
    
    // Test 4: Get specific metric
    console.log('\n📊 Testing GET /system-metrics/total_vulnerabilities_new');
    try {
      const response = await fetch(`${baseUrl}/total_vulnerabilities_new`, { headers });
      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Success: ${data.data.name} = ${data.data.value} ${data.data.unit}`);
        console.log(`Description: ${data.data.description}`);
      } else {
        const error = await response.text();
        console.log(`❌ Error: ${error}`);
      }
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
    
    // Test 5: Update metrics
    console.log('\n📊 Testing POST /system-metrics/update');
    try {
      const response = await fetch(`${baseUrl}/update`, { 
        method: 'POST',
        headers 
      });
      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Success: ${data.message}`);
        console.log(`Updated at: ${data.updated_at}`);
      } else {
        const error = await response.text();
        console.log(`❌ Error: ${error}`);
      }
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
    
    console.log('\n✅ System Metrics API testing complete!');
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  } finally {
    await client.end();
  }
}

testSystemMetricsAPI();
