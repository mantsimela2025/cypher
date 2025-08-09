/**
 * Framework Detector module
 * Provides utilities for detecting web application frameworks and CMS versions
 */

const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../logger');
const versionAnalyzer = require('./version-analyzer');
const versionDb = require('../../data/version-database');

/**
 * Detect web application frameworks and CMS
 * @param {string} baseUrl - Base URL to check
 * @param {Object} options - Detection options
 * @returns {Promise<Array>} - Detected frameworks and versions
 */
async function detectFrameworks(baseUrl, options = {}) {
  const frameworks = [];
  const timeout = options.timeout || 10000;
  const maxRedirects = options.maxRedirects || 3;
  
  // Create HTTP client
  const client = axios.create({
    timeout,
    maxRedirects,
    headers: {
      'User-Agent': options.userAgent || 'Mozilla/5.0 VulScan/1.0'
    },
    validateStatus: () => true // Accept any status
  });
  
  try {
    logger.debug(`Detecting frameworks at ${baseUrl}`);
    
    // Fetch main page
    const response = await client.get(baseUrl);
    
    // Check status
    if (response.status >= 400) {
      logger.debug(`Got status ${response.status} when fetching ${baseUrl}`);
      return frameworks;
    }
    
    // Parse HTML
    const $ = cheerio.load(response.data);
    
    // Check for WordPress
    if (await checkWordPress($, baseUrl, client)) {
      frameworks.push(...await detectWordPress($, baseUrl, client));
    }
    
    // Check for Drupal
    if (await checkDrupal($, baseUrl, client)) {
      frameworks.push(...await detectDrupal($, baseUrl, client));
    }
    
    // Check for Joomla
    if (await checkJoomla($, baseUrl, client)) {
      frameworks.push(...await detectJoomla($, baseUrl, client));
    }
    
    // Detect JavaScript frameworks
    const jsFrameworks = detectJavaScriptFrameworks($, response.data);
    frameworks.push(...jsFrameworks);
    
    // Detect CSS frameworks
    const cssFrameworks = detectCSSFrameworks($, response.data);
    frameworks.push(...cssFrameworks);
    
    // Detect server-side frameworks from response headers
    const serverFrameworks = detectServerFrameworks(response.headers);
    frameworks.push(...serverFrameworks);
    
  } catch (error) {
    logger.debug(`Error detecting frameworks: ${error.message}`);
  }
  
  return frameworks;
}

/**
 * Check if a site is powered by WordPress
 * @param {Object} $ - Cheerio instance
 * @param {string} baseUrl - Base URL
 * @param {Object} client - Axios client
 * @returns {Promise<boolean>} - Whether site is WordPress
 */
async function checkWordPress($, baseUrl, client) {
  // Check for WordPress meta generator
  if ($('meta[name="generator"][content*="WordPress"]').length > 0) {
    return true;
  }
  
  // Check for common WordPress paths
  try {
    // Check for wp-login.php
    const loginResponse = await client.head(`${baseUrl}/wp-login.php`);
    if (loginResponse.status === 200) {
      return true;
    }
    
    // Check for wp-admin directory
    const adminResponse = await client.head(`${baseUrl}/wp-admin/`);
    if (adminResponse.status === 200 || adminResponse.status === 302) {
      return true;
    }
    
    // Check for wp-includes/js/jquery/jquery.js
    const jqueryResponse = await client.head(`${baseUrl}/wp-includes/js/jquery/jquery.js`);
    if (jqueryResponse.status === 200) {
      return true;
    }
  } catch (error) {
    logger.debug(`Error checking WordPress paths: ${error.message}`);
  }
  
  // Check for WordPress specific CSS
  if ($('link[href*="wp-content/themes"]').length > 0 || 
      $('link[href*="wp-includes"]').length > 0) {
    return true;
  }
  
  // Check for WordPress comments
  if ($('body').html().includes('wp-content') || $('body').html().includes('wp-includes')) {
    return true;
  }
  
  return false;
}

/**
 * Detect WordPress version and check for vulnerabilities
 * @param {Object} $ - Cheerio instance
 * @param {string} baseUrl - Base URL
 * @param {Object} client - Axios client
 * @returns {Promise<Array>} - WordPress details with vulnerabilities
 */
