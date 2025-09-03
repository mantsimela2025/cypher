/**
 * Utility function to reset menu collapsed state
 * This can be used for testing or when you want to reset to default state
 */

export const resetMenuCollapsedState = () => {
  localStorage.removeItem('menuCollapsedSections');
  console.log('Menu collapsed state has been reset. Please refresh the page to see the default state.');
};

export const setDefaultMenuState = () => {
  const defaultState = {
    "Dashboards": true,
    "Systems Management": false,
    "Asset Management": false,
    "Vulnerability Mgmt": true,
    "Patch Management": true,
    "Scan Management": true,
    "Compliance Management": false,
    "Policy Management": true,
    "Document Management": true,
    "DASHBOARD & METRICS": true,
    "Admin Management": true
  };
  
  localStorage.setItem('menuCollapsedSections', JSON.stringify(defaultState));
  console.log('Menu state set to default. Please refresh the page to see the changes.');
};

// For debugging - log current menu state
export const logCurrentMenuState = () => {
  const saved = localStorage.getItem('menuCollapsedSections');
  if (saved) {
    console.log('Current menu state:', JSON.parse(saved));
  } else {
    console.log('No saved menu state found. Using default state.');
  }
};

// Make functions available globally for console testing
if (typeof window !== 'undefined') {
  window.resetMenuState = resetMenuCollapsedState;
  window.setDefaultMenuState = setDefaultMenuState;
  window.logMenuState = logCurrentMenuState;
}
