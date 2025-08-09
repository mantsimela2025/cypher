/**
 * OS Patch Detector module
 * Provides utilities for detecting OS patch levels and missing security updates
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);
const logger = require('../logger');
const versionDb = require('../../data/version-database');

/**
 * Detect operating system type and version
 * @param {string} target - Target host
 * @param {Object} sshClient - SSH client for authenticated scanning
 * @returns {Promise<Object>} - OS details including type, version, and patch level
 */
async function detectOS(target, sshClient = null) {
  const osInfo = {
    type: null,
    distribution: null,
    version: null,
    patchLevel: null,
    kernelVersion: null,
    endOfLife: null,
    missingPatches: []
  };
  
  try {
    if (!sshClient) {
      // Without SSH access, we have limited OS detection capabilities
      // We might only be able to make educated guesses based on other scans
      logger.debug(`OS detection without SSH access is limited. Using passive techniques.`);
      return osInfo;
    }
    
    // Check if it's Linux
    try {
      const { stdout: unameMOutput } = await executeSSHCommand(sshClient, 'uname -m');
      const { stdout: unameAOutput } = await executeSSHCommand(sshClient, 'uname -a');
      
      if (unameMOutput && unameAOutput) {
        osInfo.type = 'linux';
        osInfo.kernelVersion = unameAOutput.split(' ')[2] || null;
        
        // Check for common Linux distributions
        // Check for Debian-based systems
        try {
          const { stdout: lsbOutput } = await executeSSHCommand(sshClient, 'lsb_release -a 2>/dev/null || cat /etc/lsb-release 2>/dev/null');
          
          if (lsbOutput) {
            // Parse lsb_release output
            const distroMatch = lsbOutput.match(/Distributor ID:\s*(.*)/i) || lsbOutput.match(/DISTRIB_ID=(.*)/i);
            const versionMatch = lsbOutput.match(/Release:\s*(.*)/i) || lsbOutput.match(/DISTRIB_RELEASE=(.*)/i);
            const codename = lsbOutput.match(/Codename:\s*(.*)/i) || lsbOutput.match(/DISTRIB_CODENAME=(.*)/i);
            
            if (distroMatch) {
              osInfo.distribution = distroMatch[1].trim().toLowerCase();
            }
            
            if (versionMatch) {
              osInfo.version = versionMatch[1].trim();
            }
            
            if (codename) {
              osInfo.codename = codename[1].trim();
            }
            
            // Get Ubuntu/Debian patch level
            if (osInfo.distribution === 'ubuntu' || osInfo.distribution === 'debian') {
              await checkDebianPatchLevel(osInfo, sshClient);
            }
          }
        } catch (error) {
          logger.debug(`Error getting lsb_release information: ${error.message}`);
        }
        
        // Check for RedHat-based systems
        if (!osInfo.distribution) {
          try {
            const { stdout: redhatRelease } = await executeSSHCommand(sshClient, 'cat /etc/redhat-release 2>/dev/null');
            
            if (redhatRelease) {
              if (redhatRelease.toLowerCase().includes('centos')) {
                osInfo.distribution = 'centos';
              } else if (redhatRelease.toLowerCase().includes('red hat enterprise')) {
                osInfo.distribution = 'rhel';
              } else if (redhatRelease.toLowerCase().includes('fedora')) {
                osInfo.distribution = 'fedora';
              } else {
                osInfo.distribution = 'redhat-based';
              }
              
              // Extract version number
              const versionMatch = redhatRelease.match(/release\s+(\d+(\.\d+)?)/i);
              if (versionMatch) {
                osInfo.version = versionMatch[1];
              }
              
              // Check RHEL/CentOS patch level
              await checkRhelPatchLevel(osInfo, sshClient);
            }
          } catch (error) {
            logger.debug(`Error getting RedHat release information: ${error.message}`);
          }
        }
        
        // Check for other Linux distributions
        if (!osInfo.distribution) {
          try {
            const { stdout: osReleaseOutput } = await executeSSHCommand(sshClient, 'cat /etc/os-release 2>/dev/null');
            
            if (osReleaseOutput) {
              const nameMatch = osReleaseOutput.match(/^NAME="?(.*?)"?$/m);
              const versionMatch = osReleaseOutput.match(/^VERSION_ID="?(.*?)"?$/m);
              
              if (nameMatch) {
                const name = nameMatch[1].toLowerCase();
                
                if (name.includes('ubuntu')) {
                  osInfo.distribution = 'ubuntu';
                } else if (name.includes('debian')) {
                  osInfo.distribution = 'debian';
                } else if (name.includes('centos')) {
                  osInfo.distribution = 'centos';
                } else if (name.includes('fedora')) {
                  osInfo.distribution = 'fedora';
                } else if (name.includes('alpine')) {
                  osInfo.distribution = 'alpine';
                } else if (name.includes('arch')) {
                  osInfo.distribution = 'arch';
                } else if (name.includes('suse')) {
                  osInfo.distribution = 'suse';
                } else {
                  osInfo.distribution = name.trim();
                }
              }
              
              if (versionMatch) {
                osInfo.version = versionMatch[1];
              }
            }
          } catch (error) {
            logger.debug(`Error getting os-release information: ${error.message}`);
          }
        }
      }
    } catch (error) {
      logger.debug(`Error detecting Linux: ${error.message}`);
    }
    
    // Check if it's Windows (if we have access)
    if (!osInfo.type) {
      try {
        const { stdout: systemInfoOutput } = await executeSSHCommand(sshClient, 'systeminfo | findstr /B /C:"OS Name" /C:"OS Version"');
        
        if (systemInfoOutput && systemInfoOutput.toLowerCase().includes('windows')) {
          osInfo.type = 'windows';
          
          // Parse Windows version
          const osNameMatch = systemInfoOutput.match(/OS Name:\s*(.*)/i);
          const osVersionMatch = systemInfoOutput.match(/OS Version:\s*(.*)/i);
          
          if (osNameMatch) {
            const osName = osNameMatch[1].trim().toLowerCase();
            
            if (osName.includes('server')) {
              osInfo.distribution = 'windows_server';
              
              if (osName.includes('2019')) {
                osInfo.version = '2019';
              } else if (osName.includes('2022')) {
                osInfo.version = '2022';
              } else if (osName.includes('2016')) {
                osInfo.version = '2016';
              } else if (osName.includes('2012')) {
                osInfo.version = osName.includes('r2') ? '2012 R2' : '2012';
              }
            } else {
              osInfo.distribution = 'windows';
              
              if (osName.includes('11')) {
                osInfo.version = '11';
              } else if (osName.includes('10')) {
                osInfo.version = '10';
              } else if (osName.includes('8.1')) {
                osInfo.version = '8.1';
              } else if (osName.includes('8')) {
                osInfo.version = '8';
              } else if (osName.includes('7')) {
                osInfo.version = '7';
              }
            }
          }
          
          if (osVersionMatch) {
            // Extract build number from version string (e.g., 10.0.19044)
            const buildMatch = osVersionMatch[1].match(/(\d+\.\d+)\.(\d+)/);
            if (buildMatch) {
              osInfo.buildNumber = buildMatch[2];
              
              // Map Windows 10/11 build numbers to release names
              if (osInfo.distribution === 'windows' && (osInfo.version === '10' || osInfo.version === '11')) {
                osInfo.releaseName = getWindowsReleaseName(osInfo.buildNumber, osInfo.version);
              }
            }
          }
          
          // Check Windows patch level
          await checkWindowsPatchLevel(osInfo, sshClient);
        }
      } catch (error) {
        logger.debug(`Error detecting Windows: ${error.message}`);
      }
    }
    
    // Check for EOL status based on version database
    checkEOLStatus(osInfo);
    
  } catch (error) {
    logger.error(`OS detection error: ${error.message}`);
  }
  
  return osInfo;
}

