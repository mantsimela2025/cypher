/**
 * Formats scan results into a comprehensive report format
 * @module comprehensive-formatter
 */

/**
 * Generate a unique reference ID for the scan
 * @returns {string} Unique scan reference ID
 */
function generateScanReference() {
  return `scan_${Date.now().toString(36)}${Math.random().toString(36).substr(2, 5)}`;
}

/**
 * Get current timestamp in ISO format
 * @returns {string} ISO formatted timestamp
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Convert severity levels between systems
 * @param {string} severity - Source severity level
 * @returns {string} Standardized severity level
 */
function normalizeSeverity(severity) {
  const map = {
    'info': 'info',
    'low': 'low',
    'medium': 'medium',
    'high': 'high',
    'critical': 'critical'
  };
  
  return map[severity.toLowerCase()] || 'info';
}

/**
 * Convert scan results to comprehensive format
 * @param {Object} results - Original scan results
 * @param {Object} options - Formatting options
 * @param {string} options.scanType - Type of scan conducted
 * @param {string} options.scanTitle - Title of the scan
 * @param {Array} options.targetHosts - List of target hosts
 * @param {Array} options.excludedHosts - List of excluded hosts
 * @returns {Object} Formatted comprehensive report
 */
function formatResults(results, options = {}) {
  const scanStartTime = results.timestamp || getTimestamp();
  const scanEndTime = getTimestamp();
  
  // Calculate scan duration in HH:MM:SS format
  const startDate = new Date(scanStartTime);
  const endDate = new Date(scanEndTime);
  const durationMs = endDate - startDate;
  const durationHours = Math.floor(durationMs / 3600000);
  const durationMinutes = Math.floor((durationMs % 3600000) / 60000);
  const durationSeconds = Math.floor((durationMs % 60000) / 1000);
  const duration = `${durationHours.toString().padStart(2, '0')}:${durationMinutes.toString().padStart(2, '0')}:${durationSeconds.toString().padStart(2, '0')}`;
  
  // Extract and normalize vulnerabilities
  const vulnerabilities = [];
  
  if (results.vulnerabilities && Array.isArray(results.vulnerabilities)) {
    results.vulnerabilities.forEach(vuln => {
      const formattedVuln = {
        ip: options.targetHosts && options.targetHosts[0] || '0.0.0.0',
        dns: results.target || 'unknown',
        netbios: '',
        os: 'Unknown',
        ip_status: 'alive',
        qid: `vuln_${Date.now().toString(36).substring(0, 6)}`,
        title: vuln.name || 'Unnamed Vulnerability',
        type: vuln.id && vuln.id.includes('web') ? 'web' : 'remote',
        severity: normalizeSeverity(vuln.severity),
        port: vuln.port || (vuln.evidence && vuln.evidence.port) || (results.target && results.target.includes('https') ? 443 : 80),
        protocol: 'tcp',
        fqdn: results.target || '',
        ssl: results.target && results.target.includes('https:') || false,
        cve_id: vuln.cve || '',
        vendor_reference: '',
        cvss_base: vuln.cvss || 0,
        cvss_temporal: 0,
        cvss3_base: vuln.cvss3 || 0,
        cvss3_temporal: 0,
        threat: vuln.description || '',
        impact: vuln.impact || 'Potential security impact',
        solution: vuln.remediation || 'No remediation provided',
        exploitability: vuln.exploitability || 'unknown',
        associated_malware: [],
        results: 'Vulnerability confirmed',
        pci_vuln: false,
        instance: `instance_${vulnerabilities.length + 1}`,
        category: vuln.category || 'application'
      };
      
      vulnerabilities.push(formattedVuln);
    });
  }
  
  // Count severity levels
  const severityCounts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0
  };
  
  vulnerabilities.forEach(vuln => {
    if (severityCounts[vuln.severity] !== undefined) {
      severityCounts[vuln.severity]++;
    }
  });
  
  // Build comprehensive report
  const report = {
    scan_results: {
      scan_job: {
        launch_date: scanStartTime,
        active_hosts: 1,
        total_hosts: options.targetHosts ? options.targetHosts.length : 1,
        type: options.scanType || 'web',
        status: 'completed',
        reference: options.reference || generateScanReference(),
        scanner_appliance: options.scannerAppliance || 'scanner_01',
        duration: duration,
        scan_title: options.scanTitle || `Vulnerability Scan - ${new Date().toLocaleDateString()}`,
        asset_groups: options.assetGroups || ['Default Group'],
        ips: options.targetHosts || [results.target || '0.0.0.0'],
        excluded_ips: options.excludedHosts || [],
        option_profile: options.profile || 'default'
      },
      vulnerabilities: vulnerabilities,
      host_stats: {
        target_distribution_across_scanner_appliances: {
          scanner_01: options.targetHosts ? options.targetHosts.length : 1
        },
        hosts_not_scanned_excluded_host_ip: options.excludedHosts || [],
        hosts_not_scanned_host_not_alive_ip: [],
        hosts_not_scanned_host_not_alive_dns: [],
        hosts_not_scanned_host_not_alive_netbios: [],
        hosts_not_scanned_hostname_not_found_ip: [],
        hosts_not_scanned_scan_discontinued_ip: [],
        hosts_not_scanned_scan_discontinued_netbios_instance_ids: [],
        hosts_not_scanned_scan_discontinued_netbios_dns: [],
        hosts_not_scanned_dns_hostname_could_not_be_resolved: [],
        hosts_not_scanned_netbios_could_not_be_resolved: [],
        hosts_not_scanned_dns_could_not_be_resolved: [],
        hosts_not_scanned_ip_could_not_be_resolved: [],
        hosts_not_scanned_hostname_not_found_netbios: [],
        hosts_not_scanned_scan_discontinued: [],
        hosts_not_scanned_no_vulnerabilities: []
      },
      summary: {
        total_vulnerabilities: vulnerabilities.length,
        high_severity: severityCounts.high,
        medium_severity: severityCounts.medium,
        low_severity: severityCounts.low,
        critical_severity: severityCounts.critical,
        total_hosts_scanned: options.targetHosts ? options.targetHosts.length : 1,
        total_hosts_with_vulnerabilities: vulnerabilities.length > 0 ? 1 : 0,
        total_hosts_without_vulnerabilities: vulnerabilities.length > 0 ? 0 : 1
      }
    }
  };
  
  return report;
}

module.exports = {
  formatResults
};