async function detectWordPress($, baseUrl, client) {
  const results = [
    {
      framework: 'WordPress',
      type: 'cms',
      version: null,
      isOutdated: null,
      vulnerabilities: [],
      detectionMethod: 'signature'
    }
  ];
  
  // Try to detect version from meta generator
  const generator = $('meta[name="generator"][content*="WordPress"]').attr('content');
  if (generator) {
    const match = generator.match(/WordPress\s+(\d+\.\d+(?:\.\d+)?)/i);
    if (match) {
      results[0].version = match[1];
      results[0].detectionMethod = 'meta';
    }
  }
  
  // If version not found, try to detect from the readme.html file
  if (!results[0].version) {
    try {
      const readmeResponse = await client.get(`${baseUrl}/readme.html`);
      if (readmeResponse.status === 200) {
        const readmeContent = readmeResponse.data;
        const readmeMatch = readmeContent.match(/Version\s+(\d+\.\d+(?:\.\d+)?)/i);
        
        if (readmeMatch) {
          results[0].version = readmeMatch[1];
          results[0].detectionMethod = 'readme';
        }
      }
    } catch (error) {
      logger.debug(`Error checking WordPress readme: ${error.message}`);
    }
  }
  
  // Check for outdated status and vulnerabilities
  if (results[0].version) {
    // Check for outdated status
    const outdatedInfo = versionAnalyzer.checkOutdatedVersion(
      'webApplications',
      'wordpress',
      results[0].version,
      versionDb
    );
    
    if (outdatedInfo) {
      results[0].isOutdated = outdatedInfo.isOutdated;
      results[0].latestVersion = outdatedInfo.latestVersion;
      
      if (outdatedInfo.latestInBranch) {
        results[0].latestInBranch = outdatedInfo.latestInBranch;
      }
      
      if (outdatedInfo.eol) {
        results[0].eol = outdatedInfo.eol;
      }
    }
    
    // Check for vulnerabilities
    const vulnerabilities = versionAnalyzer.findVulnerabilities(
      'webApplications',
      'wordpress',
      results[0].version,
      versionDb
    );
    
    if (vulnerabilities) {
      results[0].vulnerabilities = vulnerabilities;
    }
  }
  
  // Detect WordPress plugins
  try {
    const plugins = await detectWordPressPlugins($, baseUrl, client);
    results.push(...plugins);
  } catch (error) {
    logger.debug(`Error detecting WordPress plugins: ${error.message}`);
  }
  
  // Detect WordPress theme
  try {
    const theme = detectWordPressTheme($);
    if (theme) {
      results.push(theme);
    }
  } catch (error) {
    logger.debug(`Error detecting WordPress theme: ${error.message}`);
  }
  
  return results;
}

/**
 * Detect WordPress plugins
 * @param {Object} $ - Cheerio instance
 * @param {string} baseUrl - Base URL
 * @param {Object} client - Axios client
 * @returns {Promise<Array>} - Detected plugins
 */
async function detectWordPressPlugins($, baseUrl, client) {
  const plugins = [];
  
  // Look for plugins in link tags
  $('link[href*="wp-content/plugins/"]').each((index, element) => {
    const href = $(element).attr('href');
    const match = href.match(/wp-content\/plugins\/([^\/]+)/i);
    
    if (match) {
      const pluginName = match[1];
      if (!plugins.some(p => p.name === pluginName)) {
        plugins.push({
          framework: `WordPress Plugin: ${pluginName}`,
          type: 'plugin',
          name: pluginName,
          version: null,
          detectionMethod: 'link'
        });
      }
    }
  });
  
  // Look for plugins in script tags
  $('script[src*="wp-content/plugins/"]').each((index, element) => {
    const src = $(element).attr('src');
    const match = src.match(/wp-content\/plugins\/([^\/]+)/i);
    
    if (match) {
      const pluginName = match[1];
      if (!plugins.some(p => p.name === pluginName)) {
        plugins.push({
          framework: `WordPress Plugin: ${pluginName}`,
          type: 'plugin',
          name: pluginName,
          version: null,
          detectionMethod: 'script'
        });
      }
    }
  });
  
  return plugins;
}

/**
 * Detect WordPress theme
 * @param {Object} $ - Cheerio instance
 * @returns {Object|null} - Detected theme or null
 */
