#!/usr/bin/env node

/**
 * Swagger Debug Script
 * Diagnoses issues with Swagger API documentation
 */

const path = require('path');
const fs = require('fs');
const swaggerJsdoc = require('swagger-jsdoc');

console.log('🔍 Swagger Debug Script');
console.log('========================\n');

// Check if we're in the right directory
const currentDir = process.cwd();
console.log(`📁 Current Directory: ${currentDir}`);

// Check if swagger config exists
const swaggerConfigPath = path.join(currentDir, 'src', 'config', 'swagger.js');
console.log(`📄 Swagger Config Path: ${swaggerConfigPath}`);
console.log(`📄 Swagger Config Exists: ${fs.existsSync(swaggerConfigPath)}`);

if (!fs.existsSync(swaggerConfigPath)) {
  console.log('❌ Swagger config not found. Make sure you\'re running this from the api directory.');
  process.exit(1);
}

// Load swagger configuration
let swaggerConfig;
try {
  swaggerConfig = require(swaggerConfigPath);
  console.log('✅ Swagger config loaded successfully');
} catch (error) {
  console.log('❌ Error loading swagger config:', error.message);
  process.exit(1);
}

// Check swagger specs
console.log('\n🔧 Swagger Specs Analysis');
console.log('==========================');

try {
  const specs = swaggerConfig.specs;
  
  if (!specs) {
    console.log('❌ No specs found in swagger config');
    process.exit(1);
  }
  
  console.log('✅ Specs generated successfully');
  console.log(`📊 Total paths: ${Object.keys(specs.paths || {}).length}`);
  console.log(`📊 Total components: ${Object.keys(specs.components?.schemas || {}).length}`);
  console.log(`📊 Total tags: ${(specs.tags || []).length}`);
  
  // List all paths
  if (specs.paths && Object.keys(specs.paths).length > 0) {
    console.log('\n📋 Available API Paths:');
    Object.keys(specs.paths).forEach(path => {
      const methods = Object.keys(specs.paths[path]);
      console.log(`  ${path} [${methods.join(', ').toUpperCase()}]`);
    });
  } else {
    console.log('\n❌ No API paths found in specs');
  }
  
  // List all tags
  if (specs.tags && specs.tags.length > 0) {
    console.log('\n🏷️  Available Tags:');
    specs.tags.forEach(tag => {
      console.log(`  - ${tag.name}: ${tag.description || 'No description'}`);
    });
  }
  
} catch (error) {
  console.log('❌ Error analyzing specs:', error.message);
  console.log('Stack:', error.stack);
}

// Check file paths in swagger config
console.log('\n📂 File Path Analysis');
console.log('======================');

// Recreate the swagger options to test file paths
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Test API',
      version: '1.0.0',
    },
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js',
    './src/swagger/*.js',
  ],
};

console.log('🔍 Testing file paths...');

// Test each API path pattern
options.apis.forEach((apiPath, index) => {
  console.log(`\n${index + 1}. Testing: ${apiPath}`);
  
  // Convert glob pattern to actual file check
  if (apiPath.includes('*')) {
    const basePath = apiPath.replace('*.js', '');
    const fullPath = path.resolve(basePath);
    console.log(`   Resolved to: ${fullPath}`);
    console.log(`   Directory exists: ${fs.existsSync(fullPath)}`);
    
    if (fs.existsSync(fullPath)) {
      try {
        const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.js'));
        console.log(`   Found ${files.length} JS files`);
        if (files.length > 0) {
          console.log(`   Files: ${files.slice(0, 5).join(', ')}${files.length > 5 ? '...' : ''}`);
        }
      } catch (error) {
        console.log(`   Error reading directory: ${error.message}`);
      }
    }
  } else {
    const fullPath = path.resolve(apiPath);
    console.log(`   Resolved to: ${fullPath}`);
    console.log(`   File exists: ${fs.existsSync(fullPath)}`);
  }
});

// Test swagger-jsdoc directly with our paths
console.log('\n🧪 Testing swagger-jsdoc directly');
console.log('==================================');

try {
  const testSpecs = swaggerJsdoc(options);
  console.log('✅ swagger-jsdoc executed successfully');
  console.log(`📊 Paths found: ${Object.keys(testSpecs.paths || {}).length}`);
  
  if (Object.keys(testSpecs.paths || {}).length === 0) {
    console.log('\n⚠️  No paths found! This suggests:');
    console.log('   1. No Swagger comments in route files');
    console.log('   2. Incorrect file paths in swagger config');
    console.log('   3. Syntax errors in Swagger comments');
  }
  
} catch (error) {
  console.log('❌ swagger-jsdoc failed:', error.message);
}

// Check for swagger comments in route files
console.log('\n📝 Checking for Swagger Comments');
console.log('=================================');

const routesDir = path.resolve('./src/routes');
if (fs.existsSync(routesDir)) {
  const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
  console.log(`📁 Found ${routeFiles.length} route files`);
  
  let totalSwaggerComments = 0;
  
  routeFiles.slice(0, 10).forEach(file => { // Check first 10 files
    const filePath = path.join(routesDir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const swaggerComments = (content.match(/@swagger/g) || []).length;
      totalSwaggerComments += swaggerComments;
      
      if (swaggerComments > 0) {
        console.log(`   ✅ ${file}: ${swaggerComments} @swagger comments`);
      } else {
        console.log(`   ⚠️  ${file}: No @swagger comments`);
      }
    } catch (error) {
      console.log(`   ❌ ${file}: Error reading file`);
    }
  });
  
  console.log(`\n📊 Total @swagger comments found: ${totalSwaggerComments}`);
  
  if (totalSwaggerComments === 0) {
    console.log('\n❌ No Swagger comments found in route files!');
    console.log('   This is likely why your API docs are blank.');
    console.log('   Add @swagger comments to your route files.');
  }
  
} else {
  console.log('❌ Routes directory not found');
}

// Final recommendations
console.log('\n💡 Recommendations');
console.log('==================');

console.log('1. Check that your server is running on the correct port');
console.log('2. Visit http://localhost:3001/api-docs.json to see raw specs');
console.log('3. Ensure route files have @swagger comments');
console.log('4. Check browser console for JavaScript errors');
console.log('5. Try clearing browser cache');

console.log('\n🔗 Quick Test URLs:');
console.log('   - API Docs: http://localhost:3001/api-docs');
console.log('   - JSON Spec: http://localhost:3001/api-docs.json');
console.log('   - Health Check: http://localhost:3001/health');

console.log('\n✅ Debug script completed');
