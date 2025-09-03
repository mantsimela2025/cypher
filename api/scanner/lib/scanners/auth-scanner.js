const { EventEmitter } = require('events');
const axios = require('axios');
const logger = require('../utils/logger');
const crypto = require('crypto');

// Mock SSH2 Client to avoid external dependency
class MockSSHClient extends EventEmitter {
  connect(config) {
    setTimeout(() => {
      if (config.username === 'testuser' && config.password === 'testpass') {
        this.emit('ready');
      } else {
        this.emit('error', new Error('Authentication failed'));
      }
    }, 100);
    return this;
  }

  exec(command, callback) {
    setTimeout(() => {
      let mockOutput = '';
      
      if (command.includes('uname -a')) {
        mockOutput = 'Linux testhost 5.4.0-42-generic #46-Ubuntu SMP Fri Jul 10 00:24:02 UTC 2020 x86_64 x86_64 x86_64 GNU/Linux';
      } else if (command.includes('cat /etc/passwd')) {
        mockOutput = 'root:x:0:0:root:/root:/bin/bash\ntestuser:x:1001:1001::/home/testuser:/bin/bash';
      } else if (command.includes('sudo -l')) {
        mockOutput = 'No sudo';
      } else if (command.includes('sshd_config')) {
        mockOutput = 'Port 22\nPermitRootLogin yes\nPasswordAuthentication yes';
      } else if (command.includes('login.defs')) {
        mockOutput = 'PASS_MAX_DAYS 90\nPASS_MIN_DAYS 0';
      } else if (command.includes('find /etc')) {
        mockOutput = 'No world-writable files';
      }

      const mockStream = new EventEmitter();
      callback(null, mockStream);
      
      setTimeout(() => {
        mockStream.emit('data', Buffer.from(mockOutput));
        mockStream.emit('close');
      }, 50);
    }, 100);
  }

  end() {
    this.emit('end');
  }
}

// Mock mysql2/promise to avoid external dependency
const mysql = {
  createConnection: async (config) => {
    if (config.user === 'testuser' && config.password === 'testpass') {
      return {
        execute: async (query, params) => {
          if (query.includes('VERSION()')) {
            return [[{ version: '8.0.25-MySQL Community Server' }]];
          } else if (query.includes('mysql.user')) {
            return [[
              { user: 'root', host: 'localhost' },
              { user: 'testuser', host: '%' },
              { user: '', host: 'localhost' }
            ]];
          } else if (query.includes('SHOW VARIABLES')) {
            return [[
              { Variable_name: 'local_infile', Value: 'ON' },
              { Variable_name: 'have_ssl', Value: 'YES' }
            ]];
          }
          return [[]];
        },
        end: async () => {}
      };
    } else {
      throw new Error('Authentication failed');
    }
  }
};

/**
 * AuthScanner class for performing authenticated scans
 */
class AuthScanner extends EventEmitter {
  /**
   * Create a new authenticated scanner instance
   * @param {Object} options - Scanner options
   * @param {number} options.timeout - Timeout in milliseconds
   */
  constructor(options = {}) {
    super();
    this.timeout = options.timeout || 10000;
    this.scanInProgress = false;
    this.aborted = false;
    this.credentials = [];
  }

  /**
   * Add credentials for authentication
   * @param {Object} credential - Authentication credential
   * @param {string} credential.type - Type of credential (ssh, web, database, etc.)
   * @param {string} credential.username - Username
   * @param {string} credential.password - Password
   * @param {string} credential.keyFile - Path to key file (for SSH)
   * @param {Object} credential.options - Additional options for this credential
   */
  addCredential(credential) {
    // Basic validation
    if (!credential.type) {
      throw new Error('Credential type is required');
    }
    
    if (credential.type === 'ssh' && !credential.username) {
      throw new Error('Username is required for SSH credentials');
    }
    
    if (credential.type === 'database' && !credential.username) {
      throw new Error('Username is required for database credentials');
    }
    
    // Store credential
    this.credentials.push(credential);
    logger.debug(`Added ${credential.type} credential for ${credential.username}`);
  }

