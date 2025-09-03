/**
 * Reset Menu Cache Script
 * Run this in browser console to clear cached menu state
 */

// Clear the cached menu state
localStorage.removeItem('menuCollapsedSections');

// Set new default state with Compliance Management
const newDefaultState = {
  "Dashboards": true,
  "Systems Management": false,
  "Asset Management": false,
  "Vulnerability Mgmt": true,
  "Patch Management": true,
  "Scan Management": true,
  "Compliance Management": false, // New section - expanded by default
  "Policy Management": true,
  "Document Management": true,
  "DASHBOARD & METRICS": true,
  "Admin Management": true
};

localStorage.setItem('menuCollapsedSections', JSON.stringify(newDefaultState));

console.log('✅ Menu cache cleared and reset with Compliance Management section');
console.log('🔄 Please refresh the page to see the changes');

// Also log current menu state for debugging
console.log('Current menu state:', JSON.parse(localStorage.getItem('menuCollapsedSections')));
