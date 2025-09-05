#!/usr/bin/env node

/**
 * API Consistency Fix Script
 * Automatically updates all client-side files to comply with API Client Consistency Guide
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Starting API Consistency Fix...\n');

// Configuration
const CLIENT_SRC_DIR = path.join(__dirname, '../client/src');
const PATTERNS_TO_FIX = [
  {
    name: 'Direct fetch() calls with hardcoded URLs',
    pattern: /fetch\s*\(\s*['"`]http:\/\/localhost:3001\/api\/v1([^'"`]*?)['"`]/g,
    replacement: (match, endpoint) => `apiClient.get('${endpoint}')`
  },
  {
    name: 'Direct fetch() POST calls',
    pattern: /fetch\s*\(\s*['"`]http:\/\/localhost:3001\/api\/v1([^'"`]*?)['"`]\s*,\s*\{\s*method:\s*['"`]POST['"`]/g,
    replacement: (match, endpoint) => `apiClient.post('${endpoint}'`
  },
  {
    name: 'Direct fetch() PUT calls',
    pattern: /fetch\s*\(\s*['"`]http:\/\/localhost:3001\/api\/v1([^'"`]*?)['"`]\s*,\s*\{\s*method:\s*['"`]PUT['"`]/g,
    replacement: (match, endpoint) => `apiClient.put('${endpoint}'`
  },
  {
    name: 'Direct fetch() DELETE calls',
    pattern: /fetch\s*\(\s*['"`]http:\/\/localhost:3001\/api\/v1([^'"`]*?)['"`]\s*,\s*\{\s*method:\s*['"`]DELETE['"`]/g,
    replacement: (match, endpoint) => `apiClient.delete('${endpoint}'`
  },
  {
    name: 'Hardcoded API_BASE_URL constants',
    pattern: /const\s+API_BASE_URL\s*=\s*['"`]http:\/\/localhost:3001\/api\/v1[^'"`]*['"`];?/g,
    replacement: ''
  },
  {
    name: 'API_BASE_URL usage in template literals',
    pattern: /\$\{API_BASE_URL\}([^}]*)/g,
    replacement: (match, endpoint) => `'${endpoint}'`
  }
];

// Files to exclude from automatic fixing (need manual review)
const EXCLUDE_FILES = [
  'apiClient.js',
  'apiCache.js',
  'config.js'
];

// Required imports to add
const REQUIRED_IMPORTS = {
  apiClient: "import { apiClient } from '@/utils/apiClient';",
  config: "import { log } from '@/utils/config';"
};

/**
 * Get all JavaScript/JSX files in client/src
 */
function getAllJSFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (stat.isFile() && /\.(js|jsx)$/.test(item)) {
        const relativePath = path.relative(CLIENT_SRC_DIR, fullPath);
        if (!EXCLUDE_FILES.some(exclude => relativePath.includes(exclude))) {
          files.push(fullPath);
        }
      }
    }
  }
  
  traverse(dir);
  return files;
}

/**
 * Check if file needs apiClient import
 */
function needsApiClientImport(content) {
  return (
    (content.includes('fetch(') || content.includes('apiClient.')) &&
    !content.includes("import { apiClient }")
  );
}

/**
 * Check if file needs config import
 */
function needsConfigImport(content) {
  return (
    (content.includes('console.log') || content.includes('log.')) &&
    !content.includes("import { log }")
  );
}

/**
 * Add required imports to file
 */
function addRequiredImports(content, filePath) {
  const lines = content.split('\n');
  let importInsertIndex = 0;
  
  // Find the last import statement
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      importInsertIndex = i + 1;
    } else if (lines[i].trim() === '' && importInsertIndex > 0) {
      // Skip empty lines after imports
      continue;
    } else if (importInsertIndex > 0) {
      break;
    }
  }
  
  const importsToAdd = [];
  
  if (needsApiClientImport(content)) {
    importsToAdd.push(REQUIRED_IMPORTS.apiClient);
  }
  
  if (needsConfigImport(content)) {
    importsToAdd.push(REQUIRED_IMPORTS.config);
  }
  
  if (importsToAdd.length > 0) {
    lines.splice(importInsertIndex, 0, ...importsToAdd);
    console.log(`  ✅ Added imports: ${importsToAdd.join(', ')}`);
  }
  
  return lines.join('\n');
}

