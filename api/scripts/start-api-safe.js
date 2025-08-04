#!/usr/bin/env node

/**
 * Safe API Server Startup Script
 * Automatically kills any process using port 3001 and starts the API server
 */

const { spawn, exec } = require('child_process');
const readline = require('readline');
const path = require('path');
const fs = require('fs');

const PORT = 3001;
const API_DIR = path.join(__dirname, '..');

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
        // Parse Windows netstat output
        const lines = stdout.trim().split('\n');
        const pids = lines
          .map(line => {
            const parts = line.trim().split(/\s+/);
            return parts[parts.length - 1];
          })
          .filter(pid => pid && !isNaN(pid))
          .map(pid => parseInt(pid));
        resolve([...new Set(pids)]); // Remove duplicates
      } else {
        // Parse Unix lsof output
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

function getProcessName(pid) {
  return new Promise((resolve) => {
    const isWindows = process.platform === 'win32';
    const command = isWindows 
      ? `tasklist /FI "PID eq ${pid}" /FO CSV /NH`
      : `ps -p ${pid} -o comm=`;

    exec(command, (error, stdout) => {
      if (error || !stdout.trim()) {
        resolve('Unknown');
        return;
      }

      if (isWindows) {
        const parts = stdout.trim().split(',');
        resolve(parts[0] ? parts[0].replace(/"/g, '') : 'Unknown');
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().trim());
    });
  });
}

async function killProcessesOnPort(port, force = false) {
  colorLog(`🔍 Checking for processes using port ${port}...`, 'yellow');

  try {
    const pids = await findProcessOnPort(port);

    if (pids.length === 0) {
      colorLog(`✅ Port ${port} is available.`, 'green');
      return true;
    }

    for (const pid of pids) {
      const processName = await getProcessName(pid);
      colorLog(`❌ Found process using port ${port}: PID ${pid} (${processName})`, 'red');

      let shouldKill = force;
      if (!force) {
        const answer = await askQuestion(`Kill process ${pid} (${processName})? (y/N): `);
        shouldKill = answer === 'y' || answer === 'yes';
      }

      if (shouldKill) {
        const killed = await killProcess(pid);
        if (killed) {
          colorLog(`✅ Process ${pid} terminated successfully.`, 'green');
          // Wait a moment for the port to be released
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          colorLog(`⚠️  Failed to terminate process ${pid}`, 'red');
          return false;
        }
      } else {
        colorLog(`⏭️  Skipping process termination.`, 'yellow');
        return false;
      }
    }

    return true;
  } catch (error) {
    colorLog(`⚠️  Error checking port ${port}: ${error.message}`, 'red');
    return true; // Continue anyway
  }
}

function getNpmCommand() {
  // On Windows, npm might be npm.cmd
  const isWindows = process.platform === 'win32';
  return isWindows ? 'npm.cmd' : 'npm';
}

function startApiServer() {
  return new Promise((resolve, reject) => {
    colorLog('', 'reset');
    colorLog('🔄 Starting API server...', 'cyan');

    // Change to API directory
    process.chdir(API_DIR);

    // Check if package.json exists
    if (!fs.existsSync('package.json')) {
      reject(new Error(`package.json not found in ${API_DIR}`));
      return;
    }

    // Check if node_modules exists
    if (!fs.existsSync('node_modules')) {
      colorLog('📦 Installing dependencies...', 'yellow');
      const npmCmd = getNpmCommand();
      const install = spawn(npmCmd, ['install'], {
        stdio: 'inherit',
        shell: true // This helps with PATH issues
      });

      install.on('close', (code) => {
        if (code !== 0) {
          reject(new Error('Failed to install dependencies'));
          return;
        }
        startServer();
      });

      install.on('error', (error) => {
        colorLog(`⚠️  Error running npm install: ${error.message}`, 'red');
        colorLog('   Trying alternative method...', 'yellow');
        startServerDirect();
      });
    } else {
      startServer();
    }

    function startServer() {
      colorLog('🚀 Launching API server with nodemon...', 'green');
      colorLog('   Press Ctrl+C to stop the server', 'gray');
      colorLog('', 'reset');

      const npmCmd = getNpmCommand();
      const server = spawn(npmCmd, ['run', 'dev'], {
        stdio: 'inherit',
        shell: true // This helps with PATH issues
      });

      server.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`API server exited with code ${code}`));
        } else {
          resolve();
        }
      });

      server.on('error', (error) => {
        colorLog(`⚠️  Error running npm run dev: ${error.message}`, 'red');
        colorLog('   Trying alternative method...', 'yellow');
        startServerDirect();
      });
    }

    function startServerDirect() {
      colorLog('🔄 Starting server directly with nodemon...', 'yellow');

      // Try to run nodemon directly
      const nodemonPath = path.join(API_DIR, 'node_modules', '.bin', 'nodemon');
      const serverPath = path.join(API_DIR, 'server.js');

      let command, args;
      if (fs.existsSync(nodemonPath)) {
        command = nodemonPath;
        args = [serverPath];
      } else {
        // Fallback to node directly
        colorLog('   Nodemon not found, using node directly...', 'gray');
        command = 'node';
        args = [serverPath];
      }

      const server = spawn(command, args, {
        stdio: 'inherit',
        shell: true
      });

      server.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Server exited with code ${code}`));
        } else {
          resolve();
        }
      });

      server.on('error', (error) => {
        reject(new Error(`Failed to start server: ${error.message}`));
      });
    }
  });
}

async function main() {
  const force = process.argv.includes('--force') || process.argv.includes('-f');

  try {
    colorLog('🚀 Starting RAS Dashboard API Server...', 'cyan');
    colorLog(`📁 API Directory: ${API_DIR}`, 'gray');
    colorLog(`🔌 Target Port: ${PORT}`, 'gray');
    colorLog('', 'reset');

    // Kill processes on port if needed
    const portCleared = await killProcessesOnPort(PORT, force);

    if (portCleared) {
      // Wait a moment for port to be fully released
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Start the API server
      await startApiServer();
    } else {
      colorLog(`❌ Could not clear port ${PORT}. Exiting.`, 'red');
      process.exit(1);
    }
  } catch (error) {
    colorLog(`❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  colorLog('\n👋 Shutting down...', 'yellow');
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main };