function detectWordPressTheme($) {
  // Look for theme in link tags
  const themeLink = $('link[href*="wp-content/themes/"]').first();
  
  if (themeLink.length) {
    const href = themeLink.attr('href');
    const match = href.match(/wp-content\/themes\/([^\/]+)/i);
    
    if (match) {
      return {
        framework: `WordPress Theme: ${match[1]}`,
        type: 'theme',
        name: match[1],
        version: null,
        detectionMethod: 'link'
      };
    }
  }
  
  // Check for theme in body class
  const bodyClass = $('body').attr('class');
  if (bodyClass) {
    const match = bodyClass.match(/theme-([a-z0-9-]+)/i);
    if (match) {
      return {
        framework: `WordPress Theme: ${match[1]}`,
        type: 'theme',
        name: match[1],
        version: null,
        detectionMethod: 'body-class'
      };
    }
  }
  
  return null;
}

/**
 * Check if a site is powered by Drupal
 * @param {Object} $ - Cheerio instance
 * @param {string} baseUrl - Base URL
 * @param {Object} client - Axios client
 * @returns {Promise<boolean>} - Whether site is Drupal
 */
async function checkDrupal($, baseUrl, client) {
  // Check for Drupal patterns in CSS/JS paths
  if (
    $('link[href*="/sites/all/themes/"]').length > 0 ||
    $('link[href*="/sites/default/files/"]').length > 0 ||
    $('script[src*="/sites/all/modules/"]').length > 0 ||
    $('script[src*="/sites/default/files/"]').length > 0
  ) {
    return true;
  }
  
  // Check for Drupal settings
  if ($('body').html().includes('Drupal.settings')) {
    return true;
  }
  
  // Check for generator meta tag
  if ($('meta[name="Generator"][content*="Drupal"]').length > 0) {
    return true;
  }
  
  // Check common Drupal paths
  try {
    const adminResponse = await client.head(`${baseUrl}/admin`);
    if (adminResponse.status === 200 || adminResponse.status === 403) {
      return true;
    }
    
    const userResponse = await client.head(`${baseUrl}/user`);
    if (userResponse.status === 200 || userResponse.status === 403) {
      return true;
    }
    
    const nodeResponse = await client.head(`${baseUrl}/node`);
    if (nodeResponse.status === 200) {
      return true;
    }
  } catch (error) {
    logger.debug(`Error checking Drupal paths: ${error.message}`);
  }
  
  return false;
}

/**
 * Detect Drupal version and check for vulnerabilities
 * @param {Object} $ - Cheerio instance
 * @param {string} baseUrl - Base URL
 * @param {Object} client - Axios client
 * @returns {Promise<Array>} - Drupal details with vulnerabilities
 */
async function detectDrupal($, baseUrl, client) {
  const results = [
    {
      framework: 'Drupal',
      type: 'cms',
      version: null,
      isOutdated: null,
      vulnerabilities: [],
      detectionMethod: 'signature'
    }
  ];
  
  // Try to detect version from meta generator
  const generator = $('meta[name="Generator"][content*="Drupal"]').attr('content');
  if (generator) {
    const match = generator.match(/Drupal\s+(\d+)\s+\(([^)]+)\)/i);
    if (match) {
      results[0].version = match[1];
      results[0].detectionMethod = 'meta';
    }
  }
  
  // Try to detect from CHANGELOG.txt
  if (!results[0].version) {
    try {
      const changelogResponse = await client.get(`${baseUrl}/CHANGELOG.txt`);
      if (changelogResponse.status === 200) {
        const changelogContent = changelogResponse.data;
        
        // Check for Drupal 7
        const drupal7Match = changelogContent.match(/Drupal 7\.(\d+),/i);
        if (drupal7Match) {
          results[0].version = `7.${drupal7Match[1]}`;
          results[0].detectionMethod = 'changelog';
        } else {
          // Check for Drupal 8/9/10
          const drupalOtherMatch = changelogContent.match(/Drupal (\d+)\.(\d+)\.(\d+)/i);
          if (drupalOtherMatch) {
            results[0].version = `${drupalOtherMatch[1]}.${drupalOtherMatch[2]}.${drupalOtherMatch[3]}`;
            results[0].detectionMethod = 'changelog';
          }
        }
      }
    } catch (error) {
      logger.debug(`Error checking Drupal changelog: ${error.message}`);
    }
  }
  
  // Try to detect from the pages source
  if (!results[0].version) {
    // Check for Drupal 7 pattern
    if ($('body').html().includes('Drupal.settings')) {
      results[0].version = '7.x';
      results[0].detectionMethod = 'pattern';
    } 
    // Check for Drupal 8+ pattern
    else if ($('body').html().includes('drupal-settings-json')) {
      // Try to determine if it's 8, 9, or 10
      if ($('body').html().includes('drupal-settings-json') && !$('body').html().includes('drupal-once')) {
        results[0].version = '8.x';
      } else if ($('body').html().includes('drupal-once')) {
        results[0].version = '9.x+';
      }
      results[0].detectionMethod = 'pattern';
    }
  }
  
  // Check for outdated status and vulnerabilities if we have a version
  if (results[0].version) {
    // Extract major version
    const majorVersion = results[0].version.split('.')[0];
    
    // Check for outdated status
    const outdatedInfo = versionAnalyzer.checkOutdatedVersion(
      'webApplications',
      'drupal',
      majorVersion,
      versionDb
    );
    
    if (outdatedInfo) {
      results[0].isOutdated = outdatedInfo.isOutdated;
      results[0].latestVersion = outdatedInfo.latestVersion;
      
      if (outdatedInfo.latestInBranch) {
        results[0].latestInBranch = outdatedInfo.latestInBranch;
      }
      
      if (outdatedInfo.eol) {
        results[0].eol = outdatedInfo.eol;
      }
    }
    
    // Check for vulnerabilities
    const vulnerabilities = versionAnalyzer.findVulnerabilities(
      'webApplications',
      'drupal',
      majorVersion,
      versionDb
    );
    
    if (vulnerabilities) {
      results[0].vulnerabilities = vulnerabilities;
    }
  }
  
  return results;
}

