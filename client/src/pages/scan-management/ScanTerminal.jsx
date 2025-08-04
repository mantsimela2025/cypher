import React, { useState, useRef, useEffect } from "react";
import Head from "@/layout/head/Head";
import Content from "@/layout/content/Content";
import "./ScanTerminal.css";
import {
  Block,
  BlockHead,
  BlockHeadContent,
  BlockTitle,
  BlockDes,
  BlockBetween,
  Row,
  Col,
  Button,
  Icon,
} from "@/components/Component";
import { Card, Badge, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";

const ScanTerminal = () => {
  const [terminalOutput, setTerminalOutput] = useState([
    { type: 'info', text: 'Welcome to the Scan Terminal! You can run scanner commands directly from this interface.' },
    { type: 'info', text: 'Available commands: port-scan, vuln-scan, server-scan, web-scan, compliance-scan, container-scan, and more.' },
    { type: 'info', text: 'Type \'help\' for more information or use the preset commands below.' }
  ]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [isRunning, setScanRunning] = useState(false);
  const [saveToFile, setSaveToFile] = useState(false);
  const [outputFilename, setOutputFilename] = useState('scan-output.txt');
  const [activeTab, setActiveTab] = useState('1');
  const terminalRef = useRef(null);

  // Auto-scroll terminal to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalOutput]);

  const addToTerminal = (text, type = 'output') => {
    setTerminalOutput(prev => [...prev, { type, text, timestamp: new Date() }]);
  };

  const runCommand = async () => {
    if (!currentCommand.trim()) return;

    setScanRunning(true);
    addToTerminal(`scanner@terminal:~$ ${currentCommand}`, 'command');

    try {
      const response = await fetch('/api/v1/scanner/terminal/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          command: currentCommand,
          saveOutput: saveToFile,
          outputFilename: saveToFile ? outputFilename : undefined
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Add the output from the API response
        if (data.data && data.data.output) {
          data.data.output.forEach(line => {
            if (line.type !== 'command') { // Skip command echo since we already added it
              addToTerminal(line.text, line.type);
            }
          });
        }
      } else {
        addToTerminal(`Error: ${data.error || 'Command execution failed'}`, 'error');
      }
    } catch (error) {
      console.error('Error executing command:', error);
      addToTerminal('Error: Failed to execute command', 'error');
    } finally {
      setScanRunning(false);
      setCurrentCommand('');
    }
  };

  const stopScan = () => {
    setScanRunning(false);
    addToTerminal('Scan interrupted by user', 'warning');
    addToTerminal('Cleaning up resources...', 'info');
  };

  const clearTerminal = () => {
    setTerminalOutput([
      { type: 'info', text: 'Terminal cleared. Ready for new commands.' }
    ]);
  };

  const copyTerminal = () => {
    const text = terminalOutput.map(line => line.text).join('\n');
    navigator.clipboard.writeText(text);
    addToTerminal('Terminal output copied to clipboard', 'success');
  };

  const executePreset = async (command) => {
    setCurrentCommand(command);
    // Auto-run preset commands
    setTimeout(async () => {
      await runCommand();
    }, 100);
  };

  const getLineColor = (type) => {
    switch (type) {
      case 'command': return 'text-warning';
      case 'success': return 'text-success';
      case 'error': return 'text-danger';
      case 'warning': return 'text-warning';
      case 'info': return 'text-info';
      default: return 'text-success';
    }
  };

  const toggle = (tab) => {
    if (activeTab !== tab) setActiveTab(tab);
  };

  // Command presets organized by category
  const commandPresets = {
    vulnerabilities: [
      {
        icon: 'shield-check',
        title: 'Basic Vulnerability Scan',
        description: 'Standard vulnerability assessment scan',
        command: 'vuln-scan 192.168.1.0/24 --ports 80,443',
        color: 'primary'
      },
      {
        icon: 'alert-triangle',
        title: 'Comprehensive Vulnerability Scan',
        description: 'In-depth vulnerability assessment with all checks',
        command: 'vuln-scan 192.168.1.1 --checks all --comprehensive true',
        color: 'warning'
      },
      {
        icon: 'globe',
        title: 'Web Application Scan',
        description: 'Scan web applications for security vulnerabilities',
        command: 'web-scan https://example.com --checks all',
        color: 'info'
      },
      {
        icon: 'lock',
        title: 'Authenticated Vulnerability Scan',
        description: 'Vulnerability scan with authentication',
        command: 'auth-scan 192.168.1.1 --scan-type ssh --username admin',
        color: 'secondary'
      }
    ],
    discovery: [
      {
        icon: 'search',
        title: 'Quick Network Discovery',
        description: 'Discover assets on the network',
        command: 'asset-discovery 192.168.1.0/24 --methods network',
        color: 'success'
      },
      {
        icon: 'server',
        title: 'Comprehensive Port Scan',
        description: 'Detailed port scanning with service detection',
        command: 'port-scan 192.168.1.1 --ports 1-65535 --comprehensive true',
        color: 'primary'
      },
      {
        icon: 'cloud',
        title: 'Cloud Asset Discovery',
        description: 'Discover assets from cloud providers',
        command: 'asset-discovery aws --cloud-provider aws --cloud-services ec2,s3,rds',
        color: 'info'
      },
      {
        icon: 'activity',
        title: 'Service Detection Scan',
        description: 'Identify services running on target ports',
        command: 'server-scan 192.168.1.1 --service-detection --os-detection',
        color: 'dark'
      }
    ],
    audit: [
      {
        icon: 'check-circle',
        title: 'NIST 800-53 Compliance',
        description: 'Check compliance against NIST 800-53 framework',
        command: 'compliance-scan 192.168.1.1 --frameworks nist-800-53',
        color: 'danger'
      },
      {
        icon: 'shield',
        title: 'PCI DSS Compliance',
        description: 'Assess PCI DSS compliance requirements',
        command: 'compliance-scan 192.168.1.1 --frameworks pci-dss',
        color: 'warning'
      },
      {
        icon: 'settings',
        title: 'Server Configuration Audit',
        description: 'Audit server configuration for security',
        command: 'server-scan 192.168.1.1 --comprehensive true --scan-title "Security Audit"',
        color: 'secondary'
      },
      {
        icon: 'eye',
        title: 'Internal Security Scan',
        description: 'Internal security scanning for secure environments',
        command: 'internal-scan --scanTypes configuration,compliance,patch-detection',
        color: 'success'
      }
    ],
    containers: [
      {
        icon: 'box',
        title: 'Docker Image Vulnerability Scan',
        description: 'Scan Docker image for security vulnerabilities',
        command: 'container-scan nginx:latest --checks image-vulnerabilities --severity medium',
        color: 'primary'
      },
      {
        icon: 'shield',
        title: 'Comprehensive Container Scan',
        description: 'Full container security assessment with all checks',
        command: 'container-scan myapp:v1.0 --comprehensive true --checks all',
        color: 'warning'
      },
      {
        icon: 'file-text',
        title: 'Dockerfile Security Analysis',
        description: 'Analyze Dockerfile for security best practices',
        command: 'container-scan ./Dockerfile --checks dockerfile-security,secrets-detection',
        color: 'info'
      },
      {
        icon: 'layers',
        title: 'Kubernetes Cluster Scan',
        description: 'Security scan of Kubernetes cluster and workloads',
        command: 'container-scan k8s://default --checks kubernetes-scan,compliance-checks',
        color: 'success'
      },
      {
        icon: 'database',
        title: 'Container Registry Scan',
        description: 'Scan container registry for vulnerabilities',
        command: 'container-scan registry://harbor.company.com --checks registry-scan,image-vulnerabilities',
        color: 'secondary'
      },
      {
        icon: 'activity',
        title: 'Runtime Container Security',
        description: 'Monitor running container for security issues',
        command: 'container-scan container://myapp-prod --checks runtime-security,container-config',
        color: 'danger'
      }
    ]
  };

  return (
    <React.Fragment>
      <Head title="Scan Terminal" />
      <Content>
        <BlockHead size="sm">
          <BlockBetween>
            <BlockHeadContent>
              <BlockTitle page>Scanner Terminal</BlockTitle>
              <BlockDes className="text-soft">
                Welcome to the Scan Terminal! You can run scanner commands directly from this interface.
              </BlockDes>
            </BlockHeadContent>
            <BlockHeadContent>
              <div className="toggle-wrap nk-block-tools-toggle">
                <Button
                  className="btn-icon btn-trigger toggle-expand me-n1"
                  color="transparent"
                >
                  <Icon name="menu-alt-r"></Icon>
                </Button>
                <div className="toggle-expand-content">
                  <ul className="nk-block-tools g-3">
                    <li>
                      <Button color="primary" onClick={copyTerminal}>
                        <Icon name="copy" />
                        <span>Copy</span>
                      </Button>
                    </li>
                    <li>
                      <Button color="gray" onClick={clearTerminal}>
                        <Icon name="trash" />
                        <span>Clear</span>
                      </Button>
                    </li>
                  </ul>
                </div>
              </div>
            </BlockHeadContent>
          </BlockBetween>
        </BlockHead>

        {/* Terminal Interface */}
        <Block>
          <Row className="g-gs">
            <Col xxl="12">
              <Card className="card-bordered">
                <div className="card-inner-group">
                  <div className="card-inner">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <Icon name="terminal" className="me-2" />
                        <h6 className="mb-0">Scanner Terminal</h6>
                        {isRunning && <Badge color="danger" className="ms-2">Running</Badge>}
                        {!isRunning && <Badge color="success" className="ms-2">Ready</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="card-inner">
                    {/* Terminal Output */}
                    <div
                      ref={terminalRef}
                      className="terminal-output p-3 rounded"
                      style={{
                        minHeight: '400px',
                        maxHeight: '500px',
                        overflowY: 'auto'
                      }}
                    >
                      {terminalOutput.map((line, index) => (
                        <div key={index} className={`mb-1 ${getLineColor(line.type)}`}>
                          {line.type === 'command' && (
                            <span className="text-warning">scanner@terminal:~$ </span>
                          )}
                          {line.text}
                          {line.timestamp && (
                            <span className="text-muted small ms-2">
                              [{line.timestamp.toLocaleTimeString()}]
                            </span>
                          )}
                        </div>
                      ))}
                      {isRunning && (
                        <div className="d-flex align-items-center text-warning">
                          <span>scanner@terminal:~$ </span>
                          <span className="ms-2 blink">█</span>
                        </div>
                      )}
                      {!isRunning && (
                        <div className="d-flex align-items-center text-warning">
                          <span>scanner@terminal:~$ </span>
                          <span className="ms-2 bg-secondary text-white px-1 blink">|</span>
                        </div>
                      )}
                    </div>

                    {/* Command Input */}
                    <div className="d-flex gap-2 mt-3">
                      <input
                        type="text"
                        value={currentCommand}
                        onChange={(e) => setCurrentCommand(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !isRunning && runCommand()}
                        placeholder="Enter scanner command (e.g., vuln-scan 192.168.1.1 --ports 80,443)"
                        className="form-control terminal-input"
                        disabled={isRunning}
                      />
                      <Button
                        color="success"
                        onClick={runCommand}
                        disabled={isRunning || !currentCommand.trim()}
                      >
                        <Icon name="play" className="me-1" />
                        Run
                      </Button>
                      <Button
                        color="danger"
                        onClick={stopScan}
                        disabled={!isRunning}
                      >
                        <Icon name="stop" className="me-1" />
                        Stop
                      </Button>
                      <Button
                        color="gray"
                        onClick={clearTerminal}
                      >
                        <Icon name="reload" className="me-1" />
                        Clear
                      </Button>
                    </div>

                    {/* Save Output Options */}
                    <div className="d-flex align-items-center gap-3 mt-3 p-3 bg-light rounded">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          id="save-output"
                          className="form-check-input"
                          checked={saveToFile}
                          onChange={(e) => setSaveToFile(e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="save-output">
                          Save output to file
                        </label>
                      </div>
                      {saveToFile && (
                        <>
                          <input
                            type="text"
                            value={outputFilename}
                            onChange={(e) => setOutputFilename(e.target.value)}
                            placeholder="filename.txt"
                            className="form-control form-control-sm"
                            style={{ width: '200px' }}
                          />
                          <span className="text-muted">for command history</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </Block>

        {/* Command Presets */}
        <Block>
          <Row className="g-gs">
            <Col xxl="12">
              <Card className="card-bordered">
                <div className="card-inner-group">
                  <div className="card-inner">
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">Command Presets</h6>
                      <small className="text-soft">Select a preset command to run predefined scans</small>
                    </div>
                  </div>
                  <div className="card-inner">
                    <Nav tabs>
                      <NavItem>
                        <NavLink
                          className={activeTab === '1' ? 'active' : ''}
                          onClick={() => toggle('1')}
                          style={{ cursor: 'pointer' }}
                        >
                          <Icon name="shield-check" className="me-1" />
                          Vulnerabilities
                        </NavLink>
                      </NavItem>
                      <NavItem>
                        <NavLink
                          className={activeTab === '2' ? 'active' : ''}
                          onClick={() => toggle('2')}
                          style={{ cursor: 'pointer' }}
                        >
                          <Icon name="search" className="me-1" />
                          Discovery
                        </NavLink>
                      </NavItem>
                      <NavItem>
                        <NavLink
                          className={activeTab === '3' ? 'active' : ''}
                          onClick={() => toggle('3')}
                          style={{ cursor: 'pointer' }}
                        >
                          <Icon name="check-circle" className="me-1" />
                          Audit
                        </NavLink>
                      </NavItem>
                      <NavItem>
                        <NavLink
                          className={activeTab === '4' ? 'active' : ''}
                          onClick={() => toggle('4')}
                          style={{ cursor: 'pointer' }}
                        >
                          <Icon name="box" className="me-1" />
                          Containers
                        </NavLink>
                      </NavItem>
                    </Nav>

                    <TabContent activeTab={activeTab} className="mt-4">
                      <TabPane tabId="1">
                        <Row className="g-3">
                          {commandPresets.vulnerabilities.map((preset, index) => (
                            <Col key={index} sm="6" lg="3">
                              <Card className="card-bordered h-100 preset-card">
                                <div className="card-inner text-center">
                                  <div className={`icon-circle icon-circle-lg bg-${preset.color}-dim mb-3`}>
                                    <Icon name={preset.icon} className={`text-${preset.color}`} />
                                  </div>
                                  <h6 className="mb-2">{preset.title}</h6>
                                  <p className="text-soft small mb-3">{preset.description}</p>
                                  <code className="small text-muted d-block mb-3" style={{ fontSize: '11px' }}>
                                    {preset.command}
                                  </code>
                                  <Button
                                    color={preset.color}
                                    size="sm"
                                    onClick={() => executePreset(preset.command)}
                                    disabled={isRunning}
                                  >
                                    <Icon name="play" className="me-1" />
                                    Run Scan
                                  </Button>
                                </div>
                              </Card>
                            </Col>
                          ))}
                        </Row>
                      </TabPane>

                      <TabPane tabId="2">
                        <Row className="g-3">
                          {commandPresets.discovery.map((preset, index) => (
                            <Col key={index} sm="6" lg="3">
                              <Card className="card-bordered h-100 preset-card">
                                <div className="card-inner text-center">
                                  <div className={`icon-circle icon-circle-lg bg-${preset.color}-dim mb-3`}>
                                    <Icon name={preset.icon} className={`text-${preset.color}`} />
                                  </div>
                                  <h6 className="mb-2">{preset.title}</h6>
                                  <p className="text-soft small mb-3">{preset.description}</p>
                                  <code className="small text-muted d-block mb-3" style={{ fontSize: '11px' }}>
                                    {preset.command}
                                  </code>
                                  <Button
                                    color={preset.color}
                                    size="sm"
                                    onClick={() => executePreset(preset.command)}
                                    disabled={isRunning}
                                  >
                                    <Icon name="play" className="me-1" />
                                    Run Scan
                                  </Button>
                                </div>
                              </Card>
                            </Col>
                          ))}
                        </Row>
                      </TabPane>

                      <TabPane tabId="3">
                        <Row className="g-3">
                          {commandPresets.audit.map((preset, index) => (
                            <Col key={index} sm="6" lg="3">
                              <Card className="card-bordered h-100 preset-card">
                                <div className="card-inner text-center">
                                  <div className={`icon-circle icon-circle-lg bg-${preset.color}-dim mb-3`}>
                                    <Icon name={preset.icon} className={`text-${preset.color}`} />
                                  </div>
                                  <h6 className="mb-2">{preset.title}</h6>
                                  <p className="text-soft small mb-3">{preset.description}</p>
                                  <code className="small text-muted d-block mb-3" style={{ fontSize: '11px' }}>
                                    {preset.command}
                                  </code>
                                  <Button
                                    color={preset.color}
                                    size="sm"
                                    onClick={() => executePreset(preset.command)}
                                    disabled={isRunning}
                                  >
                                    <Icon name="play" className="me-1" />
                                    Run Scan
                                  </Button>
                                </div>
                              </Card>
                            </Col>
                          ))}
                        </Row>
                      </TabPane>

                      <TabPane tabId="4">
                        <Row className="g-3">
                          {commandPresets.containers.map((preset, index) => (
                            <Col key={index} sm="6" lg="3">
                              <Card className="card-bordered h-100 preset-card">
                                <div className="card-inner text-center">
                                  <div className={`icon-circle icon-circle-lg bg-${preset.color}-dim mb-3`}>
                                    <Icon name={preset.icon} className={`text-${preset.color}`} />
                                  </div>
                                  <h6 className="mb-2">{preset.title}</h6>
                                  <p className="text-soft small mb-3">{preset.description}</p>
                                  <code className="small text-muted d-block mb-3" style={{ fontSize: '11px' }}>
                                    {preset.command}
                                  </code>
                                  <Button
                                    color={preset.color}
                                    size="sm"
                                    onClick={() => executePreset(preset.command)}
                                    disabled={isRunning}
                                  >
                                    <Icon name="play" className="me-1" />
                                    Run Scan
                                  </Button>
                                </div>
                              </Card>
                            </Col>
                          ))}
                        </Row>
                      </TabPane>
                    </TabContent>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </Block>

        {/* Documentation */}
        <Block>
          <Row className="g-gs">
            <Col xxl="12">
              <Card className="card-bordered">
                <div className="card-inner-group">
                  <div className="card-inner">
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">Documentation</h6>
                    </div>
                  </div>
                  <div className="card-inner">
                    <Nav tabs>
                      <NavItem>
                        <NavLink
                          className={activeTab === '5' ? 'active' : ''}
                          onClick={() => setActiveTab('5')}
                          style={{ cursor: 'pointer' }}
                        >
                          <Icon name="book" className="me-1" />
                          Overview
                        </NavLink>
                      </NavItem>
                      <NavItem>
                        <NavLink
                          className={activeTab === '6' ? 'active' : ''}
                          onClick={() => setActiveTab('6')}
                          style={{ cursor: 'pointer' }}
                        >
                          <Icon name="cmd" className="me-1" />
                          Commands
                        </NavLink>
                      </NavItem>
                      <NavItem>
                        <NavLink
                          className={activeTab === '7' ? 'active' : ''}
                          onClick={() => setActiveTab('7')}
                          style={{ cursor: 'pointer' }}
                        >
                          <Icon name="list" className="me-1" />
                          Examples
                        </NavLink>
                      </NavItem>
                    </Nav>

                    <TabContent activeTab={activeTab} className="mt-4">
                      <TabPane tabId="5">
                        <div className="row g-4">
                          <div className="col-md-6">
                            <h6>About Scanner</h6>
                            <p className="text-soft">
                              The scanner module provides comprehensive security scanning capabilities to identify vulnerabilities, misconfigurations, and compliance issues in your infrastructure.
                            </p>
                            <h6 className="mt-4">Features</h6>
                            <ul className="list-unstyled text-soft">
                              <li className="mb-1">• Network port scanning and service detection</li>
                              <li className="mb-1">• Vulnerability scanning with CVE correlation</li>
                              <li className="mb-1">• Web application security assessment</li>
                              <li className="mb-1">• Server configuration analysis</li>
                              <li className="mb-1">• Compliance checking against standards</li>
                              <li className="mb-1">• AWS/Cloud security auditing</li>
                            </ul>
                          </div>
                          <div className="col-md-6">
                            <h6>Getting Started</h6>
                            <p className="text-soft">
                              Use the command presets above for quick scans, or type commands directly in the terminal. All scan results are automatically saved and can be exported.
                            </p>
                            <h6 className="mt-4">Command Structure</h6>
                            <code className="d-block p-2 bg-light rounded small">
                              scanner-command &lt;target&gt; [options]
                            </code>
                            <p className="text-soft small mt-2">
                              Replace &lt;target&gt; with IP address, hostname, or URL. Use --help with any command for detailed options.
                            </p>
                          </div>
                        </div>
                      </TabPane>

                      <TabPane tabId="6">
                        <div className="row g-4">
                          <div className="col-md-6">
                            <h6>Available Commands</h6>
                            <div className="list-group list-group-flush">
                              <div className="list-group-item d-flex justify-content-between">
                                <code>port-scan</code>
                                <small className="text-soft">Scan for open ports</small>
                              </div>
                              <div className="list-group-item d-flex justify-content-between">
                                <code>vuln-scan</code>
                                <small className="text-soft">Vulnerability assessment</small>
                              </div>
                              <div className="list-group-item d-flex justify-content-between">
                                <code>web-scan</code>
                                <small className="text-soft">Web application scan</small>
                              </div>
                              <div className="list-group-item d-flex justify-content-between">
                                <code>server-scan</code>
                                <small className="text-soft">Server information gathering</small>
                              </div>
                              <div className="list-group-item d-flex justify-content-between">
                                <code>compliance-scan</code>
                                <small className="text-soft">Compliance assessment</small>
                              </div>
                              <div className="list-group-item d-flex justify-content-between">
                                <code>auth-scan</code>
                                <small className="text-soft">Authenticated scanning</small>
                              </div>
                              <div className="list-group-item d-flex justify-content-between">
                                <code>container-scan</code>
                                <small className="text-soft">Container security scanning</small>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <h6>Common Options</h6>
                            <div className="list-group list-group-flush">
                              <div className="list-group-item">
                                <code>--ports &lt;range&gt;</code>
                                <small className="d-block text-soft">Specify port range (e.g., 80,443 or 1-1000)</small>
                              </div>
                              <div className="list-group-item">
                                <code>--timeout &lt;ms&gt;</code>
                                <small className="d-block text-soft">Set operation timeout in milliseconds</small>
                              </div>
                              <div className="list-group-item">
                                <code>--output &lt;file&gt;</code>
                                <small className="d-block text-soft">Save results to specified file</small>
                              </div>
                              <div className="list-group-item">
                                <code>--format &lt;type&gt;</code>
                                <small className="d-block text-soft">Output format (json, csv)</small>
                              </div>
                              <div className="list-group-item">
                                <code>--comprehensive</code>
                                <small className="d-block text-soft">Enable comprehensive reporting</small>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabPane>

                      <TabPane tabId="7">
                        <h6>Example Commands</h6>
                        <div className="row g-3">
                          <div className="col-12">
                            <div className="bg-light p-3 rounded">
                              <h6 className="small mb-2">Basic Port Scan</h6>
                              <code>port-scan 192.168.1.1 --ports 1-1000</code>
                            </div>
                          </div>
                          <div className="col-12">
                            <div className="bg-light p-3 rounded">
                              <h6 className="small mb-2">Vulnerability Scan with Output</h6>
                              <code>vuln-scan 192.168.1.0/24 --output vuln-results.json --comprehensive true</code>
                            </div>
                          </div>
                          <div className="col-12">
                            <div className="bg-light p-3 rounded">
                              <h6 className="small mb-2">Web Application Security Scan</h6>
                              <code>web-scan https://example.com --checks all --max-depth 3</code>
                            </div>
                          </div>
                          <div className="col-12">
                            <div className="bg-light p-3 rounded">
                              <h6 className="small mb-2">Compliance Assessment</h6>
                              <code>compliance-scan 192.168.1.1 --frameworks nist-800-53,pci-dss</code>
                            </div>
                          </div>
                          <div className="col-12">
                            <div className="bg-light p-3 rounded">
                              <h6 className="small mb-2">Container Image Vulnerability Scan</h6>
                              <code>container-scan nginx:latest --checks image-vulnerabilities --severity medium</code>
                            </div>
                          </div>
                          <div className="col-12">
                            <div className="bg-light p-3 rounded">
                              <h6 className="small mb-2">Kubernetes Security Scan</h6>
                              <code>container-scan k8s://default --checks kubernetes-scan,compliance-checks</code>
                            </div>
                          </div>
                        </div>
                      </TabPane>
                    </TabContent>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </Block>
      </Content>
    </React.Fragment>
  );
};

export default ScanTerminal;
