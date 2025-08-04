const { client } = require('../src/db');

async function viewMetricsSummary() {
  try {
    console.log('📊 COMPREHENSIVE METRICS SUMMARY');
    console.log('=' .repeat(80));
    
    // Get all custom metrics
    const metrics = await client`
      SELECT name, description, type, value, unit, labels, last_calculated
      FROM metrics 
      WHERE source IN ('database', 'calculated')
      ORDER BY 
        CASE 
          WHEN name LIKE '%system%' THEN 1
          WHEN name LIKE '%asset%' THEN 2
          WHEN name LIKE '%vulnerabilit%' THEN 3
          WHEN name LIKE '%patch%' THEN 4
          ELSE 5
        END,
        name
    `;
    
    // Group metrics by category
    const systemMetrics = metrics.filter(m => m.name.includes('system'));
    const assetMetrics = metrics.filter(m => m.name.includes('asset'));
    const vulnerabilityMetrics = metrics.filter(m => m.name.includes('vulnerabilit') || m.name.includes('critical_open') || m.name.includes('high_open') || m.name.includes('cvss') || m.name.includes('cyber_exposure') || m.name.includes('remediation'));
    const patchMetrics = metrics.filter(m => m.name.includes('patch'));
    const maturityMetrics = metrics.filter(m => m.name.includes('maturity') || m.name.includes('grade'));
    
    // Display System Metrics
    console.log('\n🏢 SYSTEM METRICS');
    console.log('-'.repeat(50));
    systemMetrics.forEach(metric => {
      console.log(`📈 ${metric.name}: ${metric.value} ${metric.unit}`);
      console.log(`   ${metric.description}`);
      console.log('');
    });
    
    // Display Asset Metrics
    console.log('\n💻 ASSET METRICS');
    console.log('-'.repeat(50));
    assetMetrics.forEach(metric => {
      console.log(`📈 ${metric.name}: ${metric.value} ${metric.unit}`);
      console.log(`   ${metric.description}`);
      console.log('');
    });
    
    // Display Vulnerability Metrics
    console.log('\n🔒 VULNERABILITY METRICS');
    console.log('-'.repeat(50));
    vulnerabilityMetrics.forEach(metric => {
      console.log(`📈 ${metric.name}: ${metric.value} ${metric.unit}`);
      console.log(`   ${metric.description}`);
      console.log('');
    });
    
    // Display Patch Metrics
    console.log('\n🔧 PATCH METRICS');
    console.log('-'.repeat(50));
    patchMetrics.forEach(metric => {
      console.log(`📈 ${metric.name}: ${metric.value} ${metric.unit}`);
      console.log(`   ${metric.description}`);
      console.log('');
    });
    
    // Display Maturity Metrics
    console.log('\n🎯 MATURITY & RISK SCORES');
    console.log('-'.repeat(50));
    maturityMetrics.forEach(metric => {
      let displayValue = metric.value;
      if (metric.name.includes('grade')) {
        const gradeMap = { 4: 'A', 3: 'B', 2: 'C', 1: 'D', 0: 'F' };
        displayValue = gradeMap[metric.value] || metric.value;
      }
      console.log(`📈 ${metric.name}: ${displayValue} ${metric.unit}`);
      console.log(`   ${metric.description}`);
      console.log('');
    });
    
    // Summary Statistics
    console.log('\n📊 METRICS SUMMARY');
    console.log('-'.repeat(50));
    console.log(`Total Metrics Created: ${metrics.length}`);
    console.log(`System Metrics: ${systemMetrics.length}`);
    console.log(`Asset Metrics: ${assetMetrics.length}`);
    console.log(`Vulnerability Metrics: ${vulnerabilityMetrics.length}`);
    console.log(`Patch Metrics: ${patchMetrics.length}`);
    console.log(`Maturity/Risk Metrics: ${maturityMetrics.length}`);
    
    // Key Insights
    console.log('\n🔍 KEY INSIGHTS');
    console.log('-'.repeat(50));
    
    const totalVulns = metrics.find(m => m.name === 'total_vulnerabilities_new')?.value || 0;
    const criticalVulns = metrics.find(m => m.name === 'vulnerabilities_critical_new')?.value || 0;
    const openVulns = metrics.find(m => m.name === 'vulnerabilities_open_new')?.value || 0;
    const fixedVulns = metrics.find(m => m.name === 'vulnerabilities_fixed_new')?.value || 0;
    const cesScore = metrics.find(m => m.name === 'cyber_exposure_score')?.value || 0;
    const assetCoverage = metrics.find(m => m.name === 'asset_coverage_percentage')?.value || 0;
    
    console.log(`🚨 Critical Risk: ${criticalVulns} critical vulnerabilities out of ${totalVulns} total`);
    console.log(`📊 Remediation Progress: ${fixedVulns} fixed, ${openVulns} still open`);
    console.log(`🎯 Cyber Exposure Score: ${cesScore}/1000 (lower is better)`);
    console.log(`📡 Asset Coverage: ${assetCoverage}% of assets are being scanned`);
    
    const remediationRate = totalVulns > 0 ? ((fixedVulns / totalVulns) * 100).toFixed(1) : 0;
    console.log(`🔧 Overall Remediation Rate: ${remediationRate}%`);
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS');
    console.log('-'.repeat(50));
    
    if (criticalVulns > 0) {
      console.log(`⚠️  URGENT: Address ${criticalVulns} critical vulnerabilities immediately`);
    }
    
    if (assetCoverage < 90) {
      console.log(`📡 Improve asset coverage: Currently at ${assetCoverage}%, target 90%+`);
    }
    
    if (cesScore > 500) {
      console.log(`🎯 High cyber exposure detected: CES score of ${cesScore} indicates significant risk`);
    }
    
    if (remediationRate < 50) {
      console.log(`🔧 Improve remediation efforts: Current rate of ${remediationRate}% is below recommended 50%`);
    }
    
    console.log('\n✅ Metrics analysis complete!');
    
  } catch (error) {
    console.error('❌ Error viewing metrics:', error.message);
  } finally {
    await client.end();
  }
}

viewMetricsSummary();