/**
 * Execute a command over SSH
 * @param {Object} sshClient - SSH client
 * @param {string} command - Command to execute
 * @returns {Promise<Object>} - stdout and stderr
 */
async function executeSSHCommand(sshClient, command) {
  return new Promise((resolve, reject) => {
    sshClient.exec(command, (err, stream) => {
      if (err) return reject(err);
      
      let stdout = '';
      let stderr = '';
      
      stream.on('data', (data) => {
        stdout += data.toString();
      });
      
      stream.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      stream.on('close', (code) => {
        resolve({ stdout, stderr, code });
      });
    });
  });
}

/**
 * Check Debian/Ubuntu patch level
 * @param {Object} osInfo - OS information object to update
 * @param {Object} sshClient - SSH client
 * @returns {Promise<void>}
 */
async function checkDebianPatchLevel(osInfo, sshClient) {
  try {
    // Get security updates information
    const { stdout: securityUpdates } = await executeSSHCommand(sshClient, 
      'apt-get update -qq 2>/dev/null && apt-get --simulate --quiet upgrade | grep "Inst " | grep -i security | wc -l');
    
    if (securityUpdates) {
      const securityUpdateCount = parseInt(securityUpdates.trim(), 10);
      osInfo.securityUpdatesAvailable = securityUpdateCount;
      
      if (securityUpdateCount > 0) {
        // Get details of missing security updates
        const { stdout: securityDetails } = await executeSSHCommand(sshClient,
          'apt-get update -qq 2>/dev/null && apt-get --simulate --quiet upgrade | grep "Inst " | grep -i security');
        
        if (securityDetails) {
          const lines = securityDetails.trim().split('\n');
          for (const line of lines) {
            const packageMatch = line.match(/Inst\s+(\S+)\s+\[([^\]]+)\]\s+\(([^)]+)/);
            if (packageMatch) {
              osInfo.missingPatches.push({
                package: packageMatch[1],
                currentVersion: packageMatch[2],
                newVersion: packageMatch[3],
                severity: 'unknown'  // Debian/Ubuntu doesn't provide severity info in this output
              });
            }
          }
        }
      }
    }
    
    // Get specific Ubuntu version info (e.g., 20.04.5)
    if (osInfo.distribution === 'ubuntu') {
      const { stdout: lsbRelease } = await executeSSHCommand(sshClient, 'lsb_release -d');
      const descriptionMatch = lsbRelease.match(/Description:\s+Ubuntu\s+(\d+\.\d+\.\d+)/i);
      
      if (descriptionMatch) {
        osInfo.patchLevel = descriptionMatch[1];
      }
    }
  } catch (error) {
    logger.debug(`Error checking Debian/Ubuntu patch level: ${error.message}`);
  }
}

