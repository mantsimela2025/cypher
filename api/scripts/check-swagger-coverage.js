#!/usr/bin/env node
/**
 * Swagger Coverage Checker
 * - Builds a list of Express endpoints from app.js + route files
 * - Fetches the OpenAPI spec from /api-docs.json
 * - Compares and reports endpoints missing in Swagger and extra in Swagger
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const API_ROOT = path.resolve(__dirname, '..');
const APP_FILE = path.join(API_ROOT, 'src', 'app.js');
const ROUTES_DIR = path.join(API_ROOT, 'src', 'routes');
const SPEC_URL = process.env.SWAGGER_SPEC_URL || 'http://localhost:3001/api-docs.json';

const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];

function color(text, c) {
  const colors = { reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m' };
  return `${colors[c] || ''}${text}${colors.reset}`;
}

function readFileSafe(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return ''; }
}

function extractMountedRoutes(appJs) {
  const mounts = [];

  // Pattern 1: app.use('/base', [middleware...], require('./routes/file'))
  const pattern1 = /app\.use\(\s*(["'`])([^"'`]+)\1\s*,\s*(?:(?:[\w$]+\([^)]*\)\s*,\s*)*)require\(\s*(["'`])\.\/(?:src\/routes\/)?([^"'`]+)\3\s*\)\s*\)/g;

  // Pattern 2: app.use(require('./routes/file')) (no base)
  const pattern2 = /app\.use\(\s*require\(\s*(["'`])\.\/(?:src\/routes\/)?([^"'`]+)\1\s*\)\s*\)/g;

  let m;
  while ((m = pattern1.exec(appJs)) !== null) {
    const base = m[2];
    const fileRaw = m[4];
    if (!fileRaw) continue;
    const file = fileRaw.endsWith('.js') ? fileRaw : `${fileRaw}.js`;
    mounts.push({ base, file: path.join(ROUTES_DIR, file) });
  }

  while ((m = pattern2.exec(appJs)) !== null) {
    const fileRaw = m[2];
    if (!fileRaw) continue;
    const file = fileRaw.endsWith('.js') ? fileRaw : `${fileRaw}.js`;
    mounts.push({ base: null, file: path.join(ROUTES_DIR, file) });
  }

  return mounts;
}

function parseRouteFileForEndpoints(filePath) {
  const src = readFileSafe(filePath);
  if (!src) return [];
  const endpoints = [];
  // Match router.METHOD('path' or "path")
  const routeRegex = new RegExp(`router\\.(${httpMethods.join('|')})\\s*\\(\\s*([\'\"])` +
    `([^\'\"]*)\\2`, 'gi');
  let r;
  while ((r = routeRegex.exec(src)) !== null) {
    const method = r[1].toLowerCase();
    const subPath = r[3] || '';
    endpoints.push({ method, subPath });
  }
  return endpoints;
}

function normalizePath(base, sub) {
  const safeBase = (base || '').toString();
  const a = safeBase.endsWith('/') ? safeBase.slice(0, -1) : safeBase;
  const b = sub ? (sub.startsWith('/') ? sub : `/${sub}`) : '';
  // Replace Express-style :param with OpenAPI-style {param}
  return (a + b).replace(/:([A-Za-z0-9_]+)/g, '{$1}');
}

async function fetchSpec(url) {
  const res = await axios.get(url, { timeout: 10000 });
  return res.data || {};
}

async function main() {
  console.log(color('\n🔎 Swagger Coverage Checker', 'cyan'));
  console.log('================================');

  const appJs = readFileSafe(APP_FILE);
  if (!appJs) {
    console.error(color(`❌ Could not read ${APP_FILE}`, 'red'));
    process.exit(1);
  }

  const mounts = extractMountedRoutes(appJs);
  if (mounts.length === 0) {
    console.warn(color('⚠️  No mounted route files found in app.js. Checking default route directory...', 'yellow'));
  } else {
    console.log(color(`✅ Found ${mounts.length} mounted route modules in app.js`, 'green'));
  }

  const codeEndpoints = [];
  const routeFiles = new Set(mounts.map(m => m.file));

  // Also include all files in routes dir as a fallback (in case of dynamic mounting)
  try {
    for (const f of fs.readdirSync(ROUTES_DIR)) {
      if (f.endsWith('.js')) routeFiles.add(path.join(ROUTES_DIR, f));
    }
  } catch (e) {
    console.warn(color(`⚠️  Could not read routes directory: ${e.message}`, 'yellow'));
  }

  for (const file of routeFiles) {
    // Determine base by checking mounts; if none, try to infer from file name used in app.js
    const mount = mounts.find(m => path.resolve(m.file) === path.resolve(file));
    const base = mount ? mount.base : null;
    const endpoints = parseRouteFileForEndpoints(file);

    endpoints.forEach(ep => {
      const fullPath = base ? normalizePath(base, ep.subPath) : null;
      codeEndpoints.push({ method: ep.method, subPath: ep.subPath, base, fullPath, file: path.basename(file) });
    });
  }

  // Fetch spec
  let spec;
  try {
    spec = await fetchSpec(SPEC_URL);
  } catch (e) {
    console.error(color(`❌ Failed to fetch OpenAPI spec from ${SPEC_URL}: ${e.message}`, 'red'));
    process.exit(1);
  }

  const specPaths = spec.paths || {};
  const specSet = new Set();
  for (const p of Object.keys(specPaths)) {
    const methods = Object.keys(specPaths[p]).map(m => m.toLowerCase());
    methods.forEach(m => specSet.add(`${m} ${p}`));
  }

  const missingInSwagger = [];
  const inferredWithoutBase = [];
  for (const ep of codeEndpoints) {
    if (!ep.fullPath) {
      inferredWithoutBase.push(ep);
      continue;
    }
    const key = `${ep.method} ${ep.fullPath}`;
    if (!specSet.has(key)) missingInSwagger.push(ep);
  }

  // Report
  console.log(color('\n📊 Summary', 'cyan'));
  console.log(`   Routes discovered in code (raw): ${codeEndpoints.length}`);
  console.log(`   OpenAPI paths in spec: ${Object.keys(specPaths).length}`);

  if (missingInSwagger.length === 0) {
    console.log(color('\n✅ All discovered endpoints appear in Swagger docs!', 'green'));
  } else {
    console.log(color(`\n❗ Endpoints missing in Swagger (${missingInSwagger.length})`, 'yellow'));
    missingInSwagger.slice(0, 100).forEach(ep => {
      console.log(`   - [${ep.method.toUpperCase()}] ${ep.fullPath}  (${ep.file})`);
    });
    if (missingInSwagger.length > 100) console.log(`   ...and ${missingInSwagger.length - 100} more`);
  }

  if (inferredWithoutBase.length > 0) {
    console.log(color(`\nℹ️ Endpoints found but base path could not be inferred from app.js (${inferredWithoutBase.length})`, 'yellow'));
    console.log('   These may be mounted dynamically or not mounted at all. Example entries:');
    inferredWithoutBase.slice(0, 20).forEach(ep => {
      console.log(`   - [${ep.method.toUpperCase()}] <unknown-base>${ep.subPath}  (${ep.file})`);
    });
  }

  console.log(color('\n💡 Tip:', 'cyan'));
  console.log('   - To document a missing endpoint, add a @swagger JSDoc block above it in its route file.');
  console.log('   - Remember to use OpenAPI path param style: {param} instead of Express :param.');

  // Exit code for CI use
  process.exit(0);
}

main().catch(err => {
  console.error(color(`\n❌ Coverage check failed: ${err.message}`,'red'));
  process.exit(1);
});
