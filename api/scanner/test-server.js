const express = require('express');
const app = express();
const port = 5001;

// Configure server without security headers to test HTTP header checks
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create mock user database for SQL injection simulation
const users = [
  { id: 1, username: 'admin', password: 'admin123', isAdmin: true },
  { id: 2, username: 'user', password: 'password123', isAdmin: false },
  { id: 3, username: 'jane', password: 'secret', isAdmin: false }
];

// Basic route without security headers
app.get('/', (req, res) => {
  // No security headers set
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Vulnerable Test Server</title>
        <meta name="description" content="Test server for security scanning">
        <!-- Intentionally include outdated jQuery for patch detection -->
        <script src="https://code.jquery.com/jquery-1.12.4.min.js"></script>
        <!-- Outdated Bootstrap for framework detection -->
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
        <!-- Simulated vulnerable library with CVE -->
        <script src="/js/vulnerable-library.js"></script>
      </head>
      <body>
        <div class="container">
          <h1>Security Scanner Test Server</h1>
          <div class="alert alert-info">
            This server is intentionally vulnerable for testing purposes.
          </div>
          
          <h2>Features to test:</h2>
          <ul>
            <li>Missing security headers</li>
            <li>Outdated libraries (jQuery 1.12.4, Bootstrap 3.3.7)</li>
            <li>Insecure cookies</li>
            <li>Server information disclosure</li>
            <li>XSS vulnerability</li>
            <li>SQL injection simulation</li>
            <li>Directory traversal vulnerability</li>
          </ul>
          
          <h2>Test Form:</h2>
          <form action="/login" method="POST">
            <div class="form-group">
              <label for="username">Username:</label>
              <input type="text" id="username" name="username" class="form-control">
            </div>
            <div class="form-group">
              <label for="password">Password:</label>
              <input type="password" id="password" name="password" class="form-control">
            </div>
            <button type="submit" class="btn btn-primary">Login</button>
          </form>
          
          <h2>XSS Test:</h2>
          <div class="form-group">
            <label>Simulated XSS Vulnerability:</label>
            <form action="/search" method="GET">
              <input type="text" name="q" class="form-control" placeholder="Search...">
              <button type="submit" class="btn btn-info mt-2">Search</button>
            </form>
          </div>
          
          <h2>SQL Injection Test:</h2>
          <div class="form-group">
            <label>Simulated SQL Injection:</label>
            <form action="/user" method="GET">
              <input type="text" name="id" class="form-control" placeholder="Enter user ID...">
              <button type="submit" class="btn btn-warning mt-2">Get User</button>
            </form>
          </div>
          
          <h2>Directory Traversal Test:</h2>
          <div class="form-group">
            <label>Simulated Directory Traversal:</label>
            <form action="/file" method="GET">
              <input type="text" name="path" class="form-control" placeholder="Enter file path...">
              <button type="submit" class="btn btn-danger mt-2">View File</button>
            </form>
          </div>
        </div>
      </body>
    </html>
  `);
});

// Virtual path for vulnerable library
app.get('/js/vulnerable-library.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
    /**
     * Vulnerable Library v1.0.0
     * Known to have CVE-2023-12345
     */
    console.log('Loaded vulnerable library with known CVE');
    
    function unsafeEval(code) {
      return eval(code); // Intentionally dangerous
    }
    
    window.vulnerableLibrary = {
      version: '1.0.0',
      unsafeEval
    };
  `);
});

// Login route that sets insecure cookies
app.post('/login', (req, res) => {
  // Set insecure cookies (no secure flag, no httpOnly)
  res.cookie('session', 'test-session-value', { 
    maxAge: 900000
    // Intentionally missing secure and httpOnly flags
  });
  
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Logged In - Vulnerable Test Server</title>
        <meta name="description" content="Test server for security scanning">
        <script src="https://code.jquery.com/jquery-1.12.4.min.js"></script>
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
      </head>
      <body>
        <div class="container">
          <h1>Logged In</h1>
          <div class="alert alert-success">
            Successfully logged in as ${req.body.username}
          </div>
          <p>This page has set an insecure cookie.</p>
          <a href="/" class="btn btn-primary">Go back</a>
        </div>
      </body>
    </html>
  `);
});

// XSS vulnerable route - reflects user input without sanitization
app.get('/search', (req, res) => {
  const query = req.query.q || '';
  
  // Intentionally vulnerable to XSS
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Search Results - Vulnerable Test Server</title>
        <meta name="description" content="Test server for security scanning">
        <script src="https://code.jquery.com/jquery-1.12.4.min.js"></script>
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
      </head>
      <body>
        <div class="container">
          <h1>Search Results</h1>
          <p>You searched for: ${query}</p>
          <p>No results found for: <span id="searchQuery">${query}</span></p>
          <a href="/" class="btn btn-primary">Go back</a>
        </div>
      </body>
    </html>
  `);
});

