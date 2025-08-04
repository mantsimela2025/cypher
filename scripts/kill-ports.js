#!/usr/bin/env node

/**
 * Kill processes on ports 3000 and 3001
 * Ensures clean startup for both API and Client
 */

const { exec } = require('child_process');

const PORTS = [3000, 3001];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function colorLog(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
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

async function clearPort(port) {
  colorLog(`🔍 Checking port ${port}...`, 'yellow');
  
  const pids = await findProcessOnPort(port);
  
  if (pids.length === 0) {
    colorLog(`✅ Port ${port} is available`, 'green');
    return true;
  }

  colorLog(`❌ Found ${pids.length} process(es) using port ${port}`, 'red');
  
  for (const pid of pids) {
    colorLog(`   Killing process ${pid}...`, 'yellow');
    const killed = await killProcess(pid);
    if (killed) {
      colorLog(`   ✅ Process ${pid} terminated`, 'green');
    } else {
      colorLog(`   ⚠️  Failed to kill process ${pid}`, 'red');
    }
  }
  
  return true;
}

async function main() {
  colorLog('🧹 Clearing ports for RAS Dashboard...', 'cyan');
  colorLog('', 'reset');

  for (const port of PORTS) {
    await clearPort(port);
  }

  colorLog('', 'reset');
  colorLog('✅ Port cleanup complete!', 'green');
  colorLog('   Port 3000: Client (Frontend)', 'cyan');
  colorLog('   Port 3001: API (Backend)', 'cyan');
}

if (require.main === module) {
  main().catch(error => {
    colorLog(`❌ Error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { main };
