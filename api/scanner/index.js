#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const { version } = require('./package.json');
const logger = require('./lib/utils/logger');

// Command handlers
const portScan = require('./commands/port-scan');
const ipScan = require('./commands/ip-scan');
const serverScan = require('./commands/server-scan');
const vulnerabilityScan = require('./commands/vulnerability-scan');
const awsScan = require('./commands/aws-scan');
const authScan = require('./commands/auth-scan');
const complianceScan = require('./commands/compliance-scan');
const webScan = require('./commands/web-scan');
const internalScan = require('./commands/internal-scan');
const containerScan = require('./commands/container-scan');
const assetDiscovery = require('./commands/asset-discovery');

const program = new Command();

// Set up CLI program
program
  .name('vulscan')
  .description('A network and security scanning tool for vulnerability management')
  .version(version);

// Port scanning command
program
  .command('port-scan')
  .description('Scan for open ports on a target host')
  .argument('<target>', 'Target host to scan (IP or hostname)')
  .option('-p, --ports <ports>', 'Port range to scan (e.g., 22,80,443 or 1-1000)', '1-1000')
  .option('-t, --timeout <timeout>', 'Connection timeout in ms', '2000')
  .option('-c, --concurrent <concurrency>', 'Maximum concurrent connections', '100')
  .option('-o, --output <filename>', 'Output filename for results')
  .option('--format <format>', 'Output format (json or csv)', 'json')
  .option('--comprehensive <boolean>', 'Use comprehensive report format in JSON output', 'false')
  .option('--scan-title <title>', 'Custom title for the scan (used in comprehensive format)')
  .action(portScan);

// IP scanning command
program
  .command('ip-scan')
  .description('Scan a range of IP addresses')
  .argument('<cidr>', 'CIDR notation to specify IP range (e.g., 192.168.1.0/24)')
  .option('-p, --ping', 'Ping hosts to check if they are alive')
  .option('-t, --timeout <timeout>', 'Timeout in ms for each scan operation', '2000')
  .option('-c, --concurrent <concurrency>', 'Maximum concurrent operations', '50')
  .option('-o, --output <filename>', 'Output filename for results')
  .option('--format <format>', 'Output format (json or csv)', 'json')
  .option('--comprehensive <boolean>', 'Use comprehensive report format in JSON output', 'false')
  .option('--scan-title <title>', 'Custom title for the scan (used in comprehensive format)')
  .action(ipScan);

// Server scanning command
program
  .command('server-scan')
  .description('Gather information about a server')
  .argument('<target>', 'Target server to scan (IP or hostname)')
  .option('-p, --ports <ports>', 'Port range to scan', '1-1000')
  .option('--service-detection', 'Attempt to detect services running on open ports')
  .option('--os-detection', 'Attempt to detect the operating system')
  .option('-t, --timeout <timeout>', 'Operation timeout in ms', '5000')
  .option('-o, --output <filename>', 'Output filename for results')
  .option('--format <format>', 'Output format (json or csv)', 'json')
  .option('--comprehensive <boolean>', 'Use comprehensive report format in JSON output', 'false')
  .option('--scan-title <title>', 'Custom title for the scan (used in comprehensive format)')
  .action(serverScan);

// Vulnerability scanning command
program
  .command('vuln-scan')
  .description('Scan for common vulnerabilities')
  .argument('<target>', 'Target to scan (IP or hostname)')
  .option('-p, --ports <ports>', 'Port range to scan for vulnerabilities', '1-1000')
  .option('--checks <checks>', 'Comma-separated list of vulnerability checks to run', 'all')
  .option('-t, --timeout <timeout>', 'Operation timeout in ms', '10000')
  .option('-o, --output <filename>', 'Output filename for results')
  .option('--format <format>', 'Output format (json or csv)', 'json')
  .option('--comprehensive <boolean>', 'Use comprehensive report format in JSON output', 'false')
  .option('--scan-title <title>', 'Custom title for the scan (used in comprehensive format)')
  .action(vulnerabilityScan);

// AWS scanning command
program
  .command('aws-scan')
  .description('Scan AWS resources for security issues')
  .option('--region <region>', 'AWS region to scan', 'us-east-1')
  .option('--services <services>', 'Comma-separated list of services to scan', 'ec2,s3,iam,rds')
  .option('-o, --output <filename>', 'Output filename for results')
  .option('--format <format>', 'Output format (json or csv)', 'json')
  .option('--comprehensive <boolean>', 'Use comprehensive report format in JSON output', 'false')
  .option('--scan-title <title>', 'Custom title for the scan (used in comprehensive format)')
  .action(awsScan);