/**
 * Apply pattern fixes to content
 */
function applyPatternFixes(content, filePath) {
  let modifiedContent = content;
  let changesCount = 0;
  
  for (const pattern of PATTERNS_TO_FIX) {
    const matches = modifiedContent.match(pattern.pattern);
    if (matches) {
      console.log(`  🔧 Fixing: ${pattern.name} (${matches.length} occurrences)`);
      
      if (typeof pattern.replacement === 'function') {
        modifiedContent = modifiedContent.replace(pattern.pattern, pattern.replacement);
      } else {
        modifiedContent = modifiedContent.replace(pattern.pattern, pattern.replacement);
      }
      
      changesCount += matches.length;
    }
  }
  
  return { content: modifiedContent, changes: changesCount };
}

/**
 * Fix console.log to use log utility
 */
function fixLogging(content) {
  // Replace console.log with log.info for API-related logs
  const apiLogPattern = /console\.log\s*\(\s*['"`]🌐[^'"`]*['"`]/g;
  const errorLogPattern = /console\.error\s*\(\s*['"`]❌[^'"`]*['"`]/g;
  
  let modifiedContent = content;
  
  modifiedContent = modifiedContent.replace(apiLogPattern, (match) => {
    return match.replace('console.log', 'log.api');
  });
  
  modifiedContent = modifiedContent.replace(errorLogPattern, (match) => {
    return match.replace('console.error', 'log.error');
  });
  
  return modifiedContent;
}

/**
 * Process a single file
 */
function processFile(filePath) {
  const relativePath = path.relative(CLIENT_SRC_DIR, filePath);
  console.log(`\n📄 Processing: ${relativePath}`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Apply pattern fixes
    const { content: fixedContent, changes } = applyPatternFixes(content, filePath);
    content = fixedContent;
    
    // Fix logging
    content = fixLogging(content);
    
    // Add required imports
    content = addRequiredImports(content, filePath);
    
    // Write back if changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  ✅ Updated with ${changes} fixes`);
      return true;
    } else {
      console.log(`  ℹ️  No changes needed`);
      return false;
    }
    
  } catch (error) {
    console.error(`  ❌ Error processing ${relativePath}:`, error.message);
    return false;
  }
}

/**
 * Main execution
 */
function main() {
  try {
    const jsFiles = getAllJSFiles(CLIENT_SRC_DIR);
    console.log(`📊 Found ${jsFiles.length} JavaScript/JSX files to process\n`);
    
    let processedCount = 0;
    let updatedCount = 0;
    
    for (const filePath of jsFiles) {
      const wasUpdated = processFile(filePath);
      processedCount++;
      if (wasUpdated) updatedCount++;
    }
    
    console.log('\n🎉 API Consistency Fix Complete!');
    console.log(`📊 Processed: ${processedCount} files`);
    console.log(`✅ Updated: ${updatedCount} files`);
    console.log(`ℹ️  No changes: ${processedCount - updatedCount} files`);
    
    // Run validation
    console.log('\n🔍 Running validation...');
    try {
      execSync('npm run lint --prefix client', { stdio: 'inherit' });
      console.log('✅ Linting passed');
    } catch (error) {
      console.log('⚠️  Linting found issues - please review manually');
    }
    
    console.log('\n📋 Next Steps:');
    console.log('1. Review the changes made to ensure correctness');
    console.log('2. Test the application to ensure API calls work');
    console.log('3. Run the full test suite');
    console.log('4. Commit the changes');
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { processFile, getAllJSFiles };