/**
 * Check RHEL/CentOS patch level
 * @param {Object} osInfo - OS information object to update
 * @param {Object} sshClient - SSH client
 * @returns {Promise<void>}
 */
async function checkRhelPatchLevel(osInfo, sshClient) {
  try {
    // Check if yum or dnf is available
    const { stdout: packageManager } = await executeSSHCommand(sshClient, 
      'command -v dnf >/dev/null && echo "dnf" || echo "yum"');
    
    const pm = packageManager.trim();
    
    // Get security updates
    const { stdout: securityUpdates } = await executeSSHCommand(sshClient,
      `${pm} check-update --security 2>/dev/null | grep -v "Loaded plugins" | grep -v "^$" | grep -v "^Last metadata" | wc -l`);
    
    if (securityUpdates) {
      const securityUpdateCount = parseInt(securityUpdates.trim(), 10);
      osInfo.securityUpdatesAvailable = securityUpdateCount;
      
      if (securityUpdateCount > 0) {
        // Get details of missing security updates
        const { stdout: securityDetails } = await executeSSHCommand(sshClient,
          `${pm} check-update --security 2>/dev/null | grep -v "Loaded plugins" | grep -v "^$" | grep -v "^Last metadata"`);
        
        if (securityDetails) {
          const lines = securityDetails.trim().split('\n');
          for (const line of lines) {
            // Format is: package-name.arch  version  repo
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 3) {
              const packageFullName = parts[0];
              const newVersion = parts[1];
              
              // Extract package name without architecture
              const packageName = packageFullName.split('.')[0];
              
              // Get current version
              const { stdout: currentVersion } = await executeSSHCommand(sshClient,
                `rpm -q --qf "%{VERSION}-%{RELEASE}" ${packageName} 2>/dev/null || echo "unknown"`);
              
              osInfo.missingPatches.push({
                package: packageName,
                currentVersion: currentVersion.trim(),
                newVersion: newVersion,
                severity: 'unknown'  // RHEL/CentOS doesn't provide severity info in this output
              });
            }
          }
        }
      }
    }
    
    // Get specific release version
    if (osInfo.distribution === 'centos' || osInfo.distribution === 'rhel') {
      const { stdout: releaseInfo } = await executeSSHCommand(sshClient, 'cat /etc/redhat-release');
      const releaseMatch = releaseInfo.match(/release\s+(\d+\.\d+(\.\d+)?)/i);
      
      if (releaseMatch) {
        osInfo.patchLevel = releaseMatch[1];
      }
    }
  } catch (error) {
    logger.debug(`Error checking RHEL/CentOS patch level: ${error.message}`);
  }
}

