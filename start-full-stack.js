#!/usr/bin/env node

/**
 * Full Stack Startup Script
 * Starts both API server (port 3001) and Client (port 3000) simultaneously
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const API_PORT = 3001;
const CLIENT_PORT = 3000;
const ROOT_DIR = __dirname;
const API_DIR = path.join(ROOT_DIR, 'api');
const CLIENT_DIR = path.join(ROOT_DIR, 'client');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function colorLog(message, color = 'reset', prefix = '') {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors.gray}[${timestamp}]${colors.reset} ${prefix}${colors[color]}${message}${colors.reset}`);
}

function findProcessOnPort(port) {
  return new Promise((resolve) => {
    const isWindows = process.platform === 'win32';
    const command = isWindows 
      ? `netstat -aon | findstr :${port}`
      : `lsof -ti:${port}`;

    exec(command, (error, stdout) => {
      if (error || !stdout.trim()) {
        resolve([]);
        return;
      }

      if (isWindows) {
        const lines = stdout.trim().split('\n');
        const pids = lines
          .map(line => {
            const parts = line.trim().split(/\s+/);
            return parts[parts.length - 1];
          })
          .filter(pid => pid && !isNaN(pid))
          .map(pid => parseInt(pid));
        resolve([...new Set(pids)]);
      } else {
        const pids = stdout.trim().split('\n')
          .filter(pid => pid && !isNaN(pid))
          .map(pid => parseInt(pid));
        resolve(pids);
      }
    });
  });
}

function killProcess(pid) {
  return new Promise((resolve) => {
    const isWindows = process.platform === 'win32';
    const command = isWindows ? `taskkill /PID ${pid} /F` : `kill -9 ${pid}`;

    exec(command, (error) => {
      resolve(!error);
    });
  });
}

async function clearPort(port, serviceName) {
  colorLog(`🔍 Checking port ${port} for ${serviceName}...`, 'yellow');
  
  const pids = await findProcessOnPort(port);
  
  if (pids.length === 0) {
    colorLog(`✅ Port ${port} is available for ${serviceName}`, 'green');
    return true;
  }

  colorLog(`❌ Port ${port} is in use by ${pids.length} process(es)`, 'red');
  
  for (const pid of pids) {
    colorLog(`   Killing process ${pid}...`, 'yellow');
    const killed = await killProcess(pid);
    if (killed) {
      colorLog(`   ✅ Process ${pid} terminated`, 'green');
    } else {
      colorLog(`   ⚠️  Failed to kill process ${pid}`, 'red');
    }
  }
  
  // Wait for ports to be released
  await new Promise(resolve => setTimeout(resolve, 2000));
  return true;
}

function startService(serviceName, directory, command, args, port) {
  return new Promise((resolve, reject) => {
    colorLog(`🚀 Starting ${serviceName}...`, 'cyan', `[${serviceName.toUpperCase()}] `);
    
    // Check if directory exists
    if (!fs.existsSync(directory)) {
      reject(new Error(`Directory not found: ${directory}`));
      return;
    }

    // Check if package.json exists
    const packageJsonPath = path.join(directory, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      reject(new Error(`package.json not found in ${directory}`));
      return;
    }

    // Start the service
    const service = spawn(command, args, {
      cwd: directory,
      stdio: 'pipe',
      shell: true
    });

    let started = false;

    // Handle stdout
    service.stdout.on('data', (data) => {
      const output = data.toString();
      
      // Check for startup indicators
      if (!started) {
        if (
          (serviceName === 'API' && (output.includes('Server is running') || output.includes('listening'))) ||
          (serviceName === 'Client' && (output.includes('Local:') || output.includes('ready in')))
        ) {
          started = true;
          colorLog(`✅ ${serviceName} started successfully on port ${port}`, 'green', `[${serviceName.toUpperCase()}] `);
          resolve();
        }
      }

      // Log output with service prefix
      output.split('\n').forEach(line => {
        if (line.trim()) {
          colorLog(line.trim(), 'reset', `[${serviceName.toUpperCase()}] `);
        }
      });
    });

    // Handle stderr
    service.stderr.on('data', (data) => {
      const output = data.toString();
      output.split('\n').forEach(line => {
        if (line.trim()) {
          colorLog(line.trim(), 'red', `[${serviceName.toUpperCase()}] `);
        }
      });
    });

    // Handle service exit
    service.on('close', (code) => {
      if (code !== 0) {
        colorLog(`❌ ${serviceName} exited with code ${code}`, 'red', `[${serviceName.toUpperCase()}] `);
        if (!started) {
          reject(new Error(`${serviceName} failed to start`));
        }
      }
    });

    // Handle service error
    service.on('error', (error) => {
      colorLog(`❌ ${serviceName} error: ${error.message}`, 'red', `[${serviceName.toUpperCase()}] `);
      if (!started) {
        reject(error);
      }
    });

    // Timeout after 30 seconds if not started
    setTimeout(() => {
      if (!started) {
        colorLog(`⏰ ${serviceName} startup timeout`, 'yellow', `[${serviceName.toUpperCase()}] `);
        resolve(); // Continue anyway
      }
    }, 30000);
  });
}

async function main() {
  try {
    colorLog('🚀 Starting RAS Dashboard Full Stack...', 'cyan');
    colorLog(`📁 Root Directory: ${ROOT_DIR}`, 'gray');
    colorLog(`🔧 API Directory: ${API_DIR}`, 'gray');
    colorLog(`🖥️  Client Directory: ${CLIENT_DIR}`, 'gray');
    colorLog('', 'reset');

    // Clear ports
    await clearPort(API_PORT, 'API Server');
    await clearPort(CLIENT_PORT, 'Client');

    colorLog('', 'reset');
    colorLog('🔄 Starting services...', 'cyan');
    colorLog('', 'reset');

    // Start both services simultaneously
    const apiPromise = startService('API', API_DIR, 'npm', ['run', 'dev'], API_PORT);
    const clientPromise = startService('Client', CLIENT_DIR, 'npm', ['run', 'dev'], CLIENT_PORT);

    // Wait for both to start
    await Promise.all([apiPromise, clientPromise]);

    colorLog('', 'reset');
    colorLog('🎉 Full stack started successfully!', 'green');
    colorLog('', 'reset');
    colorLog('📊 Services:', 'cyan');
    colorLog(`   🔧 API Server:  http://localhost:${API_PORT}`, 'blue');
    colorLog(`   🖥️  Client:      http://localhost:${CLIENT_PORT}`, 'blue');
    colorLog(`   📚 API Docs:    http://localhost:${API_PORT}/api-docs`, 'blue');
    colorLog(`   🏥 Health:      http://localhost:${API_PORT}/health`, 'blue');
    colorLog('', 'reset');
    colorLog('💡 Press Ctrl+C to stop both services', 'yellow');
    colorLog('', 'reset');

  } catch (error) {
    colorLog(`❌ Startup failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  colorLog('', 'reset');
  colorLog('👋 Shutting down full stack...', 'yellow');
  
  // Kill all child processes
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  colorLog(`❌ Uncaught exception: ${error.message}`, 'red');
  process.exit(1);
});

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main };