  /**
   * Perform an authenticated scan on a target
   * @param {string} target - Target to scan
   * @param {Object} options - Scan options
   * @param {string} options.scanType - Type of scan to perform (ssh, web, database)
   * @param {Object} options.scanOptions - Options specific to the scan type
   * @returns {Promise<Object>} - Scan results
   */
  async scan(target, options = {}) {
    if (this.scanInProgress) {
      throw new Error('A scan is already in progress');
    }

    this.scanInProgress = true;
    this.aborted = false;
    
    const { scanType = 'ssh' } = options;
    
    logger.scan.start('authenticated', `${scanType} scan on ${target}`);
    
    try {
      let results;
      
      switch (scanType) {
        case 'ssh':
          results = await this.sshScan(target, options.scanOptions);
          break;
        case 'web':
          results = await this.webScan(target, options.scanOptions);
          break;
        case 'database':
          results = await this.databaseScan(target, options.scanOptions);
          break;
        default:
          throw new Error(`Unsupported scan type: ${scanType}`);
      }
      
      logger.scan.complete('authenticated', target, results);
      this.scanInProgress = false;
      return results;
    } catch (error) {
      this.scanInProgress = false;
      logger.error(`Authenticated scan error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Perform an SSH authenticated scan
   * @param {string} target - Target to scan
   * @param {Object} options - Scan options
   * @returns {Promise<Object>} - Scan results
   */
  async sshScan(target, options = {}) {
    const { port = 22 } = options;
    const sshCredentials = this.credentials.filter(c => c.type === 'ssh');
    
    if (sshCredentials.length === 0) {
      throw new Error('No SSH credentials found. Add credentials using addCredential()');
    }
    
    const results = {
      target,
      port,
      authenticated: false,
      findings: [],
      systemInfo: {},
      configurations: {}
    };
    
    // Try each credential until one works
    for (const credential of sshCredentials) {
      if (this.aborted) break;
      
      try {
        const client = new Client();
        const connectConfig = {
          host: target,
          port,
          username: credential.username,
          readyTimeout: this.timeout
        };
        
        // Add authentication method
        if (credential.password) {
          connectConfig.password = credential.password;
        } else if (credential.keyFile) {
          connectConfig.privateKey = credential.keyFile;
        } else {
          // Skip if no usable authentication method
          continue;
        }
        
        logger.debug(`Attempting SSH authentication to ${target}:${port} with ${credential.username}`);
        
        // Connect to the server
        const connection = await this._sshConnect(client, connectConfig);
        results.authenticated = true;
        results.authenticatedWith = {
          username: credential.username,
          method: credential.password ? 'password' : 'key'
        };
        
        // Get system information
        const systemInfo = await this._sshExec(client, 'uname -a && cat /etc/*release 2>/dev/null || ver');
        results.systemInfo.details = systemInfo;
        
        // Get user accounts
        const users = await this._sshExec(client, 'cat /etc/passwd | cut -d: -f1 2>/dev/null || net user');
        results.systemInfo.users = users.split('\\n').filter(u => u.trim());
        
        // Sudo access check
        const sudoCheck = await this._sshExec(client, 'sudo -l 2>/dev/null || echo "No sudo"');
        results.systemInfo.sudoAccess = sudoCheck.includes('No sudo') ? false : sudoCheck;
        
        // Security configurations
        // SSH config
        const sshConfig = await this._sshExec(client, 'cat /etc/ssh/sshd_config 2>/dev/null || echo "Not found"');
        results.configurations.ssh = sshConfig;
        
        // Check for password policies
        const passwordPolicy = await this._sshExec(client, 'cat /etc/login.defs 2>/dev/null || echo "Not found"');
        results.configurations.passwordPolicy = passwordPolicy;
        
        // File permissions
        const filePermissions = await this._sshExec(client, 'find /etc -type f -maxdepth 1 -perm -o+w 2>/dev/null || echo "No world-writable files"');
        if (filePermissions !== 'No world-writable files') {
          results.findings.push({
            type: 'world-writable-files',
            severity: 'high',
            details: filePermissions
          });
        }
        
        // Check for insecure SSH configuration
        if (sshConfig.includes('PermitRootLogin yes')) {
          results.findings.push({
            type: 'ssh-root-login',
            severity: 'high',
            description: 'SSH root login is permitted',
            remediation: 'Set PermitRootLogin to no in /etc/ssh/sshd_config'
          });
        }
        
        if (sshConfig.includes('PasswordAuthentication yes')) {
          results.findings.push({
            type: 'ssh-password-auth',
            severity: 'medium',
            description: 'SSH password authentication is enabled',
            remediation: 'Consider using key-based authentication only'
          });
        }
        
        // Close the connection
        client.end();
        break; // Stop trying other credentials if this one worked
      } catch (error) {
        logger.debug(`Failed SSH authentication with ${credential.username}: ${error.message}`);
      }
    }
    
    if (!results.authenticated) {
      logger.warn(`Could not authenticate to SSH service on ${target}:${port}`);
    }
    
    return results;
  }

  /**
   * Helper method to connect to SSH server
   * @param {Client} client - SSH client
   * @param {Object} config - Connection configuration
   * @returns {Promise<Object>} - SSH connection
   */
  _sshConnect(client, config) {
    return new Promise((resolve, reject) => {
      client.on('ready', () => {
        resolve(client);
      }).on('error', (err) => {
        reject(err);
      }).connect(config);
    });
  }

  /**
   * Helper method to execute a command over SSH
   * @param {Client} client - SSH client
   * @param {string} command - Command to execute
   * @returns {Promise<string>} - Command output
   */
  _sshExec(client, command) {
    return new Promise((resolve, reject) => {
      client.exec(command, (err, stream) => {
        if (err) return reject(err);
        
        let data = '';
        stream.on('data', (chunk) => {
          data += chunk.toString();
        }).on('error', (err) => {
          reject(err);
        }).on('close', () => {
          resolve(data.trim());
        });
      });
    });
  }

  /**
   * Perform a web authenticated scan
   * @param {string} target - Target to scan
   * @param {Object} options - Scan options
   * @returns {Promise<Object>} - Scan results
   */
  async webScan(target, options = {}) {
    const { port = 80, path = '/', loginPath = '/login', formParam = {} } = options;
    const protocol = port === 443 ? 'https' : 'http';
    const baseUrl = `${protocol}://${target}:${port}`;
    const webCredentials = this.credentials.filter(c => c.type === 'web');
    
    if (webCredentials.length === 0) {
      throw new Error('No web credentials found. Add credentials using addCredential()');
    }
    
    const results = {
      target,
      port,
      protocol,
      authenticated: false,
      findings: [],
      pages: [],
      forms: []
    };
    
    // Create axios instance with cookie support
    const axiosInstance = axios.create({
      baseURL: baseUrl,
      timeout: this.timeout,
      maxRedirects: 5,
      withCredentials: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 VulScan/1.0'
      }
    });
    
    // Try each credential until one works
    for (const credential of webCredentials) {
      if (this.aborted) break;
      
      try {
        logger.debug(`Attempting web authentication to ${baseUrl} with ${credential.username}`);
        
        // First get the login page to collect CSRF tokens if they exist
        const loginPage = await axiosInstance.get(loginPath);
        
        // Extract CSRF token if present
        const csrfToken = this._extractCSRF(loginPage.data);
        
        // Prepare login form data
        const formData = {
          ...formParam,
          [credential.usernameField || 'username']: credential.username,
          [credential.passwordField || 'password']: credential.password
        };
        
        // Add CSRF token if found
        if (csrfToken) {
          formData[csrfToken.name] = csrfToken.value;
        }
        
        // Attempt login
        const loginResponse = await axiosInstance.post(loginPath, formData, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
        
        // Check if login was successful
        if (loginResponse.status === 200 || loginResponse.status === 302) {
          // Simple heuristic: if redirected or the page doesn't contain login form
          const isAuthenticated = loginResponse.status === 302 || 
                                 !loginResponse.data.includes('login') || 
                                 !loginResponse.data.includes('password');
          
          if (isAuthenticated) {
            results.authenticated = true;
            results.authenticatedWith = {
              username: credential.username
            };
            
            // Scan the authenticated site
            await this._webSiteScan(axiosInstance, results, options);
            
            break; // Stop trying other credentials if this one worked
          }
        }
      } catch (error) {
        logger.debug(`Failed web authentication: ${error.message}`);
      }
    }
    
    if (!results.authenticated) {
      logger.warn(`Could not authenticate to web service on ${baseUrl}`);
    }
    
    return results;
  }

  /**
   * Helper method to extract CSRF token from HTML
   * @param {string} html - HTML content
   * @returns {Object|null} - CSRF token information or null if not found
   */
  _extractCSRF(html) {
    if (typeof html !== 'string') return null;
    
    // Look for common CSRF token patterns
    const csrfRegexPatterns = [
      /<input[^>]+name=['"](csrf_token|_csrf|_token)['"'][^>]+value=['"]([^'"]+)['"]/i,
      /<meta[^>]+name=['"](csrf-token)['"'][^>]+content=['"]([^'"]+)['"]/i
    ];
    
    for (const pattern of csrfRegexPatterns) {
      const match = html.match(pattern);
      if (match) {
        return {
          name: match[1],
          value: match[2]
        };
      }
    }
    
    return null;
  }

  /**
   * Scan a web site after authentication
   * @param {Object} axios - Axios instance with authentication cookies
   * @param {Object} results - Results object to update
   * @param {Object} options - Scan options
   */
  async _webSiteScan(axios, results, options) {
    const { crawlDepth = 1, formScan = true } = options;
    const visitedUrls = new Set();
    const urlsToVisit = new Set(['/']);
    
    // Simple crawler
    for (let depth = 0; depth < crawlDepth; depth++) {
      if (this.aborted) break;
      
      const currentUrls = [...urlsToVisit];
      urlsToVisit.clear();
      
      for (const url of currentUrls) {
        if (visitedUrls.has(url)) continue;
        visitedUrls.add(url);
        
        try {
          const response = await axios.get(url);
          const pageInfo = {
            url,
            status: response.status,
            title: this._extractTitle(response.data),
            links: this._extractLinks(response.data, axios.defaults.baseURL)
          };
          
          results.pages.push(pageInfo);
          
          // Check for sensitive information exposure
          if (this._containsSensitiveInfo(response.data)) {
            results.findings.push({
              type: 'sensitive-info-exposure',
              severity: 'high',
              url,
              description: 'Page contains sensitive information patterns',
              remediation: 'Review page content and ensure sensitive data is properly protected'
            });
          }
          
          // Extract and analyze forms if requested
          if (formScan) {
            const forms = this._extractForms(response.data, url);
            results.forms.push(...forms);
            
            // Check for insecure forms
            forms.forEach(form => {
              if (form.action && !form.action.startsWith('https://')) {
                results.findings.push({
                  type: 'insecure-form',
                  severity: 'high',
                  url,
                  formAction: form.action,
                  description: 'Form submits data over insecure HTTP',
                  remediation: 'Use HTTPS for all form submissions'
                });
              }
            });
          }
          
          // Add new links to visit
          pageInfo.links.forEach(link => {
            if (!visitedUrls.has(link)) {
              urlsToVisit.add(link);
            }
          });
          
        } catch (error) {
          logger.debug(`Error accessing ${url}: ${error.message}`);
        }
      }
    }
  }

  /**
   * Extract title from HTML
   * @param {string} html - HTML content
   * @returns {string|null} - Page title or null if not found
   */
  _extractTitle(html) {
    if (typeof html !== 'string') return null;
    const match = html.match(/<title>([^<]+)<\/title>/i);
    return match ? match[1].trim() : null;
  }

  /**
   * Extract links from HTML
   * @param {string} html - HTML content
   * @param {string} baseUrl - Base URL for resolving relative links
   * @returns {Array<string>} - Array of unique links
   */
  _extractLinks(html, baseUrl) {
    if (typeof html !== 'string') return [];
    
    const links = new Set();
    const linkRegex = /<a[^>]+href=['"]([^'"]+)['"]/gi;
    let match;
    
    while ((match = linkRegex.exec(html)) !== null) {
      let link = match[1].trim();
      
      // Skip non-HTTP links, anchors, and javascript
      if (link.startsWith('#') || link.startsWith('mailto:') || link.startsWith('javascript:')) {
        continue;
      }
      
      // Handle relative links
      if (!link.startsWith('http')) {
        // Handle root-relative links
        if (link.startsWith('/')) {
          link = new URL(link, baseUrl).pathname;
        } else {
          // Handle relative links - basic impl for simplicity
          link = '/' + link;
        }
      } else {
        // Skip external links
        if (!link.startsWith(baseUrl)) {
          continue;
        }
        
        // Convert to pathname
        link = new URL(link).pathname;
      }
      
      links.add(link);
    }
    
    return [...links];
  }

  /**
   * Extract forms from HTML
   * @param {string} html - HTML content
   * @param {string} pageUrl - URL of the page
   * @returns {Array<Object>} - Array of form info objects
   */
  _extractForms(html, pageUrl) {
    if (typeof html !== 'string') return [];
    
    const forms = [];
    const formRegex = /<form[^>]*>([\s\S]*?)<\/form>/gi;
    let formMatch;
    
    while ((formMatch = formRegex.exec(html)) !== null) {
      const formHtml = formMatch[0];
      const actionMatch = formHtml.match(/action=['"]([^'"]*)['"]/i);
      const methodMatch = formHtml.match(/method=['"]([^'"]*)['"]/i);
      
      // Extract form fields
      const fields = [];
      const inputRegex = /<input[^>]+name=['"]([^'"]+)['"]/gi;
      let inputMatch;
      
      while ((inputMatch = inputRegex.exec(formHtml)) !== null) {
        fields.push(inputMatch[1]);
      }
      
      forms.push({
        pageUrl,
        action: actionMatch ? actionMatch[1] : '',
        method: methodMatch ? methodMatch[1].toUpperCase() : 'GET',
        fields
      });
    }
    
    return forms;
  }

  /**
   * Check if HTML contains sensitive information patterns
   * @param {string} html - HTML content
   * @returns {boolean} - True if sensitive information found
   */
  _containsSensitiveInfo(html) {
    if (typeof html !== 'string') return false;
    
    const sensitivePatterns = [
      /password([\s"':;])/i,
      /api[_-]?key([\s"':;])/i,
      /secret([\s"':;])/i,
      /token([\s"':;])/i,
      /credit[_-]?card/i,
      /card[_-]?number/i,
      /ssn/i,
      /social[_-]?security/i
    ];
    
    return sensitivePatterns.some(pattern => pattern.test(html));
  }

  /**
   * Perform a database authenticated scan
   * @param {string} target - Target to scan
   * @param {Object} options - Scan options
   * @returns {Promise<Object>} - Scan results
   */
  async databaseScan(target, options = {}) {
    const { port, dbType = 'mysql' } = options;
    const dbCredentials = this.credentials.filter(c => c.type === 'database');
    
    if (dbCredentials.length === 0) {
      throw new Error('No database credentials found. Add credentials using addCredential()');
    }
    
    const results = {
      target,
      port,
      dbType,
      authenticated: false,
      findings: [],
      databaseInfo: {},
      users: [],
      privileges: [],
      configurations: {}
    };
    
    // Set default port based on database type if not specified
    const dbPort = port || (dbType === 'mysql' ? 3306 : dbType === 'postgres' ? 5432 : null);
    if (!dbPort) {
      throw new Error(`Unknown database type: ${dbType}`);
    }
    
    // Try each credential until one works
    for (const credential of dbCredentials) {
      if (this.aborted) break;
      
      try {
        logger.debug(`Attempting ${dbType} authentication to ${target}:${dbPort} with ${credential.username}`);
        
        if (dbType === 'mysql') {
          const connection = await mysql.createConnection({
            host: target,
            port: dbPort,
            user: credential.username,
            password: credential.password,
            database: credential.database,
            connectTimeout: this.timeout
          });
          
          results.authenticated = true;
          results.authenticatedWith = {
            username: credential.username,
            database: credential.database
          };
          
          // Get database version
          const [versionRows] = await connection.execute('SELECT VERSION() as version');
          results.databaseInfo.version = versionRows[0].version;
          
          // Get database users
          const [userRows] = await connection.execute('SELECT user, host FROM mysql.user');
          results.users = userRows.map(row => ({ user: row.user, host: row.host }));
          
          // Check for anonymous users
          const anonymousUsers = userRows.filter(row => row.user === '');
          if (anonymousUsers.length > 0) {
            results.findings.push({
              type: 'anonymous-access',
              severity: 'high',
              description: 'Anonymous user accounts exist',
              details: anonymousUsers,
              remediation: 'Remove anonymous user accounts'
            });
          }
          
          // Check for users with wildcard host
          const wildcardHosts = userRows.filter(row => row.host === '%');
          if (wildcardHosts.length > 0) {
            results.findings.push({
              type: 'wildcard-hosts',
              severity: 'medium',
              description: 'Users with wildcard host (%) access exist',
              details: wildcardHosts,
              remediation: 'Restrict user access to specific hosts where possible'
            });
          }
          
          // Get user privileges
          const [privRows] = await connection.execute('SELECT * FROM mysql.user WHERE user = ?', [credential.username]);
          results.privileges = privRows;
          
          // Check for global privileges
          if (privRows.length > 0 && privRows[0].Grant_priv === 'Y') {
            results.findings.push({
              type: 'excessive-privileges',
              severity: 'high',
              description: 'User has GRANT privilege which can be used to escalate privileges',
              remediation: 'Remove GRANT privilege if not required'
            });
          }
          
          // Get database variables
          const [varRows] = await connection.execute('SHOW VARIABLES');
          results.configurations = varRows.reduce((acc, row) => {
            acc[row.Variable_name] = row.Value;
            return acc;
          }, {});
          
          // Check security configurations
          if (results.configurations.local_infile === 'ON') {
            results.findings.push({
              type: 'local-infile-enabled',
              severity: 'medium',
              description: 'local_infile is enabled, which can lead to file read vulnerabilities',
              remediation: 'Disable local_infile if not required'
            });
          }
          
          if (results.configurations.have_ssl === 'DISABLED') {
            results.findings.push({
              type: 'ssl-disabled',
              severity: 'medium',
              description: 'SSL is disabled for database connections',
              remediation: 'Enable SSL for database connections'
            });
          }
          
          await connection.end();
          break; // Stop trying other credentials if this one worked
        } else if (dbType === 'postgres') {
          // Similar implementation for PostgreSQL
          // Would use node-postgres library
          throw new Error('PostgreSQL scanning not implemented yet');
        } else {
          throw new Error(`Unsupported database type: ${dbType}`);
        }
      } catch (error) {
        logger.debug(`Failed database authentication: ${error.message}`);
      }
    }
    
    if (!results.authenticated) {
      logger.warn(`Could not authenticate to ${dbType} on ${target}:${dbPort}`);
    }
    
    return results;
  }

  /**
   * Stop an ongoing scan
   */
  abort() {
    if (this.scanInProgress) {
      this.aborted = true;
      logger.info('Authenticated scan aborted');
    }
  }
}

module.exports = AuthScanner;