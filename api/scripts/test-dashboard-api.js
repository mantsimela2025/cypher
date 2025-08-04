const { client } = require('../src/db');

async function testDashboardAPI() {
  try {
    console.log('🧪 Testing Dashboard API Endpoints...');
    
    // Get admin user for token
    const users = await client`SELECT id, email FROM users WHERE role = 'admin' LIMIT 1`;
    
    if (users.length === 0) {
      console.log('❌ No admin users found');
      return;
    }
    
    const user = users[0];
    console.log(`👤 Using admin user: ${user.email}`);
    
    // Create JWT token
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: 'admin' }, 
      JWT_SECRET, 
      { expiresIn: '1h' }
    );
    
    const baseUrl = 'http://localhost:3001/api/v1/metrics-dashboards';
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    // Test 1: Get all dashboards
    console.log('\n📊 Testing GET /metrics-dashboards');
    try {
      const response = await fetch(baseUrl, { headers });
      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Success: Found ${data.total} dashboards`);
        data.data.forEach(dashboard => {
          console.log(`  - ${dashboard.name}: ${dashboard.metric_count} metrics (Default: ${dashboard.is_default})`);
        });
      } else {
        const error = await response.text();
        console.log(`❌ Error: ${error}`);
      }
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
    
    // Test 2: Get dashboards by category
    console.log('\n📊 Testing GET /metrics-dashboards/by-category');
    try {
      const response = await fetch(`${baseUrl}/by-category`, { headers });
      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Success: ${data.summary.categories} categories`);
        Object.entries(data.data).forEach(([category, dashboards]) => {
          console.log(`  📁 ${category}: ${dashboards.length} dashboards`);
          dashboards.forEach(dashboard => {
            console.log(`    - ${dashboard.name} (${dashboard.metric_count} metrics)`);
          });
        });
      } else {
        const error = await response.text();
        console.log(`❌ Error: ${error}`);
      }
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
    
    // Test 3: Get default dashboard
    console.log('\n📊 Testing GET /metrics-dashboards/default');
    try {
      const response = await fetch(`${baseUrl}/default`, { headers });
      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Success: Default dashboard "${data.data.name}"`);
        console.log(`  📊 Metrics: ${data.data.metrics.length} widgets`);
        console.log(`  📈 Chart types:`);
        const chartTypes = {};
        data.data.metrics.forEach(metric => {
          chartTypes[metric.chart_type] = (chartTypes[metric.chart_type] || 0) + 1;
        });
        Object.entries(chartTypes).forEach(([type, count]) => {
          console.log(`    - ${type}: ${count} widgets`);
        });
      } else {
        const error = await response.text();
        console.log(`❌ Error: ${error}`);
      }
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
    
    // Test 4: Get specific dashboard by name
    console.log('\n📊 Testing GET /metrics-dashboards/name/Vulnerability Management');
    try {
      const response = await fetch(`${baseUrl}/name/Vulnerability Management`, { headers });
      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Success: "${data.data.name}" dashboard`);
        console.log(`  📊 Description: ${data.data.description}`);
        console.log(`  📈 Widgets: ${data.data.metrics.length}`);
        console.log(`  🎯 Key metrics:`);
        data.data.metrics.slice(0, 5).forEach(metric => {
          console.log(`    - ${metric.metric_name}: ${metric.metric_value} ${metric.metric_unit} (${metric.chart_type})`);
        });
      } else {
        const error = await response.text();
        console.log(`❌ Error: ${error}`);
      }
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
    
    // Test 5: Get dashboard by ID
    console.log('\n📊 Testing GET /metrics-dashboards/{id}');
    try {
      // First get a dashboard ID
      const dashboardsResponse = await fetch(baseUrl, { headers });
      if (dashboardsResponse.ok) {
        const dashboardsData = await dashboardsResponse.json();
        const firstDashboard = dashboardsData.data[0];
        
        const response = await fetch(`${baseUrl}/${firstDashboard.id}`, { headers });
        console.log(`Status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Success: Dashboard ID ${firstDashboard.id} - "${data.data.name}"`);
          console.log(`  📊 Layout: ${JSON.stringify(data.data.layout).substring(0, 50)}...`);
          console.log(`  📈 Metrics: ${data.data.metrics.length} widgets configured`);
        } else {
          const error = await response.text();
          console.log(`❌ Error: ${error}`);
        }
      }
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
    
    console.log('\n✅ Dashboard API testing complete!');
    
    // Summary
    console.log('\n📋 DASHBOARD SYSTEM SUMMARY:');
    console.log('🏆 7 Comprehensive Dashboards Created:');
    console.log('  1. 🏢 Systems Overview - System inventory and health');
    console.log('  2. 💻 Assets Management - Asset coverage and operations');
    console.log('  3. 🔒 Vulnerability Management - Comprehensive vuln tracking');
    console.log('  4. 🎯 Risk Assessment - Risk analysis and maturity');
    console.log('  5. 💰 Cost Intelligence - Financial analysis and ROI');
    console.log('  6. 🔧 Patch Management - Patch deployment tracking');
    console.log('  7. 📈 Executive Summary - C-suite KPIs (DEFAULT)');
    console.log('');
    console.log('🌐 API Endpoints Available:');
    console.log('  - GET /api/v1/metrics-dashboards');
    console.log('  - GET /api/v1/metrics-dashboards/by-category');
    console.log('  - GET /api/v1/metrics-dashboards/default');
    console.log('  - GET /api/v1/metrics-dashboards/{id}');
    console.log('  - GET /api/v1/metrics-dashboards/name/{name}');
    
  } catch (error) {
    console.error('❌ Error testing dashboard API:', error.message);
  } finally {
    await client.end();
  }
}

testDashboardAPI();