// Authenticated scanning command
program
  .command('auth-scan')
  .description('Perform authenticated scanning with credentials')
  .argument('<target>', 'Target to scan (IP or hostname)')
  .option('--scan-type <type>', 'Type of authenticated scan (ssh, web, database)', 'ssh')
  .option('-p, --port <port>', 'Port to connect to (default depends on scan type)')
  .option('-u, --username <username>', 'Username for authentication')
  .option('-P, --password <password>', 'Password for authentication')
  .option('-k, --key-file <file>', 'SSH key file for authentication')
  .option('--credentials-file <file>', 'JSON file containing credential objects')
  .option('--login-path <path>', 'Path to login page for web authentication', '/login')
  .option('--username-field <field>', 'Form field name for username in web authentication', 'username')
  .option('--password-field <field>', 'Form field name for password in web authentication', 'password')
  .option('--crawl-depth <depth>', 'Depth for web crawler in web scan', '1')
  .option('--form-scan <boolean>', 'Enable/disable form scanning in web scan', 'true')
  .option('--db-type <type>', 'Database type for database scan', 'mysql')
  .option('--database <name>', 'Database name for database scan')
  .option('-t, --timeout <timeout>', 'Operation timeout in ms', '10000')
  .option('-o, --output <filename>', 'Output filename for results')
  .option('--format <format>', 'Output format (json or csv)', 'json')
  .option('--comprehensive <boolean>', 'Use comprehensive report format in JSON output', 'false')
  .option('--scan-title <title>', 'Custom title for the scan (used in comprehensive format)')
  .action(authScan);

// Compliance scanning command
program
  .command('compliance-scan')
  .description('Assess compliance with security standards and frameworks')
  .argument('<target>', 'Target to scan (IP or hostname)')
  .option('--frameworks <frameworks>', 'Comma-separated list of compliance frameworks (pci-dss,hipaa,nist-800-53,gdpr,iso27001)')
  .option('-p, --ports <ports>', 'Port range to scan', '21,22,23,25,53,80,110,143,443,445,3306,3389,5432,8080,8443')
  .option('-u, --username <username>', 'Username for authenticated scans')
  .option('-P, --password <password>', 'Password for authenticated scans')
  .option('-k, --key-file <file>', 'SSH key file for authentication')
  .option('--auth-type <type>', 'Type of authentication (ssh, web, database)', 'ssh')
  .option('--credentials-file <file>', 'JSON file containing credential objects')
  .option('--db-type <type>', 'Database type for database authentication', 'mysql')
  .option('--database <name>', 'Database name for database authentication')
  .option('--username-field <field>', 'Form field name for username in web authentication', 'username')
  .option('--password-field <field>', 'Form field name for password in web authentication', 'password')
  .option('-t, --timeout <timeout>', 'Operation timeout in ms', '30000')
  .option('-o, --output <filename>', 'Output filename for results')
  .option('--format <format>', 'Output format (json or csv)', 'json')
  .option('--comprehensive <boolean>', 'Use comprehensive report format in JSON output', 'false')
  .option('--scan-title <title>', 'Custom title for the scan (used in comprehensive format)')
  .action(complianceScan);

// Web application scanning command
program
  .command('web-scan')
  .description('Scan a web application for security vulnerabilities')
  .argument('<target>', 'Target URL to scan')
  .option('--checks <checks>', 'Comma-separated list of security checks to run, or "all"', 'all')
  .option('--no-crawl', 'Disable crawling the site')
  .option('--max-depth <depth>', 'Maximum crawl depth', '3')
  .option('--max-pages <pages>', 'Maximum pages to crawl', '100')
  .option('--user-agent <ua>', 'User agent string to use')
  .option('--form-analysis <boolean>', 'Enable/disable form analysis', 'true')
  .option('-u, --username <username>', 'Username for form authentication')
  .option('-P, --password <password>', 'Password for form authentication')
  .option('--basic-auth <credentials>', 'Basic auth credentials (username:password)')
  .option('--login-url <url>', 'URL of the login page')
  .option('--username-field <field>', 'Form field name for username', 'username')
  .option('--password-field <field>', 'Form field name for password', 'password')
  .option('--credentials-file <file>', 'JSON file containing web credentials')
  .option('-t, --timeout <timeout>', 'Operation timeout in ms', '10000')
  .option('-o, --output <filename>', 'Output filename for results')
  .option('--format <format>', 'Output format (json or csv)', 'json')
  .option('--comprehensive <boolean>', 'Use comprehensive report format in JSON output', 'false')
  .option('--scan-title <title>', 'Custom title for the scan (used in comprehensive format)')
  .action(webScan);

