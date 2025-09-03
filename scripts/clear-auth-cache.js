#!/usr/bin/env node

/**
 * Clear Authentication Cache Script
 * Clears browser localStorage to force fresh authentication
 */

console.log('🧹 Authentication Cache Cleaner');
console.log('================================');
console.log('');
console.log('To clear your authentication cache:');
console.log('');
console.log('1. Open your browser Developer Tools (F12)');
console.log('2. Go to the Console tab');
console.log('3. Paste and run this command:');
console.log('');
console.log('   localStorage.clear(); location.reload();');
console.log('');
console.log('Or manually clear these items:');
console.log('- localStorage.removeItem("accessToken");');
console.log('- localStorage.removeItem("refreshToken");');
console.log('- localStorage.removeItem("user");');
console.log('- localStorage.removeItem("authBypassDisabled");');
console.log('');
console.log('This will force the application to show the login screen.');
console.log('');

// Check if we can determine the current AUTH_BYPASS setting
const fs = require('fs');
const path = require('path');

try {
  const envPath = path.join(__dirname, '../api/.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const authBypassMatch = envContent.match(/AUTH_BYPASS\s*=\s*(.+)/);
    
    if (authBypassMatch) {
      const authBypassValue = authBypassMatch[1].trim();
      console.log(`Current AUTH_BYPASS setting: ${authBypassValue}`);
      
      if (authBypassValue.toLowerCase() === 'true') {
        console.log('⚠️  AUTH_BYPASS is currently ENABLED');
        console.log('   To disable it, change AUTH_BYPASS=false in api/.env');
      } else {
        console.log('✅ AUTH_BYPASS is currently DISABLED');
        console.log('   Login screen should appear after clearing cache');
      }
    }
  }
} catch (error) {
  console.log('Could not read .env file to check AUTH_BYPASS setting');
}

console.log('');
console.log('After clearing cache, restart the development server:');
console.log('npm run dev:fast');
