const { EventEmitter } = require('events');
const axios = require('axios');

// Simple HTML parser to replace cheerio functionality
class SimpleHTMLParser {
  constructor(html) {
    this.html = html || '';
  }

  static load(html) {
    return new SimpleHTMLParser(html);
  }

  find(selector) {
    const results = [];
    
    // Handle meta tag selectors with content attribute
    if (selector.includes('meta[name=') && selector.includes('[content*=')) {
      const nameMatch = selector.match(/meta\[name="([^"]+)"\]\[content\*="([^"]+)"\]/);
      if (nameMatch) {
        const name = nameMatch[1];
        const content = nameMatch[2];
        const regex = new RegExp(`<meta[^>]+name\\s*=\\s*["']${name}["'][^>]+content\\s*=\\s*["'][^"']*${content}[^"']*["'][^>]*>`, 'gi');
        const matches = this.html.match(regex) || [];
        matches.forEach(match => results.push(new HTMLElement(match)));
      }
    }
    // Handle simple meta tag selectors
    else if (selector.includes('meta[name=')) {
      const nameMatch = selector.match(/meta\[name="([^"]+)"\]/);
      if (nameMatch) {
        const name = nameMatch[1];
        const regex = new RegExp(`<meta[^>]+name\\s*=\\s*["']${name}["'][^>]*>`, 'gi');
        const matches = this.html.match(regex) || [];
        matches.forEach(match => results.push(new HTMLElement(match)));
      }
    }
    
    return new ElementCollection(results);
  }

  // Alias for find
  $(selector) {
    return this.find(selector);
  }

  html() {
    return this.html;
  }
}

class HTMLElement {
  constructor(html, innerHtml = null) {
    this.html = html;
    this.innerHtml = innerHtml;
  }

  attr(name) {
    const regex = new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i');
    const match = this.html.match(regex);
    return match ? match[1] : null;
  }

  html() {
    return this.innerHtml || this.html;
  }
}

class ElementCollection {
  constructor(elements = []) {
    this.elements = elements;
    this.length = elements.length;
  }

  first() {
    return this.elements[0] || new HTMLElement('');
  }

  attr(name) {
    return this.first().attr(name);
  }

  each(callback) {
    this.elements.forEach((element, index) => {
      callback.call(element, index, element);
    });
    return this;
  }
}
const url = require('url');
const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * WebScanner class for performing web application security scans
 */
class WebScanner extends EventEmitter {
  /**
   * Create a new web scanner instance
   * @param {Object} options - Scanner options
   * @param {number} options.timeout - Timeout in milliseconds
   * @param {number} options.maxDepth - Maximum crawl depth
   * @param {number} options.maxPages - Maximum pages to crawl
   * @param {string} options.userAgent - User agent string to use
   */
  constructor(options = {}) {
    super();
    this.timeout = options.timeout || 10000;
    this.maxDepth = options.maxDepth || 3;
    this.maxPages = options.maxPages || 100;
    this.userAgent = options.userAgent || 'Mozilla/5.0 VulScan Web Security Scanner/1.0';
    this.scanInProgress = false;
    this.aborted = false;
  }