// Internal scanning command (for secure government environments)
program
  .command('internal-scan')
  .description('Perform internal security scanning for secure environments (offline mode)')
  .option('--scanTypes <types>', 'Comma-separated list of scan types', 'configuration,compliance,patch-detection')
  .option('--framework <framework>', 'Compliance framework to check against', 'nist-800-53')
  .option('--offline <boolean>', 'Run in complete offline mode with no external connections', 'true')
  .option('--list-frameworks', 'List available compliance frameworks')
  .option('--user <user>', 'User performing the scan (for audit logs)')
  .option('-t, --timeout <timeout>', 'Operation timeout in ms', '30000')
  .option('-o, --output <filename>', 'Output filename for results')
  .option('--format <format>', 'Output format (json or csv)', 'json')
  .option('--comprehensive <boolean>', 'Use comprehensive report format in JSON output', 'true')
  .option('--scan-title <title>', 'Custom title for the scan (used in comprehensive format)')
  .action(internalScan);

// Container scanning command
program
  .command('container-scan <target>')
  .description('Perform container security scanning on Docker images, containers, or Kubernetes')
  .option('--checks <checks>', 'Comma-separated list of checks to run', 'image-vulnerabilities,dockerfile-security,container-config')
  .option('--severity <severity>', 'Minimum severity level to report', 'medium')
  .option('--format <format>', 'Output format (json, table, sarif)', 'json')
  .option('--comprehensive <boolean>', 'Run comprehensive scan with all checks', 'false')
  .option('-o, --output <file>', 'Output file path')
  .option('-v, --verbose', 'Verbose output')
  .option('-t, --timeout <timeout>', 'Operation timeout in ms', '300000')
  .action(containerScan);

// Asset Discovery command
program
  .command('asset-discovery')
  .description('Discover assets on the network using multiple scanning methods')
  .argument('<target>', 'Target (CIDR notation, hostname, or domain)')
  .option('--methods <methods>', 'Comma-separated list of discovery methods to use (network,cloud,activedirectory,agent)', 'network')
  .option('--deep [depth]', 'Enable deep scanning with optional depth (true, false, or "full")', false)
  .option('-t, --timeout <timeout>', 'Operation timeout in ms', '5000')
  .option('-c, --concurrent <concurrency>', 'Maximum concurrent operations', '50')
  // Cloud discovery options
  .option('--cloud-provider <provider>', 'Cloud provider (aws, azure, gcp)', 'aws')
  .option('--cloud-credentials <json>', 'JSON string with cloud provider credentials')
  .option('--cloud-region <region>', 'Cloud region to scan', 'us-east-1')
  .option('--cloud-project <project>', 'Cloud project ID (for GCP)')
  .option('--cloud-services <services>', 'Comma-separated list of cloud services to discover', 'ec2,s3,rds,lambda')
  // Active Directory options
  .option('--ad-server <server>', 'Active Directory server URL', 'ldap://localhost')
  .option('--ad-base-dn <baseDN>', 'Base DN for Active Directory', 'DC=example,DC=com')
  .option('--ad-username <username>', 'Username for Active Directory authentication')
  .option('--ad-password <password>', 'Password for Active Directory authentication')
  .option('--ad-use-tls <boolean>', 'Use TLS for Active Directory connection', 'false')
  .option('--ad-computer-ou <ou>', 'Organizational Unit for computer objects')
  .option('--ad-server-ou <ou>', 'Organizational Unit for server objects')
  // Agent-based discovery options
  .option('--agent-api-url <url>', 'URL for agent API endpoint', 'https://agents.example.com/api')
  .option('--agent-api-key <key>', 'API key for agent API authentication')
  .option('--agent-org-id <id>', 'Organization ID for filtering agent data')
  // Output options
  .option('-o, --output <filename>', 'Output filename for results')
  .option('--format <format>', 'Output format (json or csv)', 'json')
  .option('--comprehensive <boolean>', 'Use comprehensive report format in JSON output', 'true')
  .option('--scan-title <title>', 'Custom title for the scan')
  .action(assetDiscovery);

// Error handling for invalid commands
program.on('command:*', function () {
  console.error(chalk.red(`Invalid command: ${program.args.join(' ')}`));
  console.error(chalk.yellow('See --help for a list of available commands.'));
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

program.parse(process.argv);

// Display help if no arguments provided
if (program.args.length === 0) {
  program.help();
}