/**
 * Check if a site is powered by Joomla
 * @param {Object} $ - Cheerio instance
 * @param {string} baseUrl - Base URL
 * @param {Object} client - Axios client
 * @returns {Promise<boolean>} - Whether site is Joomla
 */
async function checkJoomla($, baseUrl, client) {
  // Check for Joomla meta generator
  if ($('meta[name="generator"][content*="Joomla"]').length > 0) {
    return true;
  }
  
  // Check for Joomla common paths in resources
  if (
    $('script[src*="/media/jui/"]').length > 0 ||
    $('script[src*="/media/system/js/"]').length > 0 ||
    $('link[href*="/media/system/css/"]').length > 0 ||
    $('link[href*="/templates/"]').length > 0
  ) {
    return true;
  }
  
  // Check for Joomla specific directories
  try {
    const adminResponse = await client.head(`${baseUrl}/administrator/`);
    if (adminResponse.status === 200 || adminResponse.status === 301 || adminResponse.status === 302) {
      return true;
    }
    
    const mediaResponse = await client.head(`${baseUrl}/media/system/js/core.js`);
    if (mediaResponse.status === 200) {
      return true;
    }
    
    const componentsResponse = await client.head(`${baseUrl}/components/`);
    if (componentsResponse.status === 200 || componentsResponse.status === 403) {
      return true;
    }
  } catch (error) {
    logger.debug(`Error checking Joomla paths: ${error.message}`);
  }
  
  return false;
}

/**
 * Detect Joomla version and check for vulnerabilities
 * @param {Object} $ - Cheerio instance
 * @param {string} baseUrl - Base URL
 * @param {Object} client - Axios client
 * @returns {Promise<Array>} - Joomla details with vulnerabilities
 */
