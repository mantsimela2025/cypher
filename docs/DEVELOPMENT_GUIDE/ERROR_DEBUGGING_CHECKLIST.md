# Error Debugging Checklist

## 🎯 Overview

This checklist helps identify and fix common errors in the CYPHER application, especially after the lazy loading and performance optimizations.

## 🔍 **Errors Found and Fixed**

### ✅ **Fixed Issues:**

1. **Missing React Import in useLazyLoad.js**
   - **Error**: `React.useEffect` used without importing React
   - **Fix**: Added `React` and `useEffect` to imports
   - **File**: `client/src/hooks/useLazyLoad.js`

2. **Duplicate Function Definition**
   - **Error**: `findUpper` function defined locally and imported
   - **Fix**: Removed local definition, kept import
   - **File**: `client/src/pages/admin/permissions/AdminPermissions.jsx`

3. **Unused State Variables**
   - **Error**: Old state variables conflicting with lazy loading
   - **Fix**: Removed unused `systems`, `loading`, `stats` state
   - **File**: `client/src/pages/systems/SystemsMain.jsx`

4. **Duplicate Fetch Functions**
   - **Error**: Old fetch functions alongside lazy loading
   - **Fix**: Removed old `fetchSystems` and `fetchStats` functions
   - **File**: `client/src/pages/systems/SystemsMain.jsx`

## 🚨 **Common Error Patterns to Check**

### 1. **Import/Export Errors**

**Check for:**
```javascript
// ❌ Missing imports
import { useState } from 'react'; // Missing useEffect
useEffect(() => {}, []); // Error: useEffect not imported

// ✅ Correct imports
import React, { useState, useEffect } from 'react';
```

**Debug Command:**
```bash
# Check for import errors
grep -r "useEffect\|useCallback\|useRef" client/src --include="*.jsx" --include="*.js" | grep -v "import"
```

### 2. **Lazy Loading Hook Errors**

**Check for:**
```javascript
// ❌ Missing async/await
const dataLazyLoad = useLazyLoadOnDemand(() => {
  return apiCall(); // Should be async
});

// ✅ Correct usage
const dataLazyLoad = useLazyLoadOnDemand(async () => {
  const response = await apiCall();
  return response.data;
});
```

### 3. **Component State Conflicts**

**Check for:**
```javascript
// ❌ Conflicting state management
const [data, setData] = useState([]);
const dataLazyLoad = useLazyLoadOnDemand(fetchData);
// Both managing the same data!

// ✅ Use only lazy loading
const dataLazyLoad = useLazyLoadOnDemand(fetchData);
```

### 4. **API Response Handling**

**Check for:**
```javascript
// ❌ Not handling API response structure
const response = await apiCall();
return response; // Might not have .data property

// ✅ Proper response handling
const response = await apiCall();
if (response.success) {
  return response.data;
}
throw new Error(response.error || 'API call failed');
```

## 🛠️ **Debugging Commands**

### **1. Check for Console Errors**
```bash
# Start the application and check browser console
npm run dev
# Look for:
# - Import/export errors
# - Undefined variable errors
# - API call failures
```

### **2. Check for Missing Dependencies**
```bash
# Check if all packages are installed
npm list --depth=0
# Look for missing or outdated packages
```

### **3. Check for TypeScript/ESLint Errors**
```bash
# Run linting
npm run lint
# Check for syntax errors and warnings
```

### **4. Check API Endpoints**
```bash
# Test API endpoints directly
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/v1/systems
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/v1/access-requests
```

## 🔍 **Browser Debugging Steps**

### **1. Open Developer Tools (F12)**

**Console Tab:**
- Look for red error messages
- Check for 404 (Not Found) errors
- Check for 500 (Server Error) responses
- Look for import/export errors

**Network Tab:**
- Check for failed API requests
- Look for slow requests (>2 seconds)
- Check request/response headers
- Verify authentication tokens

**Performance Tab:**
- Check for long tasks (>50ms)
- Monitor memory usage
- Check for memory leaks

### **2. React Developer Tools**

**Components Tab:**
- Check component state
- Verify props are passed correctly
- Look for unnecessary re-renders

**Profiler Tab:**
- Identify slow components
- Check render times
- Monitor component updates

## 🚀 **Performance Debugging**

### **Expected Performance Metrics:**
- **Initial Load**: <1 second
- **API Calls on Startup**: 0-2 calls
- **Time to Interactive**: <2 seconds

### **If Performance is Slow:**

1. **Check for Immediate Data Loading:**
```javascript
// ❌ This slows down startup
useEffect(() => {
  fetchData();
}, []);

// ✅ Use lazy loading instead
const dataLazyLoad = useLazyLoadOnDemand(fetchData);
```

2. **Check for Multiple API Calls:**
```javascript
// Add to main App component to monitor
useEffect(() => {
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.name.includes('/api/')) {
        console.log(`📡 API: ${entry.name} - ${entry.duration.toFixed(2)}ms`);
      }
    });
  });
  observer.observe({ entryTypes: ['resource'] });
  return () => observer.disconnect();
}, []);
```

## 🔧 **Quick Fix Commands**

### **1. Clear Cache and Restart**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Restart development server
npm run dev
```

### **2. Reset Database Connection**
```bash
# Check database connection
curl http://localhost:3001/health

# Restart API server
cd api
npm run dev
```

### **3. Check Environment Variables**
```bash
# Verify environment variables are set
echo $NODE_ENV
echo $DATABASE_URL
# Check .env files exist and are properly configured
```

## 📋 **Error Prevention Checklist**

### **Before Committing Code:**
- [ ] All imports are correct and used
- [ ] No duplicate function definitions
- [ ] Lazy loading hooks used instead of useEffect for data fetching
- [ ] API responses properly handled
- [ ] Console shows no errors
- [ ] Performance metrics are acceptable

### **Before Deploying:**
- [ ] All tests pass
- [ ] No console errors in production build
- [ ] API endpoints respond correctly
- [ ] Authentication works properly
- [ ] Performance benchmarks met

## 🆘 **Emergency Debugging**

### **If Application Won't Start:**
1. Check package.json scripts
2. Verify all dependencies installed
3. Check for syntax errors in main files
4. Clear cache and reinstall dependencies

### **If API Calls Fail:**
1. Check API server is running (port 3001)
2. Verify authentication tokens
3. Check network connectivity
4. Review API endpoint URLs

### **If Performance is Poor:**
1. Check for immediate data loading on mount
2. Monitor API calls during startup
3. Use browser performance tools
4. Check for memory leaks

---

**Last Updated:** December 2024  
**Status:** ✅ **All Known Issues Fixed**  
**Next Review:** After major code changes