// SQL Injection simulation
app.get('/user', (req, res) => {
  const userId = req.query.id;
  
  // Simulate SQL Injection vulnerability
  let userFound = null;
  let error = null;
  
  if (userId === "1 OR 1=1") {
    // Simulating SQL injection success
    userFound = users;
  } else if (userId.includes("'") || userId.includes('"') || userId.includes(';')) {
    error = "SQL Error: Syntax error in SQL statement";
  } else {
    userFound = users.filter(user => user.id.toString() === userId);
  }
  
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>User Information - Vulnerable Test Server</title>
        <meta name="description" content="Test server for security scanning">
        <script src="https://code.jquery.com/jquery-1.12.4.min.js"></script>
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
      </head>
      <body>
        <div class="container">
          <h1>User Information</h1>
          ${error ? `<div class="alert alert-danger">${error}</div>` : ''}
          ${userFound ? `
            <div class="alert alert-success">User(s) found</div>
            <table class="table table-striped">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Password</th>
                  <th>Admin</th>
                </tr>
              </thead>
              <tbody>
                ${Array.isArray(userFound) ? userFound.map(user => `
                  <tr>
                    <td>${user.id}</td>
                    <td>${user.username}</td>
                    <td>${user.password}</td>
                    <td>${user.isAdmin ? 'Yes' : 'No'}</td>
                  </tr>
                `).join('') : ''}
              </tbody>
            </table>
          ` : '<div class="alert alert-warning">No user found</div>'}
          <a href="/" class="btn btn-primary">Go back</a>
        </div>
      </body>
    </html>
  `);
});

// Directory traversal vulnerability
app.get('/file', (req, res) => {
  const path = req.query.path || 'sample.txt';
  
  // Simulated directory traversal vulnerability
  let fileContent = '';
  let error = null;
  
  if (path.includes('../') || path.includes('etc/passwd')) {
    // Simulate successful directory traversal
    if (path.includes('etc/passwd')) {
      fileContent = 'root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nbin:x:2:2:bin:/bin:/usr/sbin/nologin\n[...more users...]';
    } else {
      fileContent = 'You successfully accessed a file outside the allowed directory!';
    }
  } else {
    fileContent = 'This is a sample file content. No actual files are being read.';
  }
  
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>File Viewer - Vulnerable Test Server</title>
        <meta name="description" content="Test server for security scanning">
        <script src="https://code.jquery.com/jquery-1.12.4.min.js"></script>
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
      </head>
      <body>
        <div class="container">
          <h1>File Viewer</h1>
          <h3>Path: ${path}</h3>
          ${error ? `<div class="alert alert-danger">${error}</div>` : ''}
          <div class="card">
            <div class="card-header">File Content</div>
            <div class="card-body">
              <pre>${fileContent}</pre>
            </div>
          </div>
          <a href="/" class="btn btn-primary mt-3">Go back</a>
        </div>
      </body>
    </html>
  `);
});

// Route that demonstrates server information disclosure
app.get('/server-info', (req, res) => {
  // Intentionally expose server information for testing
  const serverInfo = {
    nodejs: process.version,
    platform: process.platform,
    architecture: process.arch,
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'development',
    versions: process.versions,
    // Added sensitive information
    systemUsers: [
      { username: 'admin', uid: 0, gid: 0, home: '/home/admin', shell: '/bin/bash' },
      { username: 'webuser', uid: 1000, gid: 1000, home: '/home/webuser', shell: '/bin/bash' }
    ],
    config: {
      dbHost: 'localhost',
      dbUser: 'dbadmin',
      dbPassword: 'supersecret123',  // Exposed sensitive credentials
      apiKeys: {
        stripe: 'sk_test_123456EXAMPLE',
        aws: 'AKIAIOSFODNN7EXAMPLE'
      }
    }
  };
  
  res.json(serverInfo);
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Test server running at http://localhost:${port}`);
  console.log('Use this for vulnerability scanning tests');
  console.log('NOTE: This server is intentionally vulnerable for testing purposes. DO NOT EXPOSE TO INTERNET.');
});