async function detectJoomla($, baseUrl, client) {
  const results = [
    {
      framework: 'Joomla',
      type: 'cms',
      version: null,
      isOutdated: null,
      vulnerabilities: [],
      detectionMethod: 'signature'
    }
  ];
  
  // Try to detect version from meta generator
  const generator = $('meta[name="generator"][content*="Joomla"]').attr('content');
  if (generator) {
    const match = generator.match(/Joomla!?\s+([\d.]+)/i);
    if (match) {
      results[0].version = match[1];
      results[0].detectionMethod = 'meta';
    }
  }
  
  // Try to detect from XML manifest
  if (!results[0].version) {
    try {
      const manifestResponse = await client.get(`${baseUrl}/administrator/manifests/files/joomla.xml`);
      if (manifestResponse.status === 200) {
        const manifestContent = manifestResponse.data;
        const versionMatch = manifestContent.match(/<version>([\d.]+)<\/version>/i);
        
        if (versionMatch) {
          results[0].version = versionMatch[1];
          results[0].detectionMethod = 'manifest';
        }
      }
    } catch (error) {
      logger.debug(`Error checking Joomla manifest: ${error.message}`);
    }
  }
  
  // Check for outdated status and vulnerabilities if we have a version
  if (results[0].version) {
    const majorVersion = results[0].version.split('.')[0];
    
    // Check for outdated status
    const outdatedInfo = versionAnalyzer.checkOutdatedVersion(
      'webApplications',
      'joomla',
      `${majorVersion}.x`,
      versionDb
    );
    
    if (outdatedInfo) {
      results[0].isOutdated = outdatedInfo.isOutdated;
      results[0].latestVersion = outdatedInfo.latestVersion;
      
      if (outdatedInfo.latestInBranch) {
        results[0].latestInBranch = outdatedInfo.latestInBranch;
      }
      
      if (outdatedInfo.eol) {
        results[0].eol = outdatedInfo.eol;
      }
    }
    
    // Check for vulnerabilities
    const vulnerabilities = versionAnalyzer.findVulnerabilities(
      'webApplications',
      'joomla',
      `${majorVersion}.x`,
      versionDb
    );
    
    if (vulnerabilities) {
      results[0].vulnerabilities = vulnerabilities;
    }
  }
  
  return results;
}

/**
 * Detect JavaScript frameworks from HTML
 * @param {Object} $ - Cheerio instance
 * @param {string} html - HTML content
 * @returns {Array} - Detected JS frameworks
 */
