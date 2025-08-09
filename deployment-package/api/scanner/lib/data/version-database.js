/**
 * Version Database module
 * Central storage for software version information, known vulnerabilities, and EOL status
 */

const versionDatabase = {
  // Web Servers
  webServers: {
    apache: {
      latestVersion: '2.4.57',
      branches: {
        '2.4': {
          latestVersion: '2.4.57',
          eol: false
        },
        '2.2': {
          latestVersion: '2.2.34',
          eol: true,
          endOfSupportDate: '2018-07-01'
        }
      },
      vulnerabilities: [
        {
          cve: 'CVE-2023-25690',
          affectedVersions: ['<2.4.56'],
          fixedInVersion: '2.4.56',
          description: 'HTTP Request Smuggling vulnerability in Apache HTTP Server',
          severity: 'high'
        },
        {
          cve: 'CVE-2022-31813',
          affectedVersions: ['<2.4.54'],
          fixedInVersion: '2.4.54',
          description: 'HTTP Request Smuggling in Apache HTTP Server',
          severity: 'medium'
        },
        {
          cve: 'CVE-2021-44790',
          affectedVersions: ['<2.4.52'],
          fixedInVersion: '2.4.52',
          description: 'Buffer overflow in mod_lua of Apache HTTP Server',
          severity: 'critical'
        }
      ]
    },
    nginx: {
      latestVersion: '1.24.0',
      branches: {
        '1.24': {
          latestVersion: '1.24.0',
          eol: false
        },
        '1.22': {
          latestVersion: '1.22.1',
          eol: false
        },
        '1.20': {
          latestVersion: '1.20.2',
          eol: false
        }
      },
      vulnerabilities: [
        {
          cve: 'CVE-2023-44487',
          affectedVersions: ['<1.24.0'],
          fixedInVersion: '1.24.0',
          description: 'HTTP/2 rapid reset can lead to denial of service',
          severity: 'high'
        },
        {
          cve: 'CVE-2021-23017',
          affectedVersions: ['<1.20.0'],
          fixedInVersion: '1.20.0',
          description: 'Nginx resolver buffer overflow',
          severity: 'critical'
        }
      ]
    },
    iis: {
      latestVersion: '10.0',
      branches: {
        '10.0': {
          latestVersion: '10.0',
          eol: false
        },
        '8.5': {
          latestVersion: '8.5',
          eol: false
        },
        '8.0': {
          latestVersion: '8.0',
          eol: true,
          endOfSupportDate: '2023-01-10'
        },
        '7.5': {
          latestVersion: '7.5',
          eol: true,
          endOfSupportDate: '2020-01-14'
        }
      }
    }
  },
  
  // Databases
  databases: {
    mysql: {
      latestVersion: '8.0.33',
      branches: {
        '8.0': {
          latestVersion: '8.0.33',
          eol: false
        },
        '5.7': {
          latestVersion: '5.7.42',
          eol: false,
          endOfSupportDate: '2023-10-01'
        },
        '5.6': {
          latestVersion: '5.6.51',
          eol: true,
          endOfSupportDate: '2021-02-05'
        }
      },
      vulnerabilities: [
        {
          cve: 'CVE-2023-21971',
          affectedVersions: ['<8.0.32'],
          fixedInVersion: '8.0.32',
          description: 'Authentication bypass vulnerability in MySQL Server',
          severity: 'critical'
        },
        {
          cve: 'CVE-2022-21417',
          affectedVersions: ['<8.0.28', '<5.7.37'],
          fixedInVersion: '8.0.28',
          description: 'Remote DoS vulnerability in MySQL Server',
          severity: 'high'
        }
      ]
    },
    postgresql: {
      latestVersion: '15.3',
      branches: {
        '15': {
          latestVersion: '15.3',
          eol: false
        },
        '14': {
          latestVersion: '14.8',
          eol: false
        },
        '13': {
          latestVersion: '13.11',
          eol: false
        },
        '12': {
          latestVersion: '12.15',
          eol: false
        },
        '11': {
          latestVersion: '11.20',
          eol: false,
          endOfSupportDate: '2023-11-09'
        },
        '10': {
          latestVersion: '10.23',
          eol: true,
          endOfSupportDate: '2022-11-10'
        }
      },
      vulnerabilities: [
        {
          cve: 'CVE-2022-41862',
          affectedVersions: ['<15.1', '<14.6', '<13.10', '<12.14', '<11.19', '<10.24'],
          fixedInVersion: 'varies by version',
          description: 'Authentication bypass vulnerability in PostgreSQL',
          severity: 'high'
        }
      ]
    }
  },
  
  // Programming Languages
  programmingLanguages: {
    php: {
      latestVersion: '8.2.7',
      branches: {
        '8.2': {
          latestVersion: '8.2.7',
          eol: false
        },
        '8.1': {
          latestVersion: '8.1.20',
          eol: false,
          endOfSupportDate: '2024-11-25'
        },
        '8.0': {
          latestVersion: '8.0.28',
          eol: true,
          endOfSupportDate: '2023-11-26'
        },
        '7.4': {
          latestVersion: '7.4.33',
          eol: true,
          endOfSupportDate: '2022-11-28'
        },
        '7.3': {
          latestVersion: '7.3.33',
          eol: true,
          endOfSupportDate: '2021-12-06'
        }
      },
      vulnerabilities: [
        {
          cve: 'CVE-2023-3823',
          affectedVersions: ['<8.2.7', '<8.1.20', '<8.0.28'],
          fixedInVersion: 'varies by version',
          description: 'Use-after-free vulnerability in PHP',
          severity: 'high'
        },
        {
          cve: 'CVE-2023-0567',
          affectedVersions: ['<8.2.0', '<8.1.14', '<8.0.28'],
          fixedInVersion: 'varies by version',
          description: 'Heap buffer overflow in PHP',
          severity: 'high'
        }
      ]
    },
    python: {
      latestVersion: '3.11.4',
      branches: {
        '3.11': {
          latestVersion: '3.11.4',
          eol: false
        },
        '3.10': {
          latestVersion: '3.10.12',
          eol: false,
          endOfSupportDate: '2026-10-04'
        },
        '3.9': {
          latestVersion: '3.9.17',
          eol: false,
          endOfSupportDate: '2025-10-05'
        },
        '3.8': {
          latestVersion: '3.8.17',
          eol: false,
          endOfSupportDate: '2024-10-14'
        },
        '3.7': {
          latestVersion: '3.7.17',
          eol: true,
          endOfSupportDate: '2023-06-27'
        }
      }
    },
    nodejs: {
      latestVersion: '20.3.1',
      branches: {
        '20': {
          latestVersion: '20.3.1',
          eol: false,
          endOfSupportDate: '2026-04-30'
        },
        '18': {
          latestVersion: '18.16.1',
          eol: false,
          endOfSupportDate: '2025-04-30'
        },
        '16': {
          latestVersion: '16.20.1',
          eol: true,
          endOfSupportDate: '2023-09-11'
        },
        '14': {
          latestVersion: '14.21.3',
          eol: true,
          endOfSupportDate: '2023-04-30'
        }
      },
      vulnerabilities: [
        {
          cve: 'CVE-2023-30581',
          affectedVersions: ['>=18.0.0 <18.16.1', '>=19.0.0 <19.9.0', '>=20.0.0 <20.3.0'],
          fixedInVersion: 'varies by version',
          description: 'Buffer overflow in libuv affects Node.js',
          severity: 'high'
        }
      ]
    }
  },
  
  // JavaScript Libraries
  jsLibraries: {
    jquery: {
      latestVersion: '3.7.0',
      branches: {
        '3.x': {
          latestVersion: '3.7.0',
          eol: false
        },
        '2.x': {
          latestVersion: '2.2.4',
          eol: true,
          endOfSupportDate: '2018-12-31'
        },
        '1.x': {
          latestVersion: '1.12.4',
          eol: true,
          endOfSupportDate: '2018-12-31'
        }
      },
      vulnerabilities: [
        {
          cve: 'CVE-2020-11023',
          affectedVersions: ['<3.5.0'],
          fixedInVersion: '3.5.0',
          description: 'XSS vulnerability in jQuery',
          severity: 'high'
        },
        {
          cve: 'CVE-2020-11022',
          affectedVersions: ['<3.5.0'],
          fixedInVersion: '3.5.0',
          description: 'XSS vulnerability in jQuery',
          severity: 'high'
        },
        {
          cve: 'CVE-2019-11358',
          affectedVersions: ['<3.4.0'],
          fixedInVersion: '3.4.0',
          description: 'Prototype pollution in jQuery',
          severity: 'medium'
        }
      ]
    },
    bootstrap: {
      latestVersion: '5.3.0',
      branches: {
        '5.x': {
          latestVersion: '5.3.0',
          eol: false
        },
        '4.x': {
          latestVersion: '4.6.2',
          eol: false
        },
        '3.x': {
          latestVersion: '3.4.1',
          eol: true,
          endOfSupportDate: '2019-07-24'
        }
      },
      vulnerabilities: [
        {
          cve: 'CVE-2019-8331',
          affectedVersions: ['<3.4.1', '<4.3.1'],
          fixedInVersion: 'varies by version',
          description: 'XSS vulnerability in Bootstrap',
          severity: 'medium'
        }
      ]
    }
  },
  
  // Web Applications
  webApplications: {
    wordpress: {
      latestVersion: '6.2.2',
      branches: {
        '6.x': {
          latestVersion: '6.2.2',
          eol: false
        },
        '5.x': {
          latestVersion: '5.9.7',
          eol: false
        },
        '4.x': {
          latestVersion: '4.9.23',
          eol: true
        }
      },
      vulnerabilities: [
        {
          cve: 'CVE-2023-2745',
          affectedVersions: ['<6.2.1', '<6.1.3'],
          fixedInVersion: 'varies by version',
          description: 'Cross-site scripting vulnerability in WordPress',
          severity: 'high'
        },
        {
          cve: 'CVE-2022-3590',
          affectedVersions: ['<6.0.3', '<5.9.5', '<5.8.7'],
          fixedInVersion: 'varies by version',
          description: 'SQL injection vulnerability in WordPress',
          severity: 'critical'
        }
      ]
    },
    drupal: {
      latestVersion: '10.1.0',
      branches: {
        '10': {
          latestVersion: '10.1.0',
          eol: false
        },
        '9': {
          latestVersion: '9.5.9',
          eol: false,
          endOfSupportDate: '2023-11-01'
        },
        '8': {
          latestVersion: '8.9.20',
          eol: true,
          endOfSupportDate: '2021-11-02'
        },
        '7': {
          latestVersion: '7.95',
          eol: false,
          endOfSupportDate: '2025-01-05'
        }
      },
      vulnerabilities: [
        {
          cve: 'CVE-2022-41755',
          affectedVersions: ['<10.0.0', '<9.4.9'],
          fixedInVersion: 'varies by version',
          description: 'Access bypass vulnerability in Drupal',
          severity: 'high'
        }
      ]
    },
    joomla: {
      latestVersion: '4.3.1',
      branches: {
        '4.x': {
          latestVersion: '4.3.1',
          eol: false
        },
        '3.x': {
          latestVersion: '3.10.12',
          eol: false,
          endOfSupportDate: '2023-08-17'
        },
        '2.5.x': {
          latestVersion: '2.5.28',
          eol: true,
          endOfSupportDate: '2014-12-31'
        }
      },
      vulnerabilities: [
        {
          cve: 'CVE-2023-23752',
          affectedVersions: ['<4.2.8'],
          fixedInVersion: '4.2.8',
          description: 'Information disclosure vulnerability in Joomla',
          severity: 'critical'
        }
      ]
    }
  },
  
  // Operating Systems
  operatingSystems: {
    ubuntu: {
      versions: {
        '22.04': {
          name: 'Jammy Jellyfish',
          eol: false,
          endOfSupportDate: '2027-04-01',
          lts: true,
          kernelVersion: '5.15'
        },
        '20.04': {
          name: 'Focal Fossa',
          eol: false,
          endOfSupportDate: '2025-04-01',
          lts: true,
          kernelVersion: '5.4'
        },
        '18.04': {
          name: 'Bionic Beaver',
          eol: false,
          endOfSupportDate: '2023-04-01',
          lts: true,
          kernelVersion: '4.15'
        },
        '16.04': {
          name: 'Xenial Xerus',
          eol: true,
          endOfSupportDate: '2021-04-01',
          lts: true,
          kernelVersion: '4.4'
        }
      }
    },
    centos: {
      versions: {
        '9': {
          name: 'Stream',
          eol: false,
          endOfSupportDate: '2027-05-31'
        },
        '8': {
          name: 'Stream',
          eol: false,
          endOfSupportDate: '2024-05-31'
        },
        '7': {
          name: '',
          eol: false,
          endOfSupportDate: '2024-06-30'
        },
        '6': {
          name: '',
          eol: true,
          endOfSupportDate: '2020-11-30'
        }
      }
    },
    windows: {
      versions: {
        '11': {
          builds: {
            '22000': {
              name: '21H2',
              eol: false,
              endOfSupportDate: '2024-10-08'
            },
            '22621': {
              name: '22H2',
              eol: false,
              endOfSupportDate: '2025-10-14'
            }
          }
        },
        '10': {
          builds: {
            '19045': {
              name: '22H2',
              eol: false,
              endOfSupportDate: '2025-10-14'
            },
            '19044': {
              name: '21H2',
              eol: false,
              endOfSupportDate: '2024-06-11'
            },
            '19043': {
              name: '21H1',
              eol: true,
              endOfSupportDate: '2022-12-13'
            },
            '19042': {
              name: '20H2',
              eol: true,
              endOfSupportDate: '2022-05-10'
            },
            '19041': {
              name: '2004',
              eol: true,
              endOfSupportDate: '2021-12-14'
            }
          }
        }
      }
    }
  }
};

module.exports = versionDatabase;