  /**
   * Scan a web application for security issues
   * @param {string} target - Target URL to scan
   * @param {Object} options - Scan options
   * @param {boolean} options.crawl - Whether to crawl the site
   * @param {Array<string>} options.checks - Security checks to perform
   * @param {boolean} options.formAnalysis - Whether to analyze forms
   * @param {Object} options.auth - Authentication details
   * @returns {Promise<Object>} - Web scan results
   */
  async scan(target, options = {}) {
    if (this.scanInProgress) {
      throw new Error('A scan is already in progress');
    }

    this.scanInProgress = true;
    this.aborted = false;
    
    // Normalize target URL
    if (!target.startsWith('http')) {
      target = `http://${target}`;
    }
    
    try {
      const parsedUrl = new URL(target);
      if (!parsedUrl.hostname) {
        throw new Error('Invalid URL');
      }
    } catch (error) {
      this.scanInProgress = false;
      throw new Error(`Invalid target URL: ${target}`);
    }
    
    logger.scan.start('web', target);
    
    try {
      const baseUrl = target;
      
      // Initialize scan results
      const results = {
        target,
        timestamp: new Date().toISOString(),
        pages: [],
        forms: [],
        vulnerabilities: [],
        stats: {
          scannedUrls: 0,
          uniqueUrls: 0,
          forms: 0,
          cookies: 0
        }
      };
      
      // Create axios instance for making requests
      const client = axios.create({
        timeout: this.timeout,
        maxRedirects: 5,
        validateStatus: status => status < 500, // Accept all responses except server errors
        headers: {
          'User-Agent': this.userAgent
        }
      });
      
      // Authenticate if credentials are provided
      let cookies = null;
      if (options.auth) {
        cookies = await this._authenticate(client, baseUrl, options.auth);
        if (cookies) {
          results.authenticated = true;
          results.authMethod = options.auth.type || 'form';
        } else {
          logger.warn(`Authentication failed for ${baseUrl}`);
          results.authenticated = false;
        }
      }
      
      // Crawl the site if requested
      if (options.crawl !== false) {
        const crawlResults = await this._crawlSite(client, baseUrl, options);
        
        results.pages = crawlResults.pages;
        results.stats.scannedUrls = crawlResults.scannedUrls;
        results.stats.uniqueUrls = crawlResults.uniqueUrls;
        
        // Extract all forms from crawled pages
        if (options.formAnalysis !== false) {
          for (const page of crawlResults.pages) {
            if (!page.html) continue;
            
            const forms = this._extractForms(page.html, page.url);
            results.forms.push(...forms);
          }
          
          results.stats.forms = results.forms.length;
        }
      } else {
        // Just scan the target URL
        const response = await client.get(baseUrl);
        const page = {
          url: baseUrl,
          statusCode: response.status,
          title: this._extractTitle(response.data),
          headers: response.headers
        };
        
        results.pages.push(page);
        results.stats.scannedUrls = 1;
        results.stats.uniqueUrls = 1;
        
        // Extract forms if requested
        if (options.formAnalysis !== false && typeof response.data === 'string') {
          const forms = this._extractForms(response.data, baseUrl);
          results.forms.push(...forms);
          results.stats.forms = forms.length;
        }
      }
      
      // Perform security checks
      const checkFunctions = {
        'http-headers': this._checkHttpHeaders.bind(this),
        'ssl-tls': this._checkSslTls.bind(this),
        'xss': this._checkXss.bind(this),
        'csrf': this._checkCsrf.bind(this),
        'sql-injection': this._checkSqlInjection.bind(this),
        'file-inclusion': this._checkFileInclusion.bind(this),
        'sensitive-data': this._checkSensitiveData.bind(this),
        'insecure-cookies': this._checkInsecureCookies.bind(this),
        'open-redirects': this._checkOpenRedirects.bind(this),
        'outdated-software': this._checkOutdatedSoftware.bind(this)
      };
      
      // Determine which checks to run
      const checksToRun = options.checks && Array.isArray(options.checks) ? 
        options.checks.filter(check => checkFunctions[check]) : 
        Object.keys(checkFunctions);
      
      // Run the checks
      for (const check of checksToRun) {
        if (this.aborted) break;
        
        try {
          logger.debug(`Running web security check: ${check}`);
          this.emit('progress', {
            phase: `web-check-${check}`,
            current: checksToRun.indexOf(check) + 1,
            total: checksToRun.length,
            details: `Checking ${check}`
          });
          
          const checkResults = await checkFunctions[check](client, results, baseUrl);
          
          if (checkResults && checkResults.length > 0) {
            results.vulnerabilities.push(...checkResults);
          }
        } catch (error) {
          logger.warn(`Error running web security check '${check}': ${error.message}`);
        }
      }
      
      // Sort vulnerabilities by severity
      results.vulnerabilities.sort((a, b) => {
        const severityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3, 'info': 4 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });
      
      // Generate statistics
      results.stats.vulnerabilities = {
        total: results.vulnerabilities.length,
        critical: results.vulnerabilities.filter(v => v.severity === 'critical').length,
        high: results.vulnerabilities.filter(v => v.severity === 'high').length,
        medium: results.vulnerabilities.filter(v => v.severity === 'medium').length,
        low: results.vulnerabilities.filter(v => v.severity === 'low').length,
        info: results.vulnerabilities.filter(v => v.severity === 'info').length
      };
      
      logger.scan.complete('web', target, results);
      this.scanInProgress = false;
      return results;
    } catch (error) {
      this.scanInProgress = false;
      logger.error(`Web scan error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crawl a website and collect information
   * @param {Object} client - Axios client instance
   * @param {string} baseUrl - Base URL to start crawling from
   * @param {Object} options - Crawl options
   * @returns {Promise<Object>} - Crawl results
   */
  async _crawlSite(client, baseUrl, options = {}) {
    const maxDepth = options.maxDepth || this.maxDepth;
    const maxPages = options.maxPages || this.maxPages;
    
    const results = {
      pages: [],
      scannedUrls: 0,
      uniqueUrls: 0
    };
    
    // Initialize crawl state
    const visitedUrls = new Set();
    const urlsToVisit = new Map(); // URL -> depth
    const rootUrl = new URL(baseUrl);
    const baseHostname = rootUrl.hostname;
    
    // Add the base URL to the queue
    urlsToVisit.set(baseUrl, 0);
    
    // Process URLs breadth-first up to maxDepth
    while (urlsToVisit.size > 0 && results.pages.length < maxPages && !this.aborted) {
      // Get the next URL to process
      const [currentUrl, depth] = Array.from(urlsToVisit.entries())[0];
      urlsToVisit.delete(currentUrl);
      
      // Skip if already visited or beyond max depth
      if (visitedUrls.has(currentUrl) || depth > maxDepth) {
        continue;
      }
      
      // Mark as visited
      visitedUrls.add(currentUrl);
      results.scannedUrls++;
      
      try {
        logger.debug(`Crawling ${currentUrl} (depth ${depth})`);
        this.emit('progress', {
          phase: 'web-crawl',
          current: results.scannedUrls,
          total: Math.min(maxPages, urlsToVisit.size + results.scannedUrls),
          details: `Crawling ${currentUrl}`
        });
        
        // Request the URL
        const response = await client.get(currentUrl);
        
        // Only process HTML responses
        const contentType = response.headers['content-type'] || '';
        const isHtml = contentType.includes('text/html');
        
        if (isHtml && typeof response.data === 'string') {
          // Extract page information
          const page = {
            url: currentUrl,
            statusCode: response.status,
            title: this._extractTitle(response.data),
            headers: response.headers,
            html: response.data
          };
          
          results.pages.push(page);
          results.uniqueUrls++;
          
          // Extract links if we're not at max depth
          if (depth < maxDepth) {
            const links = this._extractLinks(response.data, currentUrl);
            
            // Add new links to the queue
            for (const link of links) {
              try {
                const linkUrl = new URL(link, currentUrl);
                
                // Only follow links to the same hostname
                if (linkUrl.hostname === baseHostname && !visitedUrls.has(linkUrl.href)) {
                  urlsToVisit.set(linkUrl.href, depth + 1);
                }
              } catch (error) {
                // Skip invalid URLs
                continue;
              }
            }
          }
        } else {
          logger.debug(`Skipping non-HTML content at ${currentUrl}`);
        }
      } catch (error) {
        logger.debug(`Error crawling ${currentUrl}: ${error.message}`);
      }
    }
    
    return results;
  }

  /**
   * Authenticate to a web application
   * @param {Object} client - Axios client instance
   * @param {string} baseUrl - Base URL of the web application
   * @param {Object} auth - Authentication details
   * @returns {Promise<Object|null>} - Cookies after authentication or null if failed
   */
  async _authenticate(client, baseUrl, auth) {
    try {
      logger.debug(`Attempting to authenticate to ${baseUrl}`);
      
      if (auth.type === 'basic') {
        // Basic authentication
        client.defaults.auth = {
          username: auth.username,
          password: auth.password
        };
        
        // Test authentication
        const response = await client.get(baseUrl);
        return response.status < 400 ? {} : null;
      } else {
        // Form authentication (default)
        const loginUrl = auth.loginUrl || new URL('/login', baseUrl).href;
        
        // Get the login page first to retrieve any CSRF tokens
        const loginPage = await client.get(loginUrl);
        const csrfToken = this._extractCsrfToken(loginPage.data);
        
        // Prepare form data
        const formData = {
          [auth.usernameField || 'username']: auth.username,
          [auth.passwordField || 'password']: auth.password
        };
        
        // Add CSRF token if found
        if (csrfToken) {
          formData[csrfToken.name] = csrfToken.value;
        }
        
        // Submit the login form
        const loginResponse = await client.post(loginUrl, formData, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': loginUrl
          },
          maxRedirects: 5,
          withCredentials: true
        });
        
        // Check if login was successful
        if (loginResponse.status === 200 || loginResponse.status === 302) {
          // Store cookies for future requests
          const cookies = loginResponse.headers['set-cookie'];
          if (cookies) {
            client.defaults.headers.common['Cookie'] = cookies;
            return cookies;
          }
          
          // Simple heuristic to detect successful login
          const loginFailed = loginResponse.data.includes('failed') ||
                             loginResponse.data.includes('incorrect') ||
                             loginResponse.data.includes('invalid');
          
          return loginFailed ? null : {};
        }
      }
      
      return null;
    } catch (error) {
      logger.debug(`Authentication error: ${error.message}`);
      return null;
    }
  }

  /**
   * Extract the title from HTML content
   * @param {string} html - HTML content
   * @returns {string|null} - Page title or null if not found
   */
  _extractTitle(html) {
    if (typeof html !== 'string') return null;
    
    try {
      const $ = cheerio.load(html);
      return $('title').text().trim() || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract links from HTML content
   * @param {string} html - HTML content
   * @param {string} baseUrl - Base URL for resolving relative links
   * @returns {Array<string>} - Array of links
   */
  _extractLinks(html, baseUrl) {
    if (typeof html !== 'string') return [];
    
    try {
      const $ = cheerio.load(html);
      const links = new Set();
      
      // Extract links from anchor tags
      $('a[href]').each((index, element) => {
        const href = $(element).attr('href');
        if (!href) return;
        
        // Skip javascript: and mailto: links
        if (href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('#')) {
          return;
        }
        
        links.add(href);
      });
      
      // Extract links from forms
      $('form[action]').each((index, element) => {
        const action = $(element).attr('action');
        if (action) {
          links.add(action);
        }
      });
      
      return Array.from(links);
    } catch (error) {
      return [];
    }
  }

  /**
   * Extract forms from HTML content
   * @param {string} html - HTML content
   * @param {string} pageUrl - URL of the page
   * @returns {Array<Object>} - Array of form information
   */
  _extractForms(html, pageUrl) {
    if (typeof html !== 'string') return [];
    
    try {
      const $ = cheerio.load(html);
      const forms = [];
      
      $('form').each((index, element) => {
        const $form = $(element);
        const action = $form.attr('action') || '';
        const method = ($form.attr('method') || 'get').toLowerCase();
        const id = $form.attr('id') || '';
        const name = $form.attr('name') || '';
        
        // Resolve the form action URL
        const actionUrl = action ? new URL(action, pageUrl).href : pageUrl;
        
        // Extract form fields
        const fields = [];
        
        $form.find('input, select, textarea').each((i, field) => {
          const $field = $(field);
          const fieldType = $field.attr('type') || 'text';
          const fieldName = $field.attr('name');
          
          if (!fieldName) return; // Skip fields without name attribute
          
          fields.push({
            name: fieldName,
            type: fieldType,
            id: $field.attr('id') || '',
            required: $field.attr('required') !== undefined
          });
        });
        
        // Extract hidden fields
        const hiddenFields = fields.filter(f => f.type === 'hidden');
        
        // Check if form has CSRF protection
        const hasCsrfField = hiddenFields.some(f => {
          const name = f.name.toLowerCase();
          return name.includes('csrf') || name.includes('token') || name.includes('nonce');
        });
        
        forms.push({
          id: id || `form-${index}`,
          name,
          action: actionUrl,
          method,
          fields,
          hiddenFields: hiddenFields.length,
          hasCsrfProtection: hasCsrfField,
          pageUrl
        });
      });
      
      return forms;
    } catch (error) {
      return [];
    }
  }

  /**
   * Extract CSRF token from HTML content
   * @param {string} html - HTML content
   * @returns {Object|null} - CSRF token information or null if not found
   */
  _extractCsrfToken(html) {
    if (typeof html !== 'string') return null;
    
    try {
      const $ = cheerio.load(html);
      
      // Look for meta tag with csrf token
      const metaToken = $('meta[name="csrf-token"]').attr('content');
      if (metaToken) {
        return {
          name: 'csrf-token',
          value: metaToken
        };
      }
      
      // Look for hidden input with csrf token
      let csrfInput = $('input[name="_csrf"]').first();
      if (csrfInput.length) {
        return {
          name: '_csrf',
          value: csrfInput.attr('value')
        };
      }
      
      csrfInput = $('input[name="csrf_token"]').first();
      if (csrfInput.length) {
        return {
          name: 'csrf_token',
          value: csrfInput.attr('value')
        };
      }
      
      csrfInput = $('input[name="csrfmiddlewaretoken"]').first();
      if (csrfInput.length) {
        return {
          name: 'csrfmiddlewaretoken',
          value: csrfInput.attr('value')
        };
      }
      
      // Look for any input with csrf in the name
      csrfInput = $('input[type="hidden"]').filter((i, el) => {
        const name = $(el).attr('name') || '';
        return name.toLowerCase().includes('csrf') || name.toLowerCase().includes('token');
      }).first();
      
      if (csrfInput.length) {
        return {
          name: csrfInput.attr('name'),
          value: csrfInput.attr('value')
        };
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check HTTP headers for security issues
   * @param {Object} client - Axios client instance
   * @param {Object} results - Scan results object
   * @param {string} baseUrl - Base URL of the web application
   * @returns {Promise<Array>} - Security findings
   */
  async _checkHttpHeaders(client, results, baseUrl) {
    const findings = [];
    
    // Get the first page with headers
    const pages = results.pages.filter(p => p.headers);
    if (pages.length === 0) {
      return findings;
    }
    
    const page = pages[0];
    const headers = page.headers;
    
    // Check for missing security headers
    const securityHeaders = {
      'strict-transport-security': {
        name: 'Strict-Transport-Security',
        description: 'Enforces secure connections to the server',
        recommendation: 'Add Strict-Transport-Security header with a long max-age value',
        severity: 'medium'
      },
      'content-security-policy': {
        name: 'Content-Security-Policy',
        description: 'Helps prevent Cross-Site Scripting (XSS) and data injection attacks',
        recommendation: 'Implement a Content-Security-Policy header with appropriate restrictions',
        severity: 'medium'
      },
      'x-content-type-options': {
        name: 'X-Content-Type-Options',
        description: 'Prevents MIME type sniffing',
        recommendation: 'Set X-Content-Type-Options header to "nosniff"',
        severity: 'low'
      },
      'x-frame-options': {
        name: 'X-Frame-Options',
        description: 'Prevents clickjacking attacks',
        recommendation: 'Set X-Frame-Options header to "DENY" or "SAMEORIGIN"',
        severity: 'medium'
      },
      'x-xss-protection': {
        name: 'X-XSS-Protection',
        description: 'Enables browser XSS filtering capabilities',
        recommendation: 'Set X-XSS-Protection header to "1; mode=block"',
        severity: 'low'
      },
      'referrer-policy': {
        name: 'Referrer-Policy',
        description: 'Controls how much referrer information is included with requests',
        recommendation: 'Set a Referrer-Policy header with an appropriate policy',
        severity: 'low'
      },
      'permissions-policy': {
        name: 'Permissions-Policy',
        description: 'Controls browser features available to the site',
        recommendation: 'Implement a Permissions-Policy header to restrict browser features',
        severity: 'low'
      }
    };
    
    // Check each security header
    for (const [headerId, headerInfo] of Object.entries(securityHeaders)) {
      const headerExists = Object.keys(headers).some(h => h.toLowerCase() === headerId);
      
      if (!headerExists) {
        findings.push({
          id: `missing-security-header-${headerId}`,
          name: `Missing ${headerInfo.name} Header`,
          description: `The ${headerInfo.name} header is missing. ${headerInfo.description}`,
          severity: headerInfo.severity,
          remediation: headerInfo.recommendation,
          evidence: {
            url: page.url,
            headers: Object.keys(headers).join(', ')
          }
        });
      }
    }
    
    // Check for insecure headers
    if (headers['server']) {
      const serverHeader = headers['server'];
      
      if (serverHeader.match(/[0-9.]+/)) {
        findings.push({
          id: 'server-version-disclosure',
          name: 'Server Version Disclosure',
          description: 'The server header reveals detailed version information',
          severity: 'low',
          remediation: 'Configure the server to hide version information in the Server header',
          evidence: {
            url: page.url,
            header: `Server: ${serverHeader}`
          }
        });
      }
    }
    
    // Check for cookies without security flags
    const cookies = [];
    
    if (headers['set-cookie']) {
      const setCookies = Array.isArray(headers['set-cookie']) ? 
        headers['set-cookie'] : [headers['set-cookie']];
      
      for (const cookie of setCookies) {
        const secure = cookie.includes('Secure');
        const httpOnly = cookie.includes('HttpOnly');
        const sameSite = cookie.includes('SameSite');
        
        const cookieName = cookie.split('=')[0];
        
        if (!secure || !httpOnly || !sameSite) {
          cookies.push({
            name: cookieName,
            secure,
            httpOnly,
            sameSite
          });
        }
      }
      
      if (cookies.length > 0) {
        findings.push({
          id: 'insecure-cookies',
          name: 'Insecure Cookies',
          description: 'Cookies are missing security flags like Secure, HttpOnly, or SameSite',
          severity: 'medium',
          remediation: 'Set Secure, HttpOnly, and SameSite flags on all cookies',
          evidence: {
            url: page.url,
            cookies
          }
        });
      }
    }
    
    return findings;
  }

  /**
   * Check SSL/TLS configuration for security issues
   * @param {Object} client - Axios client instance
   * @param {Object} results - Scan results object
   * @param {string} baseUrl - Base URL of the web application
   * @returns {Promise<Array>} - Security findings
   */
  async _checkSslTls(client, results, baseUrl) {
    const findings = [];
    
    // Only run this check on HTTPS sites
    if (!baseUrl.startsWith('https://')) {
      findings.push({
        id: 'no-https',
        name: 'No HTTPS Implementation',
        description: 'The site does not use HTTPS encryption',
        severity: 'high',
        remediation: 'Implement HTTPS across the entire site',
        evidence: {
          url: baseUrl
        }
      });
      
      return findings;
    }
    
    // Check for mixed content (http resources on https page)
    for (const page of results.pages) {
      if (!page.html) continue;
      
      // Check for mixed content in the HTML
      const $ = cheerio.load(page.html);
      const mixedContent = [];
      
      // Check script sources
      $('script[src^="http:"]').each((i, el) => {
        mixedContent.push({
          type: 'script',
          url: $(el).attr('src')
        });
      });
      
      // Check link hrefs for stylesheets
      $('link[rel="stylesheet"][href^="http:"]').each((i, el) => {
        mixedContent.push({
          type: 'stylesheet',
          url: $(el).attr('href')
        });
      });
      
      // Check image sources
      $('img[src^="http:"]').each((i, el) => {
        mixedContent.push({
          type: 'image',
          url: $(el).attr('src')
        });
      });
      
      if (mixedContent.length > 0) {
        findings.push({
          id: 'mixed-content',
          name: 'Mixed Content',
          description: 'The HTTPS page loads resources over insecure HTTP',
          severity: 'medium',
          remediation: 'Update all resource references to use HTTPS',
          evidence: {
            url: page.url,
            mixedContent: mixedContent.slice(0, 5) // Limit to first 5 examples
          }
        });
        
        break; // Only report this once
      }
    }
    
    return findings;
  }

  /**
   * Check for Cross-Site Scripting (XSS) vulnerabilities
   * @param {Object} client - Axios client instance
   * @param {Object} results - Scan results object
   * @param {string} baseUrl - Base URL of the web application
   * @returns {Promise<Array>} - Security findings
   */
  async _checkXss(client, results, baseUrl) {
    const findings = [];
    
    // XSS payloads for testing
    const xssPayloads = [
      {
        payload: '<script>alert(1)</script>',
        encoded: encodeURIComponent('<script>alert(1)</script>')
      },
      {
        payload: '"><script>alert(1)</script>',
        encoded: encodeURIComponent('"><script>alert(1)</script>')
      },
      {
        payload: '<img src=x onerror=alert(1)>',
        encoded: encodeURIComponent('<img src=x onerror=alert(1)>')
      }
    ];
    
    // Test GET parameters for reflection
    for (const page of results.pages) {
      // Extract URL parameters if any
      try {
        const pageUrl = new URL(page.url);
        
        if (pageUrl.search) {
          // The page already has parameters, let's check for reflection
          const params = Array.from(pageUrl.searchParams.entries());
          
          // Check each parameter for reflection
          for (const [param, value] of params) {
            if (page.html && page.html.includes(value)) {
              // Parameter is reflected in the response
              findings.push({
                id: 'reflected-parameter',
                name: 'Reflected URL Parameter',
                description: 'URL parameter is reflected in the page which may lead to XSS',
                severity: 'info',
                remediation: 'Ensure all user input is properly encoded before output',
                evidence: {
                  url: page.url,
                  parameter: param,
                  value: value
                }
              });
            }
          }
        }
      } catch (error) {
        continue; // Skip invalid URLs
      }
    }
    
    // Test forms for XSS
    for (const form of results.forms) {
      // Only test GET forms for now (POST forms would require more complex testing)
      if (form.method !== 'get') continue;
      
      // Find text-type fields to test
      const textFields = form.fields.filter(f => 
        ['text', 'search', 'url', 'tel', 'email', 'hidden'].includes(f.type)
      );
      
      if (textFields.length === 0) continue;
      
      // Test one field per form with one payload
      const fieldToTest = textFields[0];
      const payload = xssPayloads[0];
      
      try {
        // Build the test URL
        const formUrl = new URL(form.action);
        formUrl.searchParams.append(fieldToTest.name, payload.payload);
        
        // Send the request
        const response = await client.get(formUrl.href);
        
        // Check if the payload is reflected without encoding
        if (typeof response.data === 'string' && response.data.includes(payload.payload)) {
          findings.push({
            id: 'xss-vulnerable-form',
            name: 'Potential XSS Vulnerability',
            description: 'Form input is reflected in the response without proper encoding',
            severity: 'high',
            remediation: 'Implement proper output encoding for all user-supplied input',
            evidence: {
              url: formUrl.href,
              form: form.id,
              field: fieldToTest.name,
              payload: payload.payload
            }
          });
        }
      } catch (error) {
        logger.debug(`Error testing form for XSS: ${error.message}`);
      }
    }
    
    return findings;
  }

  /**
   * Check for Cross-Site Request Forgery (CSRF) vulnerabilities
   * @param {Object} client - Axios client instance
   * @param {Object} results - Scan results object
   * @param {string} baseUrl - Base URL of the web application
   * @returns {Promise<Array>} - Security findings
   */
  async _checkCsrf(client, results, baseUrl) {
    const findings = [];
    
    // Look for forms that might be vulnerable to CSRF
    const postForms = results.forms.filter(form => form.method === 'post');
    
    for (const form of postForms) {
      // Skip login/registration forms as they're often exempt from CSRF protection
      const formId = form.id.toLowerCase();
      const formName = (form.name || '').toLowerCase();
      const formAction = form.action.toLowerCase();
      
      const isAuthForm = 
        formId.includes('login') || formId.includes('register') || 
        formName.includes('login') || formName.includes('register') ||
        formAction.includes('login') || formAction.includes('register');
      
      if (isAuthForm) continue;
      
      // If the form doesn't have CSRF protection, report it
      if (!form.hasCsrfProtection) {
        findings.push({
          id: 'csrf-vulnerable-form',
          name: 'Potential CSRF Vulnerability',
          description: 'Form submission does not appear to have CSRF protection',
          severity: 'medium',
          remediation: 'Implement CSRF tokens for all state-changing forms',
          evidence: {
            url: form.pageUrl,
            form: form.id,
            action: form.action
          }
        });
      }
    }
    
    return findings;
  }

  /**
   * Check for SQL Injection vulnerabilities
   * @param {Object} client - Axios client instance
   * @param {Object} results - Scan results object
   * @param {string} baseUrl - Base URL of the web application
   * @returns {Promise<Array>} - Security findings
   */
  async _checkSqlInjection(client, results, baseUrl) {
    const findings = [];
    
    // SQL injection payloads for testing
    const sqlPayloads = [
      "1' OR '1'='1",
      "1\" OR \"1\"=\"1",
      "1)) OR ((1=1",
      "' UNION SELECT 1,2,3,4--",
      "admin'--"
    ];
    
    // Error patterns that indicate SQL injection vulnerabilities
    const errorPatterns = [
      /SQL syntax/i,
      /syntax error/i,
      /ORA-[0-9]+/,
      /MySQLSyntaxErrorException/i,
      /unclosed quotation mark after/i,
      /quoted string not properly terminated/i,
      /SQLSTATE\[[0-9]+/i
    ];
    
    // Test forms for SQL injection
    for (const form of results.forms) {
      // Limit testing to forms with search-like fields
      const searchFields = form.fields.filter(f => 
        ['text', 'search', 'hidden'].includes(f.type) &&
        (f.name.includes('id') || f.name.includes('search') || f.name.includes('query'))
      );
      
      if (searchFields.length === 0) continue;
      
      // Test one field with a few payloads
      const fieldToTest = searchFields[0];
      
      // Test SQL injection with some basic payloads
      for (const payload of sqlPayloads.slice(0, 2)) { // Limit to first 2 payloads to avoid excessive requests
        try {
          let response;
          
          if (form.method === 'get') {
            // Build the test URL
            const formUrl = new URL(form.action);
            formUrl.searchParams.append(fieldToTest.name, payload);
            
            // Send the request
            response = await client.get(formUrl.href);
          } else {
            // For POST forms
            const formData = {
              [fieldToTest.name]: payload
            };
            
            // Add CSRF token if needed
            const csrfToken = this._extractCsrfToken(await client.get(form.pageUrl).then(r => r.data));
            if (csrfToken) {
              formData[csrfToken.name] = csrfToken.value;
            }
            
            // Send the request
            response = await client.post(form.action, formData, {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Referer': form.pageUrl
              }
            });
          }
          
          // Check for SQL error patterns in the response
          if (typeof response.data === 'string') {
            for (const pattern of errorPatterns) {
              if (pattern.test(response.data)) {
                findings.push({
                  id: 'sql-injection-error',
                  name: 'Potential SQL Injection Vulnerability',
                  description: 'SQL error messages are returned in response to input manipulation',
                  severity: 'high',
                  remediation: 'Use parameterized queries and validate all user input',
                  evidence: {
                    url: form.action,
                    form: form.id,
                    field: fieldToTest.name,
                    payload,
                    errorPattern: pattern.toString()
                  }
                });
                
                break; // Found a vulnerability, no need to check other patterns
              }
            }
          }
        } catch (error) {
          logger.debug(`Error testing form for SQL injection: ${error.message}`);
        }
      }
    }
    
    return findings;
  }

  /**
   * Check for File Inclusion vulnerabilities
   * @param {Object} client - Axios client instance
   * @param {Object} results - Scan results object
   * @param {string} baseUrl - Base URL of the web application
   * @returns {Promise<Array>} - Security findings
   */
  async _checkFileInclusion(client, results, baseUrl) {
    const findings = [];
    
    // File inclusion payloads for testing
    const lfiPayloads = [
      "../../../etc/passwd",
      "../../../../../../../../etc/passwd",
      "..\\..\\..\\..\\windows\\win.ini",
      "/etc/passwd",
      "c:\\windows\\win.ini"
    ];
    
    // Patterns indicating successful exploitation
    const lfiPatterns = [
      /root:.*:0:0:/,  // Linux passwd file
      /\[fonts\]/i,    // Windows ini file
      /\[extensions\]/i // Windows ini file
    ];
    
    // Look for parameters that might be vulnerable to LFI/RFI
    const urlsWithParams = results.pages
      .map(page => {
        try {
          const url = new URL(page.url);
          return {
            url: page.url,
            params: Array.from(url.searchParams.entries())
          };
        } catch (error) {
          return null;
        }
      })
      .filter(Boolean)
      .filter(item => item.params.length > 0);
    
    // Test parameters for LFI
    for (const item of urlsWithParams) {
      for (const [param, value] of item.params) {
        // Only test parameters that might involve files or paths
        if (param.includes('file') || param.includes('path') || param.includes('page') || param.includes('dir') || param.includes('view')) {
          // Test the parameter with common LFI payloads
          for (const payload of lfiPayloads.slice(0, 2)) { // Limit to first 2 payloads
            try {
              const testUrl = new URL(item.url);
              testUrl.searchParams.set(param, payload);
              
              const response = await client.get(testUrl.href);
              
              // Check for signs of successful LFI
              if (typeof response.data === 'string') {
                for (const pattern of lfiPatterns) {
                  if (pattern.test(response.data)) {
                    findings.push({
                      id: 'local-file-inclusion',
                      name: 'Potential Local File Inclusion Vulnerability',
                      description: 'The application appears to be vulnerable to Local File Inclusion',
                      severity: 'high',
                      remediation: 'Validate user input and limit file operations to a specific directory',
                      evidence: {
                        url: testUrl.href,
                        parameter: param,
                        payload,
                        pattern: pattern.toString()
                      }
                    });
                    
                    break; // Found a vulnerability, no need to check other patterns
                  }
                }
              }
            } catch (error) {
              logger.debug(`Error testing for LFI: ${error.message}`);
            }
          }
        }
      }
    }
    
    return findings;
  }

  /**
   * Check for sensitive data exposure
   * @param {Object} client - Axios client instance
   * @param {Object} results - Scan results object
   * @param {string} baseUrl - Base URL of the web application
   * @returns {Promise<Array>} - Security findings
   */
  async _checkSensitiveData(client, results, baseUrl) {
    const findings = [];
    
    // Patterns for sensitive data detection
    const sensitivePatterns = [
      {
        name: 'API Key',
        pattern: /(['|"]?(?:key|api|token|secret|password)['|"]?\s*[:=]\s*['|"])([a-zA-Z0-9_\-\.]{16,64})\1/gi,
        severity: 'high'
      },
      {
        name: 'AWS Access Key',
        pattern: /AKIA[0-9A-Z]{16}/g,
        severity: 'critical'
      },
      {
        name: 'Email Address',
        pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
        severity: 'low'
      },
      {
        name: 'IP Address',
        pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
        severity: 'low'
      },
      {
        name: 'Social Security Number',
        pattern: /\b(?!000|666|9\\d{2})(?:[0-7]\\d{2}|8[0-8]\\d|89[0-9])[ -]?(?!00)\\d{2}[ -]?(?!0000)\\d{4}\b/g,
        severity: 'high'
      },
      {
        name: 'Credit Card Number',
        pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\\d{3})\\d{11})\b/g,
        severity: 'high'
      },
      {
        name: 'Database Connection String',
        pattern: /(?:mongodb|mysql|postgres):\/\/[^\s]+:[^\s]+@[^\s]+/g,
        severity: 'critical'
      },
      {
        name: 'Private Key',
        pattern: /-----BEGIN (?:RSA|DSA|EC|PGP|OPENSSH) PRIVATE KEY( BLOCK)?-----/g,
        severity: 'critical'
      }
    ];
    
    // Check HTML content for sensitive data
    for (const page of results.pages) {
      if (!page.html) continue;
      
      // Check HTML source
      for (const { name, pattern, severity } of sensitivePatterns) {
        const matches = page.html.match(pattern);
        
        if (matches && matches.length > 0) {
          findings.push({
            id: `sensitive-data-${name.toLowerCase().replace(/\s+/g, '-')}`,
            name: `${name} Exposure`,
            description: `The page contains what appears to be ${name} data`,
            severity,
            remediation: 'Never include sensitive data directly in HTML/JavaScript code',
            evidence: {
              url: page.url,
              matchCount: matches.length,
              // Avoid including the actual sensitive data in findings
              sample: name === 'Email Address' || name === 'IP Address' ? 
                matches[0] : 'Sensitive data redacted'
            }
          });
        }
      }
      
      // Check for JavaScript source maps
      if (page.html.includes('.js.map')) {
        findings.push({
          id: 'js-source-map',
          name: 'JavaScript Source Map Exposure',
          description: 'JavaScript source maps are exposed in production',
          severity: 'medium',
          remediation: 'Remove source maps in production builds',
          evidence: {
            url: page.url
          }
        });
      }
    }
    
    // Check for sensitive files
    const sensitiveFiles = [
      '.git/HEAD',
      '.env',
      'config.json',
      'wp-config.php',
      'phpinfo.php',
      'robots.txt',
      '.htpasswd',
      'backup.sql',
      'database.sql'
    ];
    
    // Only check a few files to avoid excessive requests
    for (const file of sensitiveFiles.slice(0, 3)) {
      try {
        const fileUrl = new URL(file, baseUrl).href;
        const response = await client.get(fileUrl, { validateStatus: () => true });
        
        if (response.status === 200) {
          findings.push({
            id: `sensitive-file-${file.replace(/[^a-zA-Z0-9]/g, '-')}`,
            name: `Sensitive File Exposure`,
            description: `The file ${file} is publicly accessible`,
            severity: 'medium',
            remediation: 'Restrict access to sensitive files',
            evidence: {
              url: fileUrl,
              status: response.status
            }
          });
        }
      } catch (error) {
        logger.debug(`Error checking sensitive file ${file}: ${error.message}`);
      }
    }
    
    return findings;
  }

  /**
   * Check for insecure cookie configuration
   * @param {Object} client - Axios client instance
   * @param {Object} results - Scan results object
   * @param {string} baseUrl - Base URL of the web application
   * @returns {Promise<Array>} - Security findings
   */
  async _checkInsecureCookies(client, results, baseUrl) {
    const findings = [];
    
    // Check all pages for cookies
    for (const page of results.pages) {
      if (!page.headers || !page.headers['set-cookie']) continue;
      
      const cookies = Array.isArray(page.headers['set-cookie']) ? 
        page.headers['set-cookie'] : [page.headers['set-cookie']];
      
      for (const cookie of cookies) {
        // Parse cookie
        const cookieName = cookie.split('=')[0].trim();
        const isSecure = cookie.includes('Secure');
        const isHttpOnly = cookie.includes('HttpOnly');
        const hasSameSite = cookie.includes('SameSite');
        
        // Check for session cookies without proper flags
        if (cookieName.toLowerCase().includes('session') || 
            cookieName.toLowerCase().includes('token') || 
            cookieName.toLowerCase().includes('auth')) {
          
          if (!isSecure || !isHttpOnly || !hasSameSite) {
            findings.push({
              id: 'insecure-session-cookie',
              name: 'Insecure Session Cookie',
              description: 'Session cookie missing security flags',
              severity: 'high',
              remediation: 'Set Secure, HttpOnly, and SameSite=Strict flags on all session cookies',
              evidence: {
                url: page.url,
                cookie: cookieName,
                isSecure,
                isHttpOnly,
                hasSameSite
              }
            });
          }
        } else {
          // Regular cookies
          if (!isSecure || !isHttpOnly) {
            findings.push({
              id: 'insecure-cookie',
              name: 'Insecure Cookie',
              description: 'Cookie missing security flags',
              severity: 'medium',
              remediation: 'Set Secure and HttpOnly flags on all cookies with sensitive data',
              evidence: {
                url: page.url,
                cookie: cookieName,
                isSecure,
                isHttpOnly,
                hasSameSite
              }
            });
          }
        }
      }
    }
    
    return findings;
  }

  /**
   * Check for open redirect vulnerabilities
   * @param {Object} client - Axios client instance
   * @param {Object} results - Scan results object
   * @param {string} baseUrl - Base URL of the web application
   * @returns {Promise<Array>} - Security findings
   */
  async _checkOpenRedirects(client, results, baseUrl) {
    const findings = [];
    
    // Open redirect payloads for testing
    const redirectPayloads = [
      'https://example.com',
      '//example.com',
      'https://example.com/login?returnTo=',
      '//google.com'
    ];
    
    // Look for redirect parameters
    const redirectParams = ['redirect', 'return', 'returnto', 'return_to', 'goto', 'url', 'target', 'next', 'redir', 'redirect_uri'];
    
    // Test pages with parameters
    for (const page of results.pages) {
      try {
        const pageUrl = new URL(page.url);
        
        for (const param of redirectParams) {
          if (pageUrl.searchParams.has(param)) {
            // Found a potential redirect parameter, test it
            for (const payload of redirectPayloads.slice(0, 2)) { // Limit testing
              try {
                const testUrl = new URL(page.url);
                testUrl.searchParams.set(param, payload);
                
                const response = await client.get(testUrl.href, {
                  maxRedirects: 0,
                  validateStatus: status => status >= 200 && status < 400
                });
                
                // Check if it's a redirect to our payload
                if (response.status >= 300 && response.status < 400) {
                  const location = response.headers.location || '';
                  
                  if (location.includes('example.com') || location.includes('google.com')) {
                    findings.push({
                      id: 'open-redirect',
                      name: 'Open Redirect Vulnerability',
                      description: 'The application redirects to arbitrary external URLs',
                      severity: 'medium',
                      remediation: 'Validate and sanitize redirect URLs, use a whitelist of allowed destinations',
                      evidence: {
                        url: testUrl.href,
                        parameter: param,
                        payload,
                        redirectLocation: location
                      }
                    });
                    
                    break; // Found a vulnerability, no need to test more payloads
                  }
                }
              } catch (error) {
                logger.debug(`Error testing for open redirect: ${error.message}`);
              }
            }
          }
        }
      } catch (error) {
        continue; // Skip invalid URLs
      }
    }
    
    return findings;
  }

  /**
   * Check for outdated software and technologies
   * @param {Object} client - Axios client instance
   * @param {Object} results - Scan results object
   * @param {string} baseUrl - Base URL of the web application
   * @returns {Promise<Array>} - Security findings
   */
  async _checkOutdatedSoftware(client, results, baseUrl) {
    const findings = [];
    
    // Get headers from first page
    const pages = results.pages.filter(p => p.headers);
    if (pages.length === 0) {
      return findings;
    }
    
    const page = pages[0];
    const headers = page.headers;
    
    // Check for software version in headers
    if (headers['server']) {
      const serverHeader = headers['server'];
      
      // Check for outdated web servers
      if (serverHeader.includes('Apache/1.') || serverHeader.includes('Apache/2.0') ||
          serverHeader.includes('Apache/2.2')) {
        findings.push({
          id: 'outdated-apache',
          name: 'Outdated Apache Server',
          description: 'The web server is running an outdated version of Apache',
          severity: 'medium',
          remediation: 'Upgrade to the latest version of Apache HTTP Server',
          evidence: {
            url: page.url,
            server: serverHeader
          }
        });
      }
      
      if (serverHeader.includes('nginx/0.') || serverHeader.includes('nginx/1.0') ||
          serverHeader.includes('nginx/1.10') || serverHeader.includes('nginx/1.11')) {
        findings.push({
          id: 'outdated-nginx',
          name: 'Outdated Nginx Server',
          description: 'The web server is running an outdated version of Nginx',
          severity: 'medium',
          remediation: 'Upgrade to the latest version of Nginx',
          evidence: {
            url: page.url,
            server: serverHeader
          }
        });
      }
    }
    
    // Check for PHP version
    if (headers['x-powered-by'] && headers['x-powered-by'].includes('PHP/')) {
      const phpVersion = headers['x-powered-by'].match(/PHP\/([0-9.]+)/);
      
      if (phpVersion) {
        const version = phpVersion[1];
        
        if (version.startsWith('5.') || version.startsWith('7.0') || 
            version.startsWith('7.1') || version.startsWith('7.2')) {
          findings.push({
            id: 'outdated-php',
            name: 'Outdated PHP Version',
            description: 'The server is running an outdated PHP version',
            severity: 'medium',
            remediation: 'Upgrade to a supported PHP version (7.4+ or 8.x)',
            evidence: {
              url: page.url,
              phpVersion: version
            }
          });
        }
      }
    }
    
    // Check for outdated JavaScript libraries
    for (const page of results.pages) {
      if (!page.html) continue;
      
      // jQuery
      const jqueryMatch = page.html.match(/jquery[.-]([0-9.]+)(?:\.min)?\.js/i) ||
                         page.html.match(/jQuery v([0-9.]+)/i);
      
      if (jqueryMatch) {
        const version = jqueryMatch[1];
        
        if (version.startsWith('1.') || version.startsWith('2.')) {
          findings.push({
            id: 'outdated-jquery',
            name: 'Outdated jQuery',
            description: 'The application is using an outdated version of jQuery',
            severity: 'low',
            remediation: 'Upgrade to jQuery 3.x or later',
            evidence: {
              url: page.url,
              version
            }
          });
        }
      }
      
      // Bootstrap
      const bootstrapMatch = page.html.match(/bootstrap[.-]([0-9.]+)(?:\.min)?\.(?:js|css)/i) ||
                           page.html.match(/Bootstrap v([0-9.]+)/i);
      
      if (bootstrapMatch) {
        const version = bootstrapMatch[1];
        
        if (version.startsWith('2.') || version.startsWith('3.')) {
          findings.push({
            id: 'outdated-bootstrap',
            name: 'Outdated Bootstrap',
            description: 'The application is using an outdated version of Bootstrap',
            severity: 'low',
            remediation: 'Upgrade to Bootstrap 4.x or 5.x',
            evidence: {
              url: page.url,
              version
            }
          });
        }
      }
    }
    
    return findings;
  }

  /**
   * Stop an ongoing scan
   */
  abort() {
    if (this.scanInProgress) {
      this.aborted = true;
      logger.info('Web scan aborted');
    }
  }
}

module.exports = WebScanner;