function detectJavaScriptFrameworks($, html) {
  const frameworks = [];
  
  // jQuery detection
  const jqueryVersionMatch = html.match(/jquery[.-]([0-9.]+)(?:\.min)?\.js/i) ||
                           html.match(/jQuery v([0-9.]+)/i);
                           
  if (jqueryVersionMatch) {
    const version = jqueryVersionMatch[1];
    const framework = {
      framework: 'jQuery',
      type: 'javascript-library',
      version: version,
      detectionMethod: 'script'
    };
    
    // Check for outdated status
    const outdatedInfo = versionAnalyzer.checkOutdatedVersion(
      'jsLibraries',
      'jquery',
      version,
      versionDb
    );
    
    if (outdatedInfo) {
      framework.isOutdated = outdatedInfo.isOutdated;
      framework.latestVersion = outdatedInfo.latestVersion;
      
      if (outdatedInfo.latestInBranch) {
        framework.latestInBranch = outdatedInfo.latestInBranch;
      }
      
      if (outdatedInfo.eol) {
        framework.eol = outdatedInfo.eol;
      }
    }
    
    // Check for vulnerabilities
    const vulnerabilities = versionAnalyzer.findVulnerabilities(
      'jsLibraries',
      'jquery',
      version,
      versionDb
    );
    
    if (vulnerabilities) {
      framework.vulnerabilities = vulnerabilities;
    }
    
    frameworks.push(framework);
  }
  
  // Bootstrap detection
  const bootstrapVersionMatch = html.match(/bootstrap[.-]([0-9.]+)(?:\.min)?\.(?:js|css)/i) ||
                              html.match(/Bootstrap v([0-9.]+)/i);
                              
  if (bootstrapVersionMatch) {
    const version = bootstrapVersionMatch[1];
    const framework = {
      framework: 'Bootstrap',
      type: 'css-framework',
      version: version,
      detectionMethod: 'script'
    };
    
    // Check for outdated status
    const outdatedInfo = versionAnalyzer.checkOutdatedVersion(
      'jsLibraries',
      'bootstrap',
      version,
      versionDb
    );
    
    if (outdatedInfo) {
      framework.isOutdated = outdatedInfo.isOutdated;
      framework.latestVersion = outdatedInfo.latestVersion;
      
      if (outdatedInfo.latestInBranch) {
        framework.latestInBranch = outdatedInfo.latestInBranch;
      }
      
      if (outdatedInfo.eol) {
        framework.eol = outdatedInfo.eol;
      }
    }
    
    // Check for vulnerabilities
    const vulnerabilities = versionAnalyzer.findVulnerabilities(
      'jsLibraries',
      'bootstrap',
      version,
      versionDb
    );
    
    if (vulnerabilities) {
      framework.vulnerabilities = vulnerabilities;
    }
    
    frameworks.push(framework);
  }
  
  // React detection
  if (html.includes('react.js') || html.includes('react-dom.js') ||
      html.includes('react.min.js') || html.includes('react-dom.min.js') ||
      html.match(/\bReact\b/) || $('[data-reactroot]').length > 0 ||
      $('[data-reactid]').length > 0) {
    
    let version = null;
    const reactVersionMatch = html.match(/react(?:-dom)?(?:\.production|\.development)?\.(min\.)?js\?v=([0-9.]+)/i) ||
                             html.match(/react@([0-9.]+)\/(?:umd|dist|build)\//i);
                             
    if (reactVersionMatch) {
      version = reactVersionMatch[2] || reactVersionMatch[1];
    }
    
    frameworks.push({
      framework: 'React',
      type: 'javascript-framework',
      version: version,
      detectionMethod: 'script'
    });
  }
  
  // Vue.js detection
  if (html.includes('vue.js') || html.includes('vue.min.js') || 
      $('[v-cloak]').length > 0 || $('[v-for]').length > 0 || 
      $('[v-if]').length > 0 || html.match(/\bVue\b/)) {
    
    let version = null;
    const vueVersionMatch = html.match(/vue(?:\.runtime|\.common)?(?:\.esm)?(?:\.prod|\.dev)?\.(min\.)?js\?v=([0-9.]+)/i) ||
                           html.match(/vue@([0-9.]+)(?:\/dist)?/i);
                           
    if (vueVersionMatch) {
      version = vueVersionMatch[2] || vueVersionMatch[1];
    }
    
    frameworks.push({
      framework: 'Vue.js',
      type: 'javascript-framework',
      version: version,
      detectionMethod: 'script'
    });
  }
  
  // Angular detection
  if (html.includes('angular.js') || html.includes('angular.min.js') || 
      $('[ng-app]').length > 0 || $('[ng-controller]').length > 0 || 
      $('[ng-model]').length > 0 || html.includes('ng-')) {
    
    let version = null;
    const angularVersionMatch = html.match(/angular(?:\.min)?\.js\?v=([0-9.]+)/i) ||
                               html.match(/angular@([0-9.]+)\/(?:angular|bundles)/i);
    
    if (angularVersionMatch) {
      version = angularVersionMatch[1];
    }
    
    // Determine if it's AngularJS (1.x) or Angular (2+)
    let frameworkName = 'Angular';
    if (version && version.startsWith('1.')) {
      frameworkName = 'AngularJS';
    } else if (!version && $('[ng-app]').length > 0) {
      frameworkName = 'AngularJS';
      version = '1.x';
    }
    
    frameworks.push({
      framework: frameworkName,
      type: 'javascript-framework',
      version: version,
      detectionMethod: 'script'
    });
  }
  
  return frameworks;
}

/**
 * Detect CSS frameworks from HTML
 * @param {Object} $ - Cheerio instance
 * @param {string} html - HTML content
 * @returns {Array} - Detected CSS frameworks
 */
function detectCSSFrameworks($, html) {
  const frameworks = [];
  
  // Bootstrap (already covered in JS frameworks)
  
  // Foundation
  if (html.includes('foundation.') || $('[data-foundation]').length > 0 ||
      $('link[href*="foundation"]').length > 0) {
    
    let version = null;
    const foundationVersionMatch = html.match(/foundation\.([0-9.]+)(?:\.min)?\.(?:js|css)/i) ||
                                  html.match(/foundation@([0-9.]+)\/dist/i);
                                 
    if (foundationVersionMatch) {
      version = foundationVersionMatch[1];
    }
    
    frameworks.push({
      framework: 'Foundation',
      type: 'css-framework',
      version: version,
      detectionMethod: 'script'
    });
  }
  
  // Bulma
  if ($('link[href*="bulma"]').length > 0 || html.includes('bulma.css') || 
      html.includes('bulma.min.css') || $('link[href*="bulma"]').length > 0) {
    
    let version = null;
    const bulmaVersionMatch = html.match(/bulma[\.-]([0-9.]+)(?:\.min)?\.css/i) ||
                              html.match(/bulma@([0-9.]+)\/css/i);
                             
    if (bulmaVersionMatch) {
      version = bulmaVersionMatch[1];
    }
    
    frameworks.push({
      framework: 'Bulma',
      type: 'css-framework',
      version: version,
      detectionMethod: 'link'
    });
  }
  
  // Materialize
  if ($('link[href*="materialize"]').length > 0 || html.includes('materialize.css') || 
      html.includes('materialize.min.css') || html.includes('materialize.js')) {
    
    let version = null;
    const materializeVersionMatch = html.match(/materialize[\.-]([0-9.]+)(?:\.min)?\.(?:js|css)/i);
                             
    if (materializeVersionMatch) {
      version = materializeVersionMatch[1];
    }
    
    frameworks.push({
      framework: 'Materialize',
      type: 'css-framework',
      version: version,
      detectionMethod: 'link'
    });
  }
  
  // Tailwind
  if (html.includes('tailwind') || $('link[href*="tailwind"]').length > 0 || 
     $('[class*="tw-"]').length > 0) {
    
    let version = null;
    const tailwindVersionMatch = html.match(/tailwindcss[@\.-]([0-9.]+)/i);
                             
    if (tailwindVersionMatch) {
      version = tailwindVersionMatch[1];
    }
    
    frameworks.push({
      framework: 'Tailwind CSS',
      type: 'css-framework',
      version: version,
      detectionMethod: 'link'
    });
  }
  
  return frameworks;
}

/**
 * Detect server-side frameworks from HTTP headers
 * @param {Object} headers - HTTP response headers
 * @returns {Array} - Detected server frameworks
 */
function detectServerFrameworks(headers) {
  const frameworks = [];
  
  // PHP
  if (headers['x-powered-by'] && headers['x-powered-by'].includes('PHP/')) {
    const phpVersion = headers['x-powered-by'].match(/PHP\/([0-9.]+)/);
    
    if (phpVersion) {
      const version = phpVersion[1];
      const framework = {
        framework: 'PHP',
        type: 'server-language',
        version: version,
        detectionMethod: 'header'
      };
      
      // Check for outdated status
      const outdatedInfo = versionAnalyzer.checkOutdatedVersion(
        'programmingLanguages',
        'php',
        version,
        versionDb
      );
      
      if (outdatedInfo) {
        framework.isOutdated = outdatedInfo.isOutdated;
        framework.latestVersion = outdatedInfo.latestVersion;
        
        if (outdatedInfo.latestInBranch) {
          framework.latestInBranch = outdatedInfo.latestInBranch;
        }
        
        if (outdatedInfo.eol) {
          framework.eol = outdatedInfo.eol;
        }
      }
      
      // Check for vulnerabilities
      const vulnerabilities = versionAnalyzer.findVulnerabilities(
        'programmingLanguages',
        'php',
        version,
        versionDb
      );
      
      if (vulnerabilities) {
        framework.vulnerabilities = vulnerabilities;
      }
      
      frameworks.push(framework);
    }
  }
  
  // ASP.NET
  if ((headers['x-powered-by'] && headers['x-powered-by'].includes('ASP.NET')) || 
      headers['x-aspnet-version']) {
    
    let version = null;
    
    if (headers['x-aspnet-version']) {
      version = headers['x-aspnet-version'];
    } else if (headers['x-powered-by'] && headers['x-powered-by'].includes('ASP.NET')) {
      const aspNetMatch = headers['x-powered-by'].match(/ASP\.NET(?:\/([0-9.]+))?/i);
      if (aspNetMatch && aspNetMatch[1]) {
        version = aspNetMatch[1];
      }
    }
    
    frameworks.push({
      framework: 'ASP.NET',
      type: 'server-framework',
      version: version,
      detectionMethod: 'header'
    });
  }
  
  // Laravel
  if (headers['set-cookie'] && headers['set-cookie'].includes('laravel_session')) {
    frameworks.push({
      framework: 'Laravel',
      type: 'server-framework',
      version: null,
      detectionMethod: 'cookie'
    });
  }
  
  // Express.js
  if (headers['x-powered-by'] && headers['x-powered-by'].includes('Express')) {
    let version = null;
    const expressMatch = headers['x-powered-by'].match(/Express(?:\/([0-9.]+))?/i);
    
    if (expressMatch && expressMatch[1]) {
      version = expressMatch[1];
    }
    
    frameworks.push({
      framework: 'Express.js',
      type: 'server-framework',
      version: version,
      detectionMethod: 'header'
    });
  }
  
  // Ruby on Rails
  if (headers['set-cookie'] && headers['set-cookie'].includes('_rails')) {
    frameworks.push({
      framework: 'Ruby on Rails',
      type: 'server-framework',
      version: null,
      detectionMethod: 'cookie'
    });
  }
  
  return frameworks;
}

module.exports = {
  detectFrameworks
};