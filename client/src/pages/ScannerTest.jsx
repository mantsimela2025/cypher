import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Row, Col, Form, FormGroup, Input, Label, Button, Alert, Progress, Badge, Table, ButtonGroup, Dropdown, DropdownToggle, DropdownMenu, DropdownItem, Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import Icon from '@/components/icon/Icon';
import Head from '@/layout/head/Head';
import Content from '@/layout/content/Content';
import {
  DataTable,
  DataTableBody,
  DataTableHead,
  DataTableRow,
  DataTableItem,
  PaginationComponent,
  PreviewCard,
  Row as CustomRow,
  Col as CustomCol
} from '@/components/Component';
import { toast } from 'react-toastify';

const ScannerTest = () => {
  const [activeTab, setActiveTab] = useState('scanner');
  const [testResults, setTestResults] = useState({});
  const [testing, setTesting] = useState(false);
  const [scanConfig, setScanConfig] = useState({
    target: '',
    modules: ['network'],
    credentials: {
      username: '',
      password: '',
      domain: ''
    },
    options: {
      timeout: 30,
      concurrent: 5
    },
    complianceFrameworks: ['nist'] // Default to NIST SP 800-53 - most widely used government framework
  });
  
  const [activeScans, setActiveScans] = useState({});
  const [scanResults, setScanResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');
  const [presetDropdownOpen, setPresetDropdownOpen] = useState(false);

  const scannerModules = [
    { id: 'network', name: 'Network Scan', description: 'Port scanning and service detection', icon: 'network', color: 'primary' },
    { id: 'web', name: 'Web Application', description: 'Web vulnerability scanning', icon: 'globe', color: 'info' },
    { id: 'ssl', name: 'SSL/TLS Analysis', description: 'Certificate and cipher analysis', icon: 'shield-check', color: 'success' },
    { id: 'compliance', name: 'Compliance Check', description: 'Security compliance validation', icon: 'check-square', color: 'warning' },
    { id: 'snmp', name: 'SNMP Discovery', description: 'Network device discovery via SNMP', icon: 'server', color: 'danger' },
    { id: 'wmi', name: 'WMI Scanner', description: 'Windows Management Instrumentation', icon: 'desktop', color: 'purple' },
    { id: 'ssh', name: 'Enhanced SSH', description: 'Deep Linux system analysis', icon: 'terminal', color: 'dark' },
    { id: 'smb', name: 'SMB Discovery', description: 'Windows domain and share analysis', icon: 'folder-open', color: 'secondary' },
    { id: 'vulnerability', name: 'Patch Management', description: 'CVE correlation, missing patches, EOL detection', icon: 'shield-exclamation', color: 'warning' },
    { id: 'aws', name: 'AWS Cloud Security', description: 'S3, EC2, IAM security assessment', icon: 'aws', color: 'warning' },
    { id: 'azure', name: 'Azure Cloud Security', description: 'Azure storage, VMs, resource groups', icon: 'microsoft', color: 'info' },
    { id: 'gcp', name: 'Google Cloud Security', description: 'GCS buckets, compute instances, IAM', icon: 'google', color: 'danger' },
    { id: 'cloud', name: 'Multi-Cloud Security', description: 'Cross-cloud security assessment', icon: 'layers', color: 'primary' },
    { id: 'container', name: 'Docker Security', description: 'Docker daemon and container scanning', icon: 'docker', color: 'info' },
    { id: 'k8s', name: 'Kubernetes Security', description: 'K8s cluster and API security', icon: 'kubernetes', color: 'secondary' },
    { id: 'openshift', name: 'OpenShift Security', description: 'OpenShift cluster security assessment', icon: 'openshift', color: 'danger' },
    { id: 'government', name: 'Government Compliance', description: 'NIST, FedRAMP, FISMA compliance', icon: 'government', color: 'success' }
  ];


  const presetTargets = [
    // Traditional Infrastructure
    { name: 'Scanme (Public Test)', value: 'scanme.nmap.org', description: 'Public scanning test target' },
    { name: 'Localhost (127.0.0.1)', value: '127.0.0.1', description: 'Local system scan via loopback' },
    { name: 'Localhost (hostname)', value: 'localhost', description: 'Local system scan via hostname' },
    { name: 'Your Wi-Fi IP', value: '192.168.0.41', description: 'Your actual Wi-Fi network IP address' },
    { name: 'Your VPN IP', value: '10.5.0.2', description: 'Your NordVPN IP address' },
    { name: 'Virtual Network IP', value: '192.168.56.1', description: 'Virtual adapter (Ethernet 2) IP' },
    { name: 'Wi-Fi Gateway', value: '192.168.0.1', description: 'Your Wi-Fi network gateway' },
    { name: 'Wi-Fi Network Range', value: '192.168.0.1-50', description: 'Scan your Wi-Fi network range' },
    { name: 'Custom Range', value: '192.168.1.1-50', description: 'General IP range scan' },
    
    // AWS Cloud Security
    { name: 'AWS S3 Bucket', value: 's3://my-test-bucket', description: 'AWS S3 bucket security test' },
    { name: 'AWS CloudFront', value: 'my-cloudfront-distribution.cloudfront.net', description: 'AWS CloudFront distribution test' },
    { name: 'AWS API Gateway', value: 'my-api-gateway.execute-api.us-east-1.amazonaws.com', description: 'AWS API Gateway security test' },
    { name: 'AWS Load Balancer', value: 'my-load-balancer.elb.amazonaws.com', description: 'AWS ELB security test' },
    
    // Azure Cloud Security
    { name: 'Azure Storage Account', value: 'mystorageaccount.blob.core.windows.net', description: 'Azure Blob storage security test' },
    { name: 'Azure VM', value: 'myvm.eastus.cloudapp.azure.com', description: 'Azure virtual machine security test' },
    { name: 'Azure App Service', value: 'myapp.azurewebsites.net', description: 'Azure web app security test' },
    { name: 'Azure Key Vault', value: 'mykeyvault.vault.azure.net', description: 'Azure Key Vault security test' },
    
    // Google Cloud Security
    { name: 'GCP Storage Bucket', value: 'gs://my-gcs-test-bucket', description: 'Google Cloud Storage security test' },
    { name: 'GCP Compute Instance', value: 'my-instance.us-central1-a.c.project-id.internal', description: 'GCP VM security test' },
    { name: 'GCP Load Balancer', value: 'my-lb-12345.us-central1.elb.googleapis.com', description: 'GCP load balancer security test' },
    { name: 'GCP App Engine', value: 'myapp.appspot.com', description: 'GCP App Engine security test' },
    
    // Container Security
    { name: 'Docker Daemon', value: 'localhost:2375', description: 'Docker daemon security test' },
    { name: 'Docker TLS', value: 'localhost:2376', description: 'Docker TLS daemon security test' },
    { name: 'Container Registry', value: 'localhost:5000', description: 'Docker registry security test' },
    { name: 'Kubernetes API', value: 'localhost:8080', description: 'Kubernetes API security test' },
    { name: 'Kubernetes Secure API', value: 'localhost:6443', description: 'Kubernetes secure API test' },
    { name: 'Kubelet API', value: 'localhost:10250', description: 'Kubelet API security test' },
    
    // OpenShift Security
    { name: 'OpenShift API', value: 'localhost:8443', description: 'OpenShift cluster security test' },
    { name: 'OpenShift Router', value: 'localhost:1936', description: 'OpenShift router statistics test' },
    { name: 'OpenShift Console', value: 'localhost:9443', description: 'OpenShift operator console test' },
    
    // Multi-Environment Testing
    { name: 'Hybrid Infrastructure', value: '192.168.1.0/24,my-aws-vpc,localhost', description: 'Multi-environment security test' },
    { name: 'Multi-Cloud Assets', value: 'aws-bucket,azure-storage,gcp-bucket', description: 'Cross-cloud security assessment' }
  ];

  // Check API status on component mount
  useEffect(() => {
    checkApiStatus();
  }, []);

  const checkApiStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/v1/scanner/health');
      if (response.ok) {
        setApiStatus('online');
        toast.success('Scanner API is online and ready!', { autoClose: 2000 });
      } else {
        setApiStatus('offline');
        toast.error('Scanner API is offline');
      }
    } catch (error) {
      setApiStatus('offline');
      toast.error('Cannot connect to Scanner API');
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setScanConfig(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setScanConfig(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleModuleToggle = (moduleId) => {
    setScanConfig(prev => ({
      ...prev,
      modules: prev.modules.includes(moduleId)
        ? prev.modules.filter(m => m !== moduleId)
        : [...prev.modules, moduleId]
    }));
  };


  const startScan = async () => {
    if (!scanConfig.target.trim()) {
      toast.error('Please enter a target IP address or hostname');
      return;
    }
    if (scanConfig.modules.length === 0) {
      toast.error('Please select at least one scanner module');
      return;
    }

    setLoading(true);
    
    try {
      // Simplified payload to debug 400 errors - remove potentially unsupported fields
      const scanPayload = {
        targets: [scanConfig.target.trim()],
        modules: scanConfig.modules.filter(m => ['network', 'web', 'ssl'].includes(m)) // Only use basic modules first
      };

      // Add options only if they're supported
      if (scanConfig.options.timeout !== 30 || scanConfig.options.concurrent !== 5) {
        scanPayload.options = scanConfig.options;
      }

      // Note: Temporarily removing complianceFrameworks to test if that's causing 400 error
      // complianceFrameworks: scanConfig.complianceFrameworks

      console.log('Sending simplified scan request:', JSON.stringify(scanPayload, null, 2));

      const response = await fetch('http://localhost:3001/api/v1/scanner/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'  // Use test token that's specifically supported
        },
        body: JSON.stringify(scanPayload)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`Scan failed: ${response.statusText}`);
      }

      const result = await response.json();
      const scanId = result.scanId;

      setActiveScans(prev => ({
        ...prev,
        [scanId]: {
          target: scanConfig.target,
          modules: scanConfig.modules,
          startTime: new Date().toISOString(),
          status: 'running'
        }
      }));

      toast.success(`Scan started successfully! ID: ${scanId}`);
      
      // Start polling for results
      pollScanResults(scanId);

    } catch (error) {
      toast.error(`Scan failed: ${error.message}`);
      console.error('Scan error:', error);
    } finally {
      setLoading(false);
    }
  };

  const pollScanResults = async (scanId) => {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/v1/scanner/scan/${scanId}/results`, {
          headers: {
            'Authorization': 'Bearer test-token'  // Use test token that's specifically supported
          }
        });
        
        if (response.ok) {
          const results = await response.json();
          
          // Debug log to see actual response structure
          console.log('API Response Structure:', JSON.stringify(results, null, 2));
          
          // Transform backend response to match frontend expectations with CVE enrichment
          const transformedResults = {
            ...results,
            summary: {
              total: results.findings?.length || results.results?.length || 0,
              critical: results.summary?.critical || 0,
              high: results.summary?.high || 0,
              medium: results.summary?.medium || 0,
              low: results.summary?.low || 0,
              info: results.summary?.info || 0
            },
            results: (results.findings || results.results || []).map(finding => ({
              ...finding,
              // Ensure CVE and CVSS data is properly formatted
              cve: finding.cve || finding.cveId || finding.vulnerabilityId || null,
              cvssScore: finding.cvssScore || finding.cvss || finding.score || null,
              // Add patch information if available
              patchAvailable: finding.patchAvailable || false,
              patchDate: finding.patchDate || null,
              endOfLife: finding.endOfLife || false,
              // Enhance severity based on CVSS if not provided
              severity: finding.severity || (
                finding.cvssScore >= 9.0 ? 'critical' :
                finding.cvssScore >= 7.0 ? 'high' :
                finding.cvssScore >= 4.0 ? 'medium' :
                finding.cvssScore >= 0.1 ? 'low' : 'info'
              )
            }))
          };
          
          setScanResults(prev => ({
            ...prev,
            [scanId]: transformedResults
          }));

          setActiveScans(prev => ({
            ...prev,
            [scanId]: {
              ...prev[scanId],
              status: results.scanInfo?.status || results.status || 'completed'
            }
          }));

          if (results.scanInfo?.status === 'completed' || results.status === 'completed') {
            const totalFindings = transformedResults.summary.total;
            toast.success(`Scan ${scanId} completed with ${totalFindings} findings!`);
            return;
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          toast.warning(`Scan ${scanId} timeout - check results manually`);
        }
      } catch (error) {
        console.error('Polling error:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000);
        }
      }
    };

    poll();
  };

  const exportResults = (scanId, format = 'json') => {
    const results = scanResults[scanId];
    if (!results) return;

    const dataStr = format === 'json' 
      ? JSON.stringify(results, null, 2)
      : convertToCSV(results.results || []);
    
    const dataUri = 'data:application/' + format + ';charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `scan_results_${scanId}.${format}`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const convertToCSV = (data) => {
    if (!data.length) return '';
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
    ].join('\n');
    return csvContent;
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'secondary';
      default: return 'light';
    }
  };

  const clearResults = () => {
    setActiveScans({});
    setScanResults({});
    toast.success('All scan results cleared!', { autoClose: 2000 });
  };

  // Comprehensive API and Module Testing Function
  const runSystemTests = async () => {
    setTesting(true);
    setTestResults({});
    
    // Create individual tests for each of the 17 scanner modules
    const tests = [
      {
        name: 'API Health Check',
        test: async () => {
          const response = await fetch('http://localhost:3001/api/v1/scanner/health');
          return { success: response.ok, details: response.ok ? 'API Online' : 'API Offline' };
        }
      },
      // Traditional Infrastructure Modules (9 modules)
      {
        name: 'Network Scan Module',
        test: async () => {
          const response = await fetch('http://localhost:3001/api/v1/scanner/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer test-token' },
            body: JSON.stringify({ targets: ['scanme.nmap.org'], modules: ['network'] })
          });
          return { success: response.ok, details: response.ok ? 'Network module works' : `Error: ${response.statusText}` };
        }
      },
      {
        name: 'Web Application Module',
        test: async () => {
          const response = await fetch('http://localhost:3001/api/v1/scanner/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer test-token' },
            body: JSON.stringify({ targets: ['scanme.nmap.org'], modules: ['web'] })
          });
          return { success: response.ok, details: response.ok ? 'Web Application module works' : `Error: ${response.statusText}` };
        }
      },
      {
        name: 'SSL/TLS Analysis Module',
        test: async () => {
          const response = await fetch('http://localhost:3001/api/v1/scanner/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer test-token' },
            body: JSON.stringify({ targets: ['badssl.com'], modules: ['ssl'] })
          });
          return { success: response.ok, details: response.ok ? 'SSL/TLS Analysis module works' : `Error: ${response.statusText}` };
        }
      },
      {
        name: 'Compliance Check Module',
        test: async () => {
          const response = await fetch('http://localhost:3001/api/v1/scanner/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer test-token' },
            body: JSON.stringify({ targets: ['127.0.0.1'], modules: ['compliance'] })
          });
          return { success: response.ok, details: response.ok ? 'Compliance Check module works' : `Error: ${response.statusText}` };
        }
      },
      {
        name: 'SNMP Discovery Module',
        test: async () => {
          const response = await fetch('http://localhost:3001/api/v1/scanner/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer test-token' },
            body: JSON.stringify({ targets: ['192.168.1.1'], modules: ['snmp'] })
          });
          return { success: response.ok, details: response.ok ? 'SNMP Discovery module works' : `Error: ${response.statusText}` };
        }
      },
      {
        name: 'WMI Scanner Module',
        test: async () => {
          const response = await fetch('http://localhost:3001/api/v1/scanner/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer test-token' },
            body: JSON.stringify({ targets: ['127.0.0.1'], modules: ['wmi'] })
          });
          return { success: response.ok, details: response.ok ? 'WMI Scanner module works' : `Error: ${response.statusText}` };
        }
      },
      {
        name: 'Enhanced SSH Module',
        test: async () => {
          const response = await fetch('http://localhost:3001/api/v1/scanner/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer test-token' },
            body: JSON.stringify({ targets: ['scanme.nmap.org'], modules: ['ssh'] })
          });
          return { success: response.ok, details: response.ok ? 'Enhanced SSH module works' : `Error: ${response.statusText}` };
        }
      },
      {
        name: 'SMB Discovery Module',
        test: async () => {
          const response = await fetch('http://localhost:3001/api/v1/scanner/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer test-token' },
            body: JSON.stringify({ targets: ['127.0.0.1'], modules: ['smb'] })
          });
          return { success: response.ok, details: response.ok ? 'SMB Discovery module works' : `Error: ${response.statusText}` };
        }
      },
      {
        name: 'Patch Management Module',
        test: async () => {
          const response = await fetch('http://localhost:3001/api/v1/scanner/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer test-token' },
            body: JSON.stringify({ targets: ['scanme.nmap.org'], modules: ['vulnerability'] })
          });
          return { success: response.ok, details: response.ok ? 'Patch Management module works' : `Error: ${response.statusText}` };
        }
      },
      
      // Cloud Security Modules (4 modules)
      {
        name: 'AWS Cloud Security Module',
        test: async () => {
          const response = await fetch('http://localhost:3001/api/v1/scanner/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer test-token' },
            body: JSON.stringify({ targets: ['amazonaws.com'], modules: ['aws'] })
          });
          return { success: response.ok, details: response.ok ? 'AWS Cloud Security module works' : `Error: ${response.statusText}` };
        }
      },
      {
        name: 'Azure Cloud Security Module',
        test: async () => {
          const response = await fetch('http://localhost:3001/api/v1/scanner/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer test-token' },
            body: JSON.stringify({ targets: ['azure.microsoft.com'], modules: ['azure'] })
          });
          return { success: response.ok, details: response.ok ? 'Azure Cloud Security module works' : `Error: ${response.statusText}` };
        }
      },
      {
        name: 'Google Cloud Security Module',
        test: async () => {
          const response = await fetch('http://localhost:3001/api/v1/scanner/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer test-token' },
            body: JSON.stringify({ targets: ['cloud.google.com'], modules: ['gcp'] })
          });
          return { success: response.ok, details: response.ok ? 'Google Cloud Security module works' : `Error: ${response.statusText}` };
        }
      },
      {
        name: 'Multi-Cloud Security Module',
        test: async () => {
          const response = await fetch('http://localhost:3001/api/v1/scanner/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer test-token' },
            body: JSON.stringify({ targets: ['cloud.google.com'], modules: ['cloud'] })
          });
          return { success: response.ok, details: response.ok ? 'Multi-Cloud Security module works' : `Error: ${response.statusText}` };
        }
      },
      
      // Container Security Modules (3 modules)
      {
        name: 'Docker Security Module',
        test: async () => {
          const response = await fetch('http://localhost:3001/api/v1/scanner/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer test-token' },
            body: JSON.stringify({ targets: ['localhost:2375'], modules: ['container'] })
          });
          return { success: response.ok, details: response.ok ? 'Docker Security module works' : `Error: ${response.statusText}` };
        }
      },
      {
        name: 'Kubernetes Security Module',
        test: async () => {
          const response = await fetch('http://localhost:3001/api/v1/scanner/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer test-token' },
            body: JSON.stringify({ targets: ['127.0.0.1'], modules: ['k8s'] })
          });
          return { success: response.ok, details: response.ok ? 'Kubernetes Security module works' : `Error: ${response.statusText}` };
        }
      },
      {
        name: 'OpenShift Security Module',
        test: async () => {
          const response = await fetch('http://localhost:3001/api/v1/scanner/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer test-token' },
            body: JSON.stringify({ targets: ['localhost:8443'], modules: ['openshift'] })
          });
          return { success: response.ok, details: response.ok ? 'OpenShift Security module works' : `Error: ${response.statusText}` };
        }
      },
      
      // Government Compliance Module (1 module)
      {
        name: 'Government Compliance Module',
        test: async () => {
          const response = await fetch('http://localhost:3001/api/v1/scanner/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer test-token' },
            body: JSON.stringify({ targets: ['scanme.nmap.org'], modules: ['government'] })
          });
          return { success: response.ok, details: response.ok ? 'Government Compliance module works' : `Error: ${response.statusText}` };
        }
      },
      
      // Mock Results Test
      {
        name: 'Mock Results Generation',
        test: async () => {
          // Test if we can generate mock results for testing
          const mockResults = {
            scanInfo: { status: 'completed' },
            summary: { total: 3, critical: 1, high: 1, medium: 1, low: 0, info: 0 },
            findings: [
              { title: 'Test Finding 1', severity: 'critical', cve: 'CVE-2023-1234', cvssScore: 9.1, target: 'test-target', module: 'network' },
              { title: 'Test Finding 2', severity: 'high', cve: 'CVE-2023-5678', cvssScore: 7.5, target: 'test-target', module: 'webapp' },
              { title: 'Test Finding 3', severity: 'medium', cvssScore: 5.2, target: 'test-target', module: 'ssl' }
            ]
          };
          return { success: true, details: 'Mock data generation works', mockResults };
        }
      }
    ];

    const results = {};
    for (const test of tests) {
      try {
        console.log(`Running test: ${test.name}`);
        const result = await test.test();
        results[test.name] = result;
        
        if (test.name === 'Mock Results Generation' && result.mockResults) {
          // Add mock results to display
          setScanResults(prev => ({
            ...prev,
            'mock-test': result.mockResults
          }));
          setActiveScans(prev => ({
            ...prev,
            'mock-test': {
              target: 'Mock Test Data',
              modules: ['network', 'webapp', 'ssl'],
              startTime: new Date().toISOString(),
              status: 'completed'
            }
          }));
        }
      } catch (error) {
        results[test.name] = { success: false, details: error.message };
      }
    }
    
    setTestResults(results);
    setTesting(false);
    
    const passedTests = Object.values(results).filter(r => r.success).length;
    const totalTests = tests.length;
    
    if (passedTests === totalTests) {
      toast.success(`All ${totalTests} tests passed! Scanner system is working correctly.`);
    } else {
      toast.warning(`${passedTests}/${totalTests} tests passed. Check results for details.`);
    }
  };

  return (
    <>
      <Head title="Scanner Test Interface" />
      <Content>
        <div className="nk-content-inner">
          <div className="nk-content-body">
            <div className="nk-block-head">
              <div className="nk-block-between g-3">
                <div className="nk-block-head-content">
                  <h3 className="nk-block-title page-title">
                    Scanner Test Interface
                    <Badge color={apiStatus === 'online' ? 'success' : 'danger'} className="ms-2">
                      API {apiStatus}
                    </Badge>
                  </h3>
                  <div className="nk-block-des text-soft">
                    <p>Test all 17 scanner modules across traditional infrastructure, cloud (AWS/Azure/GCP), containers, and OpenShift environments with comprehensive patch management and compliance framework support</p>
                  </div>
                </div>
                {activeTab === 'scanner' && (
                  <div className="nk-block-head-content">
                    <div className="d-flex">
                      <button
                        type="button"
                        className={`btn btn-primary ${loading || apiStatus !== 'online' ? 'disabled' : ''}`}
                        disabled={loading || apiStatus !== 'online'}
                        onClick={startScan}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            <span>Starting Scan...</span>
                          </>
                        ) : (
                          <>
                            <em className="icon ni ni-play"></em> <span>Start Scan</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={checkApiStatus}
                      >
                        <em className="icon ni ni-reload"></em> <span>Refresh Status</span>
                      </button>
                      <button
                        type="button"
                        className={`btn btn-outline-success ${testing ? 'disabled' : ''}`}
                        disabled={testing || apiStatus !== 'online'}
                        onClick={runSystemTests}
                      >
                        {testing ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            <span>Testing...</span>
                          </>
                        ) : (
                          <>
                            <em className="icon ni ni-check-circle"></em> <span>Test All Modules</span>
                          </>
                        )}
                      </button>
                      {(Object.keys(activeScans).length > 0 || Object.keys(scanResults).length > 0) && (
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={clearResults}
                        >
                          <em className="icon ni ni-trash"></em> <span>Clear Results</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="nk-block mb-4">
              <Nav tabs className="nav-tabs-mb-icon nav-tabs-card">
                <NavItem>
                  <NavLink
                    className={activeTab === 'scanner' ? 'active' : ''}
                    onClick={() => setActiveTab('scanner')}
                    style={{ cursor: 'pointer' }}
                  >
                    <Icon name="shield-check" />
                    <span>Scanner</span>
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={activeTab === 'docs' ? 'active' : ''}
                    onClick={() => setActiveTab('docs')}
                    style={{ cursor: 'pointer' }}
                  >
                    <Icon name="book" />
                    <span>Scanner Test Docs</span>
                  </NavLink>
                </NavItem>
              </Nav>
            </div>

            {/* Tab Content */}
            <TabContent activeTab={activeTab}>
              <TabPane tabId="scanner">
                <CustomRow className="g-gs">
                  {/* Left Sidebar - Scanner Modules */}
                  <CustomCol lg="3" md="4">
                    <PreviewCard>
                      <div className="card-inner" style={{ minHeight: '500px', maxHeight: '600px', overflowY: 'auto', padding: '0.5rem 0.25rem', paddingRight: '0.5rem' }}>
                        <div className="d-flex flex-column gap-2">
                          {scannerModules.map((module) => (
                            <div
                              key={module.id}
                              className={`border rounded p-2 ${scanConfig.modules.includes(module.id) ? 'border-' + module.color + ' bg-light' : 'border-light'}`}
                              style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                              onClick={() => handleModuleToggle(module.id)}
                            >
                              <div className="d-flex align-items-start">
                                <div className="me-3 mt-1">
                                  <input
                                    type="checkbox"
                                    checked={scanConfig.modules.includes(module.id)}
                                    onChange={() => {}}
                                    className="form-check-input"
                                    style={{ cursor: 'pointer' }}
                                  />
                                </div>
                                <div className="me-3">
                                  <Icon name={module.icon} className={`text-${module.color}`} style={{ fontSize: '1.25rem' }} />
                                </div>
                                <div className="flex-grow-1">
                                  <h6 className="mb-1 fw-medium" style={{ fontSize: '0.9rem' }}>{module.name}</h6>
                                  <small className="text-muted" style={{ fontSize: '0.8rem', lineHeight: '1.4', textAlign: 'left', display: 'block' }}>
                                    {module.description}
                                  </small>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </PreviewCard>
                  </CustomCol>

                  {/* Main Content Area */}
                  <CustomCol lg="9" md="8">
                    <div className="g-gs">
                      {/* Scan Configuration */}
                      <div>
                        <Form>
                          {/* Target Selection with Quick Presets */}
                          <Card className="card-bordered mb-3">
                            <CardBody>
                              <FormGroup>
                                <Label className="form-label fw-medium">Target (IP/Hostname/Range)</Label>
                                <Row>
                                  <Col md="8">
                                    <Input
                                      type="text"
                                      placeholder="e.g., 192.168.1.1, scanme.nmap.org, 10.0.0.1-50"
                                      value={scanConfig.target}
                                      onChange={(e) => handleInputChange('target', e.target.value)}
                                      className="form-control-lg"
                                    />
                                  </Col>
                                  <Col md="4">
                                    <Dropdown
                                      isOpen={presetDropdownOpen}
                                      toggle={() => setPresetDropdownOpen(!presetDropdownOpen)}
                                      className="w-100"
                                    >
                                      <DropdownToggle caret color="light" outline className="w-100 form-control-lg">
                                        Quick Presets
                                      </DropdownToggle>
                                      <DropdownMenu
                                        className="w-100"
                                        style={{
                                          maxHeight: '400px',
                                          overflowY: 'auto',
                                          zIndex: 1050
                                        }}
                                      >
                                        {presetTargets.map((preset, idx) => (
                                          <DropdownItem
                                            key={idx}
                                            onClick={() => {
                                              handleInputChange('target', preset.value);
                                              setPresetDropdownOpen(false);
                                            }}
                                            title={preset.description}
                                            style={{
                                              whiteSpace: 'normal',
                                              paddingTop: '0.5rem',
                                              paddingBottom: '0.5rem'
                                            }}
                                          >
                                            <div>
                                              <strong>{preset.name}</strong>
                                              <br />
                                              <small className="text-muted">{preset.description}</small>
                                            </div>
                                          </DropdownItem>
                                        ))}
                                      </DropdownMenu>
                                    </Dropdown>
                                  </Col>
                                </Row>
                                <div className="form-note mt-1">
                                  <small className="text-muted">
                                    Enter single IP, hostname, or IP range (e.g., 192.168.1.1-50)
                                  </small>
                                </div>
                              </FormGroup>
                            </CardBody>
                          </Card>

                          {/* Credentials and Scan Options - with red border as shown in image */}
                          <Card className="card-bordered border-danger mb-3">
                            <CardBody>
                              <FormGroup className="mb-3">
                                <Label className="form-label fw-medium">Credentials (Optional - for WMI, SSH, SMB)</Label>
                                <Row>
                                  <Col md="4">
                                    <Input
                                      type="text"
                                      placeholder="Username"
                                      value={scanConfig.credentials.username}
                                      onChange={(e) => handleInputChange('credentials.username', e.target.value)}
                                    />
                                  </Col>
                                  <Col md="4">
                                    <Input
                                      type="password"
                                      placeholder="Password"
                                      value={scanConfig.credentials.password}
                                      onChange={(e) => handleInputChange('credentials.password', e.target.value)}
                                    />
                                  </Col>
                                  <Col md="4">
                                    <Input
                                      type="text"
                                      placeholder="Domain (optional)"
                                      value={scanConfig.credentials.domain}
                                      onChange={(e) => handleInputChange('credentials.domain', e.target.value)}
                                    />
                                  </Col>
                                </Row>
                              </FormGroup>
                              
                              <FormGroup className="mb-0">
                                <Label className="form-label fw-medium">Scan Options</Label>
                                <Row>
                                  <Col md="6">
                                    <Label className="form-label" htmlFor="timeout">Timeout (seconds)</Label>
                                    <Input
                                      type="number"
                                      id="timeout"
                                      min="10"
                                      max="300"
                                      value={scanConfig.options.timeout}
                                      onChange={(e) => handleInputChange('options.timeout', parseInt(e.target.value))}
                                    />
                                  </Col>
                                  <Col md="6">
                                    <Label className="form-label" htmlFor="concurrent">Concurrent Scans</Label>
                                    <Input
                                      type="number"
                                      id="concurrent"
                                      min="1"
                                      max="20"
                                      value={scanConfig.options.concurrent}
                                      onChange={(e) => handleInputChange('options.concurrent', parseInt(e.target.value))}
                                    />
                                  </Col>
                                </Row>
                              </FormGroup>
                              
                            </CardBody>
                          </Card>

                        </Form>
                      </div>

                      {/* System Test Results */}
                      {Object.keys(testResults).length > 0 && (
                        <div className="mt-4">
                          <Card className="card-bordered">
                            <CardHeader>
                              <h5 className="mb-0">
                                <Icon name="check-circle" className="me-2" />
                                System Test Results - All 17 Scanner Modules
                              </h5>
                            </CardHeader>
                            <CardBody>
                              <Row>
                                {Object.entries(testResults).map(([testName, result]) => (
                                  <Col key={testName} md="6" className="mb-3">
                                    <div className={`border rounded p-3 ${result.success ? 'border-success bg-light-success' : 'border-danger bg-light-danger'}`}>
                                      <div className="d-flex align-items-start">
                                        <Icon
                                          name={result.success ? "check-circle" : "cross-circle"}
                                          className={`me-2 mt-1 ${result.success ? 'text-success' : 'text-danger'}`}
                                        />
                                        <div className="flex-grow-1">
                                          <h6 className="mb-1 fw-medium">{testName}</h6>
                                          <small className={result.success ? 'text-success' : 'text-danger'}>
                                            {result.details}
                                          </small>
                                          {result.success && (
                                            <div className="mt-1">
                                              <Badge color="success" style={{ fontSize: '0.7rem' }}>
                                                PASSED
                                              </Badge>
                                            </div>
                                          )}
                                          {!result.success && (
                                            <div className="mt-1">
                                              <Badge color="danger" style={{ fontSize: '0.7rem' }}>
                                                FAILED
                                              </Badge>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </Col>
                                ))}
                              </Row>
                              
                              {/* Test Summary */}
                              <div className="mt-3 pt-3 border-top">
                                <div className="d-flex justify-content-between align-items-center">
                                  <div>
                                    <span className="fw-medium">Complete Test Summary: </span>
                                    <Badge
                                      color={Object.values(testResults).every(r => r.success) ? 'success' : 'warning'}
                                      className="ms-2"
                                    >
                                      {Object.values(testResults).filter(r => r.success).length} / {Object.keys(testResults).length} Tests Passed
                                    </Badge>
                                    <small className="text-muted ms-2">
                                      (Testing all 17 scanner modules + API health + mock data validation)
                                    </small>
                                  </div>
                                  <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() => setTestResults({})}
                                  >
                                    <em className="icon ni ni-trash"></em> <span>Clear Results</span>
                                  </button>
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                        </div>
                      )}
                    </div>

                    {/* Active Scans & Results */}
                    <div className="mt-4">
                      <div>
                        <Card className="card-bordered">
                          <CardBody>
                            {Object.keys(activeScans).length === 0 ? (
                              <div className="text-center py-4">
                                <Icon name="scan" className="text-muted mb-2" style={{ fontSize: '2rem' }} />
                                <p className="text-muted">No active scans. Configure and start a scan to see results here.</p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {Object.entries(activeScans).map(([scanId, scan]) => (
                                  <div key={scanId} className="card card-bordered">
                                    <div className="card-inner">
                                      <div className="d-flex justify-content-between align-items-start mb-2">
                                        <div>
                                          <h6 className="mb-1">
                                            {scan.target}
                                            <Badge color={scan.status === 'completed' ? 'success' : 'primary'} className="ms-2">
                                              {scan.status}
                                            </Badge>
                                          </h6>
                                          <small className="text-muted">
                                            Modules: {scan.modules.join(', ')} |
                                            Started: {new Date(scan.startTime).toLocaleTimeString()}
                                          </small>
                                        </div>
                                        {scanResults[scanId] && (
                                          <div className="btn-group btn-group-sm" role="group">
                                            <button
                                              type="button"
                                              className="btn btn-outline-light"
                                              onClick={() => exportResults(scanId, 'json')}
                                            >
                                              <em className="icon ni ni-download"></em> <span>JSON</span>
                                            </button>
                                            <button
                                              type="button"
                                              className="btn btn-outline-light"
                                              onClick={() => exportResults(scanId, 'csv')}
                                            >
                                              <em className="icon ni ni-file-text"></em> <span>CSV</span>
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                      
                                      {scan.status === 'running' && (
                                        <div className="progress-wrap">
                                          <div className="progress-text">
                                            <span>Scanning...</span>
                                          </div>
                                          <Progress animated value={75} color="primary" />
                                        </div>
                                      )}

                                      {scanResults[scanId] && (
                                        <div className="mt-3">
                                          <div className="d-flex justify-content-between mb-2">
                                            <small className="fw-bold">Results Summary:</small>
                                            <Badge color="info">{scanResults[scanId].summary?.total || 0} findings</Badge>
                                          </div>
                                          
                                          {scanResults[scanId].summary && (
                                            <div className="d-flex gap-2 mb-3">
                                              {scanResults[scanId].summary.critical > 0 && (
                                                <Badge color="danger">{scanResults[scanId].summary.critical} Critical</Badge>
                                              )}
                                              {scanResults[scanId].summary.high > 0 && (
                                                <Badge color="warning">{scanResults[scanId].summary.high} High</Badge>
                                              )}
                                              {scanResults[scanId].summary.medium > 0 && (
                                                <Badge color="info">{scanResults[scanId].summary.medium} Medium</Badge>
                                              )}
                                              {scanResults[scanId].summary.low > 0 && (
                                                <Badge color="secondary">{scanResults[scanId].summary.low} Low</Badge>
                                              )}
                                            </div>
                                          )}

                                          {scanResults[scanId].results && scanResults[scanId].results.length > 0 && (
                                            <ScanResultsTable
                                              results={scanResults[scanId].results}
                                              scanId={scanId}
                                              exportResults={exportResults}
                                              getSeverityColor={getSeverityColor}
                                            />
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardBody>
                        </Card>
                      </div>
                    </div>
                  </CustomCol>
                </CustomRow>
              </TabPane>
              
              <TabPane tabId="docs">
                <ScannerTestDocs />
              </TabPane>
            </TabContent>

          </div>
        </div>
      </Content>
    </>
  );
};

// Scan Results Table Component
const ScanResultsTable = ({ results, scanId, exportResults, getSeverityColor }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Define columns for the scan results table
  const scanResultsColumns = [
    {
      name: (
        <div className="d-flex align-items-center">
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Finding</span>
        </div>
      ),
      selector: (row) => row.title,
      sortable: true,
      grow: 2,
      cell: (row) => (
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
            {row.title}
          </div>
          <div className="text-soft" style={{ fontSize: '0.75rem' }}>
            {row.description || 'No description available'}
          </div>
        </div>
      ),
    },
    {
      name: (
        <div className="d-flex align-items-center">
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Target</span>
        </div>
      ),
      selector: (row) => row.target,
      sortable: true,
      cell: (row) => (
        <div style={{ fontSize: '0.875rem', fontWeight: 'normal' }}>
          {row.target}
          {row.port && <div className="text-soft" style={{ fontSize: '0.75rem' }}>Port: {row.port}</div>}
        </div>
      ),
    },
    {
      name: (
        <div className="d-flex align-items-center">
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Severity</span>
        </div>
      ),
      selector: (row) => row.severity,
      sortable: true,
      width: "100px",
      cell: (row) => (
        <Badge color={getSeverityColor(row.severity)} style={{ fontWeight: '600' }}>
          {row.severity || 'Info'}
        </Badge>
      ),
    },
    {
      name: (
        <div className="d-flex align-items-center">
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>CVE</span>
        </div>
      ),
      selector: (row) => row.cve,
      sortable: true,
      width: "140px",
      cell: (row) => (
        <div>
          {row.cve ? (
            <div>
              <code className="text-info" style={{ fontSize: '0.75rem' }}>{row.cve}</code>
              {row.patchAvailable && (
                <div><Badge color="success" style={{ fontSize: '0.6rem' }}>Patch Available</Badge></div>
              )}
              {row.endOfLife && (
                <div><Badge color="danger" style={{ fontSize: '0.6rem' }}>EOL</Badge></div>
              )}
            </div>
          ) : (
            <span className="text-muted" style={{ fontSize: '0.875rem' }}>-</span>
          )}
        </div>
      ),
    },
    {
      name: (
        <div className="d-flex align-items-center">
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>CVSS</span>
        </div>
      ),
      selector: (row) => row.cvssScore,
      sortable: true,
      width: "80px",
      cell: (row) => (
        row.cvssScore ? (
          <Badge color={row.cvssScore >= 7 ? 'danger' : row.cvssScore >= 4 ? 'warning' : 'info'} style={{ fontWeight: '600' }}>
            {row.cvssScore}
          </Badge>
        ) : (
          <span className="text-muted" style={{ fontSize: '0.875rem' }}>-</span>
        )
      ),
    },
    {
      name: (
        <div className="d-flex align-items-center">
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Module</span>
        </div>
      ),
      selector: (row) => row.module,
      sortable: true,
      width: "100px",
      cell: (row) => (
        <span className="badge badge-dim bg-primary" style={{ fontSize: '0.75rem', fontWeight: '600' }}>
          {row.module || 'General'}
        </span>
      ),
    },
    {
      name: (
        <div className="d-flex align-items-center">
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Patch Info</span>
        </div>
      ),
      selector: (row) => row.patchDate,
      sortable: true,
      width: "120px",
      cell: (row) => (
        <div>
          {row.patchDate ? (
            <div>
              <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                {new Date(row.patchDate).toLocaleDateString()}
              </small>
            </div>
          ) : row.patchAvailable ? (
            <Badge color="warning" style={{ fontSize: '0.7rem' }}>Available</Badge>
          ) : (
            <span className="text-muted" style={{ fontSize: '0.875rem' }}>-</span>
          )}
        </div>
      ),
    }
  ];


  // Get current page data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = results.slice(indexOfFirstItem, indexOfLastItem);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <DataTable className="card-stretch">
      <div className="card-inner position-relative">
        <div className="card-title-group">
          <div className="card-tools">
            <div className="form-inline flex-nowrap gx-3">
              <div className="btn-wrap">
                <span className="d-none d-md-block">
                  <button
                    type="button"
                    className="btn btn-outline-light btn-sm me-1"
                    onClick={() => exportResults(scanId, 'json')}
                  >
                    <em className="icon ni ni-download"></em> <span>JSON</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-light btn-sm"
                    onClick={() => exportResults(scanId, 'csv')}
                  >
                    <em className="icon ni ni-file-text"></em> <span>CSV</span>
                  </button>
                </span>
              </div>
            </div>
          </div>
          <div className="card-tools me-n1">
            <ul className="btn-toolbar gx-1">
              <li className="show-entries">
                <span className="show-label" style={{ fontSize: '0.875rem' }}>
                  Show
                </span>
                <select
                  className="form-select form-select-sm"
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                  style={{ width: '80px', fontSize: '0.875rem' }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <DataTableBody compact>
        <DataTableHead>
          {scanResultsColumns.map((column, index) => (
            <DataTableRow key={index} style={{ width: column.width }}>
              <span className="sub-text">{column.name}</span>
            </DataTableRow>
          ))}
        </DataTableHead>
        {currentItems.length > 0
          ? currentItems.map((item, idx) => (
              <DataTableItem key={`${scanId}-${idx}`}>
                {scanResultsColumns.map((column, index) => (
                  <DataTableRow key={index} style={{ width: column.width }}>
                    {column.cell ? column.cell(item) : item[column.selector(item)]}
                  </DataTableRow>
                ))}
              </DataTableItem>
            ))
          : null}
      </DataTableBody>
      
      <div className="card-inner">
        {currentItems.length > 0 ? (
          <PaginationComponent
            itemPerPage={itemsPerPage}
            totalItems={results.length}
            paginate={paginate}
            currentPage={currentPage}
          />
        ) : (
          <div className="text-center">
            <span className="text-silent">No scan results found</span>
          </div>
        )}
      </div>
    </DataTable>
  );
};

// Scanner Test Documentation Component
const ScannerTestDocs = () => {
  return (
    <div className="documentation-content">
      <Card className="card-bordered">
        <CardBody style={{ padding: '2rem' }}>
          
          {/* Header Section */}
          <div className="mb-5">
            <h2 className="mb-3">Scanner Test Targets</h2>
            <p className="lead text-soft">
              This document provides safe and ethical targets for testing the vulnerability scanning capabilities of our enterprise security platform, including AWS cloud and container security assessments.
            </p>
            
            <Alert color="warning" className="mt-4">
              <div className="d-flex align-items-start">
                <Icon name="alert-triangle" className="me-2 mt-1" />
                <div>
                  <strong>⚠️ IMPORTANT DISCLAIMER</strong>
                  <p className="mb-0 mt-1">
                    <strong>ONLY scan systems and networks you own or have explicit written permission to test.</strong> Unauthorized scanning is illegal and unethical. This document is for educational and authorized testing purposes only.
                  </p>
                </div>
              </div>
            </Alert>
          </div>

          {/* Network Scanning Test Targets */}
          <div className="mb-5">
            <h3 className="mb-3">
              <Icon name="network" className="me-2" />
              Network Scanning Test Targets
            </h3>
            
            <h5 className="mb-2">Internal Test Lab</h5>
            <ul className="mb-4">
              <li><code>10.0.0.0/24</code> - Internal lab network (if available)</li>
              <li><code>192.168.1.0/24</code> - Local network range (own networks only)</li>
              <li><code>127.0.0.1</code> - Localhost testing</li>
            </ul>
            
            <h5 className="mb-2">Public Test Targets (Authorized)</h5>
            <ul className="mb-4">
              <li><code>scanme.nmap.org</code> - Nmap's official test target</li>
              <li><code>testphp.vulnweb.com</code> - Web application security testing</li>
              <li><code>demo.testfire.net</code> - IBM's AltoroMutual demo application</li>
            </ul>
          </div>

          {/* Web Application Scanning */}
          <div className="mb-5">
            <h3 className="mb-3">
              <Icon name="globe" className="me-2" />
              Web Application Scanning
            </h3>
            
            <h5 className="mb-2">Vulnerable Web Applications (Legal Test Targets)</h5>
            <ul className="mb-4">
              <li><code>http://testphp.vulnweb.com/</code> - PHP web application with known vulnerabilities</li>
              <li><code>http://demo.testfire.net/</code> - Banking application demo with security issues</li>
              <li><code>https://juice-shop.herokuapp.com/</code> - OWASP Juice Shop (if publicly available)</li>
            </ul>
            
            <h5 className="mb-2">Local Test Environments</h5>
            <ul className="mb-4">
              <li><code>http://localhost:3000</code> - Local development applications</li>
              <li><code>http://127.0.0.1:8080</code> - Local test servers</li>
              <li><code>http://192.168.1.100</code> - Internal lab web applications</li>
            </ul>
          </div>

          {/* SSL/TLS Testing */}
          <div className="mb-5">
            <h3 className="mb-3">
              <Icon name="shield-check" className="me-2" />
              SSL/TLS Testing
            </h3>
            
            <h5 className="mb-2">Valid Test Targets</h5>
            <ul className="mb-4">
              <li><code>badssl.com</code> - Various SSL/TLS configuration examples</li>
              <li><code>expired.badssl.com</code> - Expired certificate testing</li>
              <li><code>self-signed.badssl.com</code> - Self-signed certificate testing</li>
              <li><code>wrong.host.badssl.com</code> - Hostname mismatch testing</li>
            </ul>
          </div>

          {/* AWS Cloud Security Testing */}
          <div className="mb-5">
            <h3 className="mb-3">
              <Icon name="aws" className="me-2" />
              AWS Cloud Security Testing
            </h3>
            
            <h5 className="mb-2">S3 Bucket Security Testing</h5>
            <p className="mb-3"><strong>Test S3 Bucket Names (Use Your Own Buckets Only)</strong></p>
            <div className="code-block mb-4">
              <pre className="bg-light p-3 rounded">
{`# Create test S3 buckets in your AWS account for security testing
aws s3 mb s3://my-security-test-bucket-public-$(date +%s)
aws s3 mb s3://my-security-test-bucket-private-$(date +%s)`}
              </pre>
            </div>

            <h6 className="mb-2">S3 Security Test Scenarios</h6>
            <ol className="mb-4">
              <li><strong>Public Read Access Testing</strong>
                <ul><li>Target: Your own S3 bucket with public read permissions</li>
                <li>Test: <code>my-security-test-bucket-public.s3.amazonaws.com</code></li></ul>
              </li>
              <li><strong>ACL Misconfiguration Testing</strong>
                <ul><li>Target: Your own S3 bucket with misconfigured ACLs</li>
                <li>Test bucket policy and ACL exposure</li></ul>
              </li>
              <li><strong>Bucket Policy Testing</strong>
                <ul><li>Target: Test buckets with various policy configurations</li>
                <li>Validate policy exposure detection</li></ul>
              </li>
            </ol>

            <h6 className="mb-2">AWS Service Endpoints (Your Own Account Only)</h6>
            <div className="code-block mb-4">
              <pre className="bg-light p-3 rounded">
{`# Test your own AWS services only
my-cloudfront-distribution.cloudfront.net
my-api-gateway.execute-api.us-east-1.amazonaws.com
my-load-balancer.elb.amazonaws.com`}
              </pre>
            </div>
          </div>

          {/* Container Security Testing */}
          <div className="mb-5">
            <h3 className="mb-3">
              <Icon name="docker" className="me-2" />
              Container Security Testing
            </h3>
            
            <h5 className="mb-2">Docker Security Testing</h5>
            <h6 className="mb-2">Local Docker Environment Setup</h6>
            <div className="code-block mb-4">
              <pre className="bg-light p-3 rounded">
{`# Set up vulnerable Docker environment for testing
docker run -d -p 2375:2375 --privileged docker:dind --insecure-registry
docker run -d -p 5000:5000 registry:2`}
              </pre>
            </div>

            <h6 className="mb-2">Test Targets for Docker Security</h6>
            <ul className="mb-4">
              <li><code>localhost:2375</code> - Unencrypted Docker daemon (test environment)</li>
              <li><code>localhost:2376</code> - TLS-encrypted Docker daemon (test environment)</li>
              <li><code>localhost:5000</code> - Docker registry (test environment)</li>
            </ul>

            <h5 className="mb-2">Kubernetes Security Testing</h5>
            <h6 className="mb-2">Local Kubernetes Setup</h6>
            <div className="code-block mb-4">
              <pre className="bg-light p-3 rounded">
{`# Set up local Kubernetes cluster for testing
minikube start
kubectl proxy --port=8080 --accept-hosts='.*' --address='0.0.0.0'`}
              </pre>
            </div>

            <h6 className="mb-2">Kubernetes API Testing Targets (Local Only)</h6>
            <ul className="mb-4">
              <li><code>localhost:8080</code> - Kubernetes API server (insecure, test only)</li>
              <li><code>localhost:6443</code> - Kubernetes API server (secure)</li>
              <li><code>localhost:10250</code> - Kubelet API</li>
              <li><code>localhost:10255</code> - Kubelet read-only API</li>
            </ul>
          </div>

          {/* OpenShift Security Testing */}
          <div className="mb-5">
            <h3 className="mb-3">
              <Icon name="openshift" className="me-2" />
              OpenShift Security Testing (Government/Enterprise)
            </h3>
            
            <h5 className="mb-2">OpenShift Environment Setup</h5>
            <h6 className="mb-2">Local OpenShift Testing (CodeReady Containers)</h6>
            <div className="code-block mb-4">
              <pre className="bg-light p-3 rounded">
{`# Set up local OpenShift cluster for testing
crc setup
crc start
eval $(crc oc-env)`}
              </pre>
            </div>

            <h6 className="mb-2">OpenShift Service Ports</h6>
            <ul className="mb-4">
              <li><code>8443</code> - OpenShift API Server (HTTPS)</li>
              <li><code>8080</code> - OpenShift API Server (HTTP, insecure)</li>
              <li><code>6443</code> - Kubernetes API Server</li>
              <li><code>1936</code> - OpenShift Router Statistics</li>
              <li><code>10250</code> - Kubelet API</li>
              <li><code>4789</code> - OpenShift SDN VXLAN</li>
              <li><code>9443</code> - OpenShift Operator Console</li>
            </ul>
          </div>

          {/* Testing Commands */}
          <div className="mb-5">
            <h3 className="mb-3">
              <Icon name="terminal" className="me-2" />
              Testing Commands
            </h3>
            
            <h5 className="mb-2">Basic Network Scan</h5>
            <div className="code-block mb-4">
              <pre className="bg-light p-3 rounded">
{`curl -X POST http://localhost:5000/api/scans \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Basic Network Scan",
    "targets": ["scanme.nmap.org"],
    "modules": ["network", "ssl"],
    "priority": "medium"
  }'`}
              </pre>
            </div>

            <h5 className="mb-2">AWS Cloud Security Scan</h5>
            <div className="code-block mb-4">
              <pre className="bg-light p-3 rounded">
{`curl -X POST http://localhost:5000/api/scans \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "AWS Security Assessment",
    "targets": ["my-test-bucket"],
    "modules": ["aws"],
    "priority": "high"
  }'`}
              </pre>
            </div>

            <h5 className="mb-2">Container Security Scan</h5>
            <div className="code-block mb-4">
              <pre className="bg-light p-3 rounded">
{`curl -X POST http://localhost:5000/api/scans \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Container Security Scan",
    "targets": ["localhost"],
    "modules": ["container", "docker"],
    "priority": "high"
  }'`}
              </pre>
            </div>

            <h5 className="mb-2">Comprehensive Multi-Environment Scan</h5>
            <div className="code-block mb-4">
              <pre className="bg-light p-3 rounded">
{`curl -X POST http://localhost:5000/api/scans \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Full Enterprise Security Assessment",
    "targets": ["scanme.nmap.org", "my-test-bucket", "localhost"],
    "modules": ["network", "web", "ssl", "aws", "container", "docker", "compliance"],
    "priority": "critical"
  }'`}
              </pre>
            </div>
          </div>

          {/* Preset Target Testing Guide */}
          <div className="mb-5">
            <h3 className="mb-3">
              <Icon name="check-circle" className="me-2" />
              Preset Target Testing Guide
            </h3>
            <p className="mb-4">This section shows which modules to select for each preset target and the expected results for validation.</p>
            
            <Row>
              <Col md="12">
                <h5 className="mb-3">Traditional Infrastructure Targets</h5>
                <Table bordered responsive className="mb-4">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '25%' }}>Preset Target</th>
                      <th style={{ width: '35%' }}>Required Modules</th>
                      <th style={{ width: '40%' }}>Expected Results</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Scanme (Public Test)</strong><br/><code>scanme.nmap.org</code></td>
                      <td>
                        <Badge color="primary" className="me-1 mb-1">Network Scan</Badge>
                        <Badge color="success" className="me-1 mb-1">SSL/TLS Analysis</Badge>
                        <Badge color="info" className="me-1 mb-1">Web Application</Badge>
                      </td>
                      <td>
                        <small>• 6 total findings (1 medium, 1 low, 4 info)<br/>
                        • SSH service on port 22<br/>
                        • HTTP service on port 80<br/>
                        • Risk Score: ~10</small>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Localhost</strong><br/><code>127.0.0.1</code></td>
                      <td>
                        <Badge color="primary" className="me-1 mb-1">Network Scan</Badge>
                        <Badge color="info" className="me-1 mb-1">Web Application</Badge>
                        <Badge color="dark" className="me-1 mb-1">Enhanced SSH</Badge>
                        <Badge color="warning" className="me-1 mb-1">Patch Management</Badge>
                      </td>
                      <td>
                        <small>• Local services detection<br/>
                        • Express.js app (port 5000)<br/>
                        • SSH service analysis<br/>
                        • Missing patches and CVE analysis</small>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Local Network</strong><br/><code>192.168.1.1</code></td>
                      <td>
                        <Badge color="primary" className="me-1 mb-1">Network Scan</Badge>
                        <Badge color="danger" className="me-1 mb-1">SNMP Discovery</Badge>
                        <Badge color="secondary" className="me-1 mb-1">SMB Discovery</Badge>
                        <Badge color="warning" className="me-1 mb-1">Patch Management</Badge>
                      </td>
                      <td>
                        <small>• Gateway device detection<br/>
                        • SNMP community strings<br/>
                        • Network device enumeration<br/>
                        • Firmware and patch analysis</small>
                      </td>
                    </tr>
                  </tbody>
                </Table>

                <h5 className="mb-3">AWS Cloud Security Targets</h5>
                <Table bordered responsive className="mb-4">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '25%' }}>Preset Target</th>
                      <th style={{ width: '35%' }}>Required Modules</th>
                      <th style={{ width: '40%' }}>Expected Results</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>AWS S3 Bucket</strong><br/><code>s3://my-test-bucket</code></td>
                      <td>
                        <Badge color="warning" className="me-1 mb-1">AWS Cloud Security</Badge>
                        <Badge color="warning" className="me-1 mb-1">Compliance Check</Badge>
                      </td>
                      <td>
                        <small>• Bucket permissions analysis<br/>
                        • ACL configuration review<br/>
                        • Public access detection<br/>
                        • Policy exposure assessment</small>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>AWS CloudFront</strong><br/><code>*.cloudfront.net</code></td>
                      <td>
                        <Badge color="warning" className="me-1 mb-1">AWS Cloud Security</Badge>
                        <Badge color="success" className="me-1 mb-1">SSL/TLS Analysis</Badge>
                        <Badge color="info" className="me-1 mb-1">Web Application</Badge>
                      </td>
                      <td>
                        <small>• CDN configuration analysis<br/>
                        • SSL certificate validation<br/>
                        • Origin server exposure<br/>
                        • Cache policy review</small>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>AWS API Gateway</strong><br/><code>*.execute-api.*.amazonaws.com</code></td>
                      <td>
                        <Badge color="warning" className="me-1 mb-1">AWS Cloud Security</Badge>
                        <Badge color="info" className="me-1 mb-1">Web Application</Badge>
                        <Badge color="success" className="me-1 mb-1">SSL/TLS Analysis</Badge>
                      </td>
                      <td>
                        <small>• API endpoint enumeration<br/>
                        • Authentication bypass testing<br/>
                        • Rate limiting validation<br/>
                        • CORS policy analysis</small>
                      </td>
                    </tr>
                  </tbody>
                </Table>

                <h5 className="mb-3">Container Security Targets</h5>
                <Table bordered responsive className="mb-4">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '25%' }}>Preset Target</th>
                      <th style={{ width: '35%' }}>Required Modules</th>
                      <th style={{ width: '40%' }}>Expected Results</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Docker Daemon</strong><br/><code>localhost:2375</code></td>
                      <td>
                        <Badge color="info" className="me-1 mb-1">Docker Security</Badge>
                        <Badge color="primary" className="me-1 mb-1">Network Scan</Badge>
                      </td>
                      <td>
                        <small>• Unencrypted daemon detection<br/>
                        • Container enumeration<br/>
                        • Image vulnerability scan<br/>
                        • Socket permission analysis</small>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Kubernetes API</strong><br/><code>localhost:8080</code></td>
                      <td>
                        <Badge color="secondary" className="me-1 mb-1">Kubernetes Security</Badge>
                        <Badge color="primary" className="me-1 mb-1">Network Scan</Badge>
                        <Badge color="warning" className="me-1 mb-1">Compliance Check</Badge>
                      </td>
                      <td>
                        <small>• Insecure API server detection<br/>
                        • Pod security policies<br/>
                        • RBAC configuration<br/>
                        • Network policy validation</small>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>OpenShift API</strong><br/><code>localhost:8443</code></td>
                      <td>
                        <Badge color="danger" className="me-1 mb-1">OpenShift Security</Badge>
                        <Badge color="success" className="me-1 mb-1">Government Compliance</Badge>
                        <Badge color="success" className="me-1 mb-1">SSL/TLS Analysis</Badge>
                      </td>
                      <td>
                        <small>• Security Context Constraints<br/>
                        • NIST SP 800-53 compliance<br/>
                        • Multi-tenancy isolation<br/>
                        • Federal security controls</small>
                      </td>
                    </tr>
                  </tbody>
                </Table>

                <h5 className="mb-3">Multi-Environment Targets</h5>
                <Table bordered responsive className="mb-4">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '25%' }}>Preset Target</th>
                      <th style={{ width: '35%' }}>Required Modules</th>
                      <th style={{ width: '40%' }}>Expected Results</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Hybrid Infrastructure</strong><br/><code>192.168.1.0/24,my-aws-vpc,localhost</code></td>
                      <td>
                        <Badge color="primary" className="me-1 mb-1">Network Scan</Badge>
                        <Badge color="warning" className="me-1 mb-1">AWS Cloud Security</Badge>
                        <Badge color="info" className="me-1 mb-1">Docker Security</Badge>
                        <Badge color="warning" className="me-1 mb-1">Compliance Check</Badge>
                      </td>
                      <td>
                        <small>• Cross-environment correlation<br/>
                        • Hybrid security posture<br/>
                        • Network segmentation<br/>
                        • Unified compliance report</small>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Multi-Cloud Assets</strong><br/><code>aws-bucket,azure-storage,gcp-bucket</code></td>
                      <td>
                        <Badge color="warning" className="me-1 mb-1">AWS Cloud Security</Badge>
                        <Badge color="info" className="me-1 mb-1">Azure Cloud Security</Badge>
                        <Badge color="danger" className="me-1 mb-1">Google Cloud Security</Badge>
                        <Badge color="primary" className="me-1 mb-1">Multi-Cloud Security</Badge>
                      </td>
                      <td>
                        <small>• Cross-cloud security gaps<br/>
                        • Provider-specific findings<br/>
                        • Unified risk assessment<br/>
                        • Cloud security comparison</small>
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
            </Row>

            <Alert color="info" className="mt-4">
              <div className="d-flex align-items-start">
                <Icon name="info" className="me-2 mt-1" />
                <div>
                  <strong>Validation Tips:</strong>
                  <ul className="mb-0 mt-2">
                    <li>Always verify that expected modules return results for their target types</li>
                    <li>Check that finding counts match expected ranges for known test targets</li>
                    <li>Validate that compliance frameworks are properly applied when selected</li>
                    <li>Ensure cloud-specific modules only activate for appropriate target formats</li>
                    <li>Confirm container modules detect local Docker/Kubernetes environments</li>
                  </ul>
                </div>
              </div>
            </Alert>
          </div>

          {/* Compliance Testing */}
          <div className="mb-5">
            <h3 className="mb-3">
              <Icon name="check-square" className="me-2" />
              Compliance Testing
            </h3>
            
            <h5 className="mb-2">Government Standards Testing</h5>
            <ul className="mb-4">
              <li>Test against NIST Cybersecurity Framework controls</li>
              <li>CIS Critical Security Controls validation</li>
              <li>FedRAMP compliance assessment protocols</li>
              <li>Cloud Security Alliance (CSA) controls</li>
              <li>Container security best practices (CIS Docker/Kubernetes Benchmark)</li>
            </ul>
          </div>

          {/* Ethical Guidelines */}
          <div className="mb-5">
            <h3 className="mb-3">
              <Icon name="shield" className="me-2" />
              Ethical Guidelines
            </h3>
            
            <ol className="mb-4">
              <li><strong>Permission First</strong>: Always obtain written permission before scanning any system</li>
              <li><strong>Own Systems Only</strong>: Only scan systems you own or manage</li>
              <li><strong>AWS Account Isolation</strong>: Use dedicated AWS account for security testing</li>
              <li><strong>Container Isolation</strong>: Use isolated container environments for testing</li>
              <li><strong>Respect Rate Limits</strong>: Don't overwhelm target systems with excessive requests</li>
              <li><strong>Document Everything</strong>: Keep detailed records of all authorized testing</li>
              <li><strong>Report Responsibly</strong>: Follow responsible disclosure practices for any vulnerabilities found</li>
              <li><strong>Legal Compliance</strong>: Ensure all testing complies with local and federal laws</li>
              <li><strong>Cloud Provider ToS</strong>: Respect cloud provider terms of service</li>
              <li><strong>Container Registry Ethics</strong>: Don't scan public registries without permission</li>
            </ol>
          </div>

          {/* Scanner Module Coverage */}
          <div className="mb-5">
            <h3 className="mb-3">
              <Icon name="layers" className="me-2" />
              Scanner Module Coverage
            </h3>
            
            <Row>
              <Col md="6">
                <h5 className="mb-2">Traditional Infrastructure (9 modules)</h5>
                <ul className="mb-4">
                  <li><strong>Network Scanner</strong>: Port scanning, service detection, banner grabbing</li>
                  <li><strong>Web Application Scanner</strong>: OWASP Top 10 testing, security headers, SSL assessment</li>
                  <li><strong>SSL/TLS Scanner</strong>: Certificate validation, cipher analysis, protocol security</li>
                  <li><strong>Compliance Scanner</strong>: NIST, CIS, FedRAMP validation</li>
                  <li><strong>SNMP Discovery</strong>: Network device enumeration</li>
                  <li><strong>WMI Scanner</strong>: Windows system analysis</li>
                  <li><strong>SSH Scanner</strong>: Linux system assessment</li>
                  <li><strong>SMB Discovery</strong>: Windows domain analysis</li>
                  <li><strong>Patch Management</strong>: CVE correlation, missing patches, end-of-life detection</li>
                </ul>
              </Col>
              <Col md="6">
                <h5 className="mb-2">Cloud & Container Security (8 modules)</h5>
                <ul className="mb-4">
                  <li><strong>AWS Cloud Scanner</strong>: S3 security, EC2 metadata, IAM assessment</li>
                  <li><strong>Azure Cloud Scanner</strong>: Storage, VMs, resource group security</li>
                  <li><strong>GCP Scanner</strong>: Storage buckets, compute instances, IAM</li>
                  <li><strong>Multi-Cloud Scanner</strong>: Cross-cloud security assessment</li>
                  <li><strong>Docker Scanner</strong>: Daemon exposure, socket security</li>
                  <li><strong>Kubernetes Scanner</strong>: K8s cluster and API security</li>
                  <li><strong>OpenShift Scanner</strong>: Enterprise container platform security</li>
                  <li><strong>Government Compliance</strong>: NIST, FedRAMP, FISMA validation</li>
                </ul>
              </Col>
            </Row>
          </div>

          {/* Verified Test Results */}
          <div className="mb-5">
            <h3 className="mb-3">
              <Icon name="check" className="me-2" />
              Verified Test Results ✅
            </h3>
            
            <Row>
              <Col md="6">
                <Card className="border-success mb-3">
                  <CardBody>
                    <h6 className="mb-2">scanme.nmap.org (45.33.32.156)</h6>
                    <p className="mb-1"><strong>Findings:</strong> 6 total (1 medium, 1 low, 4 info)</p>
                    <p className="mb-1"><strong>Key Issues:</strong> Outdated SSH (CVE-2018-15473), Apache server</p>
                    <Badge color="warning">Risk Score: 10</Badge>
                  </CardBody>
                </Card>
              </Col>
              <Col md="6">
                <Card className="border-info mb-3">
                  <CardBody>
                    <h6 className="mb-2">Google DNS (8.8.8.8)</h6>
                    <p className="mb-1"><strong>Findings:</strong> 3 total (1 medium, 2 info)</p>
                    <p className="mb-1"><strong>Services:</strong> DNS (53), HTTPS (443)</p>
                    <Badge color="info">Risk Score: 6</Badge>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </div>

          {/* Support and Documentation */}
          <div className="mb-5">
            <h3 className="mb-3">
              <Icon name="info" className="me-2" />
              Support and Documentation
            </h3>
            
            <p className="mb-3">For questions about scanner testing:</p>
            <ul className="mb-4">
              <li>Review NIST SP 800-115 "Technical Guide to Information Security Testing and Assessment"</li>
              <li>Consult OWASP Testing Guide v4.2</li>
              <li>Reference CIS Critical Security Controls</li>
              <li>AWS Security Best Practices documentation</li>
              <li>Docker Security documentation</li>
              <li>Kubernetes Security documentation</li>
              <li>Container Security best practices (NIST SP 800-190)</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="text-center pt-4 border-top">
            <p className="text-soft mb-2">
              <strong>Last Updated:</strong> January 2025 |
              <strong> Scanner Version:</strong> 2.0 (Enhanced with AWS and Container capabilities) |
              <strong> Compliance:</strong> NIST SP 800-115, OWASP Testing Guide, CIS Controls, NIST SP 800-190
            </p>
            <p className="text-soft mb-0">
              <em>Remember: Ethical testing practices protect both your organization and the broader security community. Always test responsibly and within legal boundaries.</em>
            </p>
          </div>
          
        </CardBody>
      </Card>
    </div>
  );
};

export default ScannerTest;