/**
 * Check Windows patch level
 * @param {Object} osInfo - OS information object to update
 * @param {Object} sshClient - SSH client
 * @returns {Promise<void>}
 */
async function checkWindowsPatchLevel(osInfo, sshClient) {
  try {
    // Get hotfix information
    const { stdout: hotfixOutput } = await executeSSHCommand(sshClient, 
      'wmic qfe list brief /format:table');
    
    if (hotfixOutput) {
      // Parse hotfix list
      const lines = hotfixOutput.trim().split('\n').filter(line => line.trim() !== '');
      
      if (lines.length > 1) {  // First line is header
        // Remove the header
        lines.shift();
        
        // Parse hotfixes
        osInfo.installedPatches = [];
        
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 4) {
            const hotfixId = parts[0];
            if (hotfixId.startsWith('KB')) {
              osInfo.installedPatches.push(hotfixId);
            }
          }
        }
        
        // Get the latest installed update
        if (osInfo.installedPatches.length > 0) {
          // Get latest Windows security update info
          const { stdout: latestUpdate } = await executeSSHCommand(sshClient,
            'wmic qfe get HotFixID,InstalledOn | sort');
          
          const updateLines = latestUpdate.trim().split('\n').filter(line => line.trim() !== '' && !line.includes('HotFixID'));
          
          if (updateLines.length > 0) {
            // Get the latest update by install date
            const latestUpdateInfo = updateLines[updateLines.length - 1].trim();
            const latestUpdateMatch = latestUpdateInfo.match(/KB\d+\s+(\d+\/\d+\/\d+)/);
            
            if (latestUpdateMatch) {
              osInfo.lastPatchDate = latestUpdateMatch[1];
            }
          }
        }
      }
    }
    
    // Check missing Windows updates using PowerShell if available
    try {
      const { stdout: psOutput } = await executeSSHCommand(sshClient,
        'powershell -Command "Get-WindowsUpdate -MicrosoftUpdate | Where-Object {$_.IsInstalled -eq $false -and $_.Classification -like \'*Security*\'} | Select-Object Title, Classification | Format-Table -AutoSize"');
      
      if (psOutput && !psOutput.includes('not recognized')) {
        const lines = psOutput.trim().split('\n').filter(
          line => line.trim() !== '' && 
          !line.includes('Title') && 
          !line.includes('---')
        );
        
        osInfo.missingPatches = lines.map(line => {
          return {
            title: line.trim(),
            severity: line.toLowerCase().includes('critical') ? 'critical' : 'high'
          };
        });
      }
    } catch (error) {
      logger.debug(`Error checking Windows updates with PowerShell: ${error.message}`);
    }
  } catch (error) {
    logger.debug(`Error checking Windows patch level: ${error.message}`);
  }
}

/**
 * Get Windows release name from build number
 * @param {string} buildNumber - Windows build number
 * @param {string} version - Windows version (10 or 11)
 * @returns {string|null} - Release name or null if unknown
 */
function getWindowsReleaseName(buildNumber, version) {
  const buildMap = {
    '10': {
      '10240': '1507',
      '10586': '1511',
      '14393': '1607',
      '15063': '1703',
      '16299': '1709',
      '17134': '1803',
      '17763': '1809',
      '18362': '1903',
      '18363': '1909',
      '19041': '2004',
      '19042': '20H2',
      '19043': '21H1',
      '19044': '21H2',
      '19045': '22H2'
    },
    '11': {
      '22000': '21H2',
      '22621': '22H2',
      '22631': '23H2'
    }
  };
  
  return buildMap[version] && buildMap[version][buildNumber] || null;
}

/**
 * Check if OS is end-of-life based on version database
 * @param {Object} osInfo - OS information object to update
 */
function checkEOLStatus(osInfo) {
  if (!osInfo.distribution || !osInfo.version) {
    return;
  }
  
  const osDb = versionDb.operatingSystems;
  
  if (osInfo.distribution === 'ubuntu' && osDb.ubuntu) {
    // Check Ubuntu EOL status
    const ubuntuVersion = osInfo.version;
    if (osDb.ubuntu.versions[ubuntuVersion]) {
      const versionInfo = osDb.ubuntu.versions[ubuntuVersion];
      osInfo.endOfLife = versionInfo.eol;
      osInfo.endOfSupportDate = versionInfo.endOfSupportDate;
      
      // Add known vulnerabilities for this version
      if (versionInfo.knownVulnerabilities) {
        for (const vuln of versionInfo.knownVulnerabilities) {
          osInfo.missingPatches.push({
            cve: vuln.cve,
            package: vuln.package,
            fixedInPackageVersion: vuln.fixedInPackageVersion,
            severity: vuln.severity,
            description: vuln.description
          });
        }
      }
    }
  } else if (osInfo.distribution === 'centos' && osDb.centos) {
    // Check CentOS EOL status
    const centosVersion = osInfo.version;
    if (osDb.centos.versions[centosVersion]) {
      const versionInfo = osDb.centos.versions[centosVersion];
      osInfo.endOfLife = versionInfo.eol;
      osInfo.endOfSupportDate = versionInfo.endOfSupportDate;
      
      // Add known vulnerabilities for this version
      if (versionInfo.knownVulnerabilities) {
        for (const vuln of versionInfo.knownVulnerabilities) {
          osInfo.missingPatches.push({
            cve: vuln.cve,
            package: vuln.package,
            fixedInPackageVersion: vuln.fixedInPackageVersion,
            severity: vuln.severity,
            description: vuln.description
          });
        }
      }
    }
  } else if (osInfo.distribution === 'windows' && osDb.windows) {
    // Check Windows EOL status
    const windowsVersion = osInfo.version;
    if (osDb.windows.versions[windowsVersion]) {
      const buildInfo = osDb.windows.versions[windowsVersion].builds;
      
      if (osInfo.buildNumber && buildInfo[osInfo.buildNumber]) {
        const versionInfo = buildInfo[osInfo.buildNumber];
        osInfo.endOfLife = versionInfo.eol;
        osInfo.endOfSupportDate = versionInfo.endOfSupportDate;
        osInfo.releaseName = versionInfo.name;
        
        // Add known vulnerabilities for this version
        if (versionInfo.knownVulnerabilities) {
          for (const vuln of versionInfo.knownVulnerabilities) {
            // Check if this KB is installed
            const isPatched = osInfo.installedPatches && 
                          osInfo.installedPatches.includes(vuln.kb);
            
            if (!isPatched) {
              osInfo.missingPatches.push({
                cve: vuln.cve,
                kb: vuln.kb,
                severity: vuln.severity,
                description: vuln.description
              });
            }
          }
        }
      }
    }
  }
}

module.exports = {
  detectOS
};