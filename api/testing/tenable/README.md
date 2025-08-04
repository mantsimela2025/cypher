# Tenable Local Testing Environment

This directory contains a complete local testing environment for Tenable API integration without requiring access to cloud.tenable.com.

## 📁 Directory Structure

```
api/testing/tenable/
├── README.md                    # This file
├── requirements.txt             # Python dependencies
├── setup.sh                     # Linux/Mac setup script
├── setup.bat                    # Windows setup script
├── mock_tenable_server.py       # Flask mock server
├── test_pytenable_local.py      # PyTenable client tests
├── test_tenable_nodejs.ts       # Node.js client tests
├── test_integration.js          # RAS-DASH integration tests
└── venv/                        # Python virtual environment (created during setup)
```

## 🚀 Quick Start

### 1. Setup Environment

**Linux/Mac:**
```bash
cd api/testing/tenable
chmod +x setup.sh
./setup.sh
```

**Windows:**
```cmd
cd api\testing\tenable
setup.bat
```

### 2. Start Mock Server

**Activate Python environment first:**
```bash
# Linux/Mac
source venv/bin/activate

# Windows
venv\Scripts\activate.bat
```

**Start the server:**
```bash
python mock_tenable_server.py
```

The server will start on `http://localhost:5001` with these endpoints:
- `GET /session` - User session info
- `GET /scans` - Available scans
- `GET /assets` - Asset listing (with change simulation)
- `POST /assets/export` - Start asset export
- `GET /workbenches/vulnerabilities` - Vulnerability summary (with changes)
- `POST /vulns/export` - Start vulnerability export
- `GET /scan/status` - Current scan status and change information
- `POST /force-scan` - Force immediate scan simulation
- `POST /reset` - Reset data to initial state

### 3. Run Tests

**In separate terminals:**

**PyTenable Tests:**
```bash
source venv/bin/activate  # Linux/Mac
python test_pytenable_local.py
```

**Node.js Tests:**
```bash
npx tsx test_tenable_nodejs.ts
```

**RAS-DASH Integration Tests:**
```bash
node test_integration.js
```

## 🧪 Test Components

### Mock Tenable Server (`mock_tenable_server.py`)
- **Flask-based** mock server that mimics Tenable API
- **Realistic data generation** with 100 assets and 1000+ vulnerabilities
- **Complete API coverage** including exports and chunked downloads
- **Consistent responses** for reliable testing

### PyTenable Client Tests (`test_pytenable_local.py`)
- Tests **PyTenable library** against mock server
- Validates **connection, assets, vulnerabilities, and exports**
- Demonstrates **real PyTenable usage patterns**

### Node.js Client Tests (`test_tenable_nodejs.ts`)
- Tests **direct HTTP client** implementation
- Shows **axios-based** API interaction
- Validates **export workflow** with chunked downloads

### Integration Tests (`test_integration.js`)
- Tests **actual RAS-DASH Tenable service**
- Validates **database synchronization**
- Tests **error handling** and fallback behavior
- Verifies **data persistence** in PostgreSQL

## 📊 Mock Data with Time-Based Changes

The mock server generates realistic test data that **changes over time** to simulate real-world scenarios:

### Assets (100 total)
- **Hostnames**: server-1.example.com to server-100.example.com
- **IP Addresses**: 192.168.1.10 to 192.168.1.109
- **Operating Systems**: Windows Server, Ubuntu, CentOS, RHEL
- **AWS Metadata**: EC2 instances, AMIs, regions (random)
- **Exposure Scores**: 0-1000 range (fluctuates over time)
- **Agent Status**: Random agent installation
- **Status Changes**: Assets can go offline/online over time

### Vulnerabilities (1000+ total, changes over time)
- **Plugin Families**: Windows, Ubuntu, Web Servers, Databases, Network
- **Severities**: Critical, High, Medium, Low, Info
- **CVSS Scores**: 0.0-10.0 range
- **States**: Open, Reopened, Fixed (changes with each "scan")
- **Realistic Timing**: First found, last found dates
- **Change Simulation**:
  - **5% of vulnerabilities get fixed** per scan cycle
  - **2% chance of new vulnerabilities** per asset per scan
  - **1% of fixed vulnerabilities may reopen** (regression)

### Time-Based Simulation Features
- **Scan Cycles**: Every 5 minutes (configurable for testing)
- **Data Persistence**: Changes are saved to `mock_data_state.pkl`
- **Remediation Tracking**: Vulnerabilities transition from open → fixed
- **New Discoveries**: New vulnerabilities appear over time
- **Asset Changes**: Exposure scores fluctuate, assets go offline
- **Regression Testing**: Fixed vulnerabilities can reopen

## 🔧 Configuration

### Environment Variables for Testing

Create a `.env.test` file or set these variables:

```bash
# Local Testing Configuration
TENABLE_ACCESS_KEY=mock_access_key
TENABLE_SECRET_KEY=mock_secret_key
TENABLE_BASE_URL=http://localhost:5001
TENABLE_SYNC_ENABLED=true

# Smaller intervals for testing
TENABLE_SYNC_INTERVAL_HOURS=1
TENABLE_ASSET_CHUNK_SIZE=50
TENABLE_VULN_CHUNK_SIZE=100
```

### Database Setup

Make sure your PostgreSQL database is running and configured:

```bash
# Run database migrations if needed
npm run db:migrate

# Verify database connection
npm run db:query systems
```

## 🎯 Testing Scenarios

### 1. Basic Connectivity
```bash
# Test 1: Start mock server
python mock_tenable_server.py

# Test 2: Verify endpoints respond
curl http://localhost:5001/session
curl http://localhost:5001/assets
```

### 2. PyTenable Integration
```bash
# Test PyTenable library works with mock server
python test_pytenable_local.py
```

### 3. Node.js HTTP Client
```bash
# Test direct HTTP integration
npx tsx test_tenable_nodejs.ts
```

### 4. Full RAS-DASH Integration
```bash
# Test complete integration with database sync
node test_integration.js
```

### 5. Error Handling
```bash
# Stop mock server and test fallback behavior
# Integration test should handle gracefully
node test_integration.js
```

## 📈 Expected Results

### Successful Test Output

**Mock Server:**
```
Starting Mock Tenable Server...
Access at: http://localhost:5001
Available endpoints:
  GET  /session
  GET  /scans
  GET  /assets
  POST /assets/export
  GET  /workbenches/vulnerabilities
  POST /vulns/export
```

**PyTenable Tests:**
```
=== PyTenable Local Testing ===
✅ Connected successfully as: test@example.com
📊 Available scans: 2
Found 50 assets
✅ All tests completed successfully!
```

**Integration Tests:**
```
🧪 Testing RAS-DASH Tenable Service Integration
✅ Service status: connected
📦 Asset sync completed:
   - Total processed: 100
   - Created: 100
   - Updated: 0
🎉 Integration test completed successfully!
```

## 🔍 Troubleshooting

### Common Issues

**Port 5001 already in use:**
```bash
# Find and kill process using port 5001
lsof -ti:5001 | xargs kill -9  # Mac/Linux
netstat -ano | findstr :5001   # Windows
```

**Python virtual environment issues:**
```bash
# Remove and recreate venv
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Database connection errors:**
```bash
# Verify database is running
npm run db:query users

# Check environment variables
echo $DATABASE_URL
```

**Node.js TypeScript issues:**
```bash
# Install tsx globally if needed
npm install -g tsx

# Or use local installation
npx tsx test_tenable_nodejs.ts
```

## 🎉 Benefits

1. **No Network Dependencies** - Works in isolated environments
2. **Predictable Data** - Consistent test data for development
3. **Fast Iteration** - No API rate limits or delays
4. **Realistic Responses** - Mock data matches real Tenable API structure
5. **Full Coverage** - Test all integration scenarios including error cases
6. **Database Integration** - Validates complete data flow to PostgreSQL

## 🔄 Next Steps

1. **Start with Mock Server** - Get familiar with the API structure
2. **Run All Tests** - Verify everything works in your environment
3. **Develop Features** - Use mock server for rapid development
4. **Switch to Production** - Update base URL when Tenable access is available
5. **Extend Testing** - Add more test scenarios as needed

This local testing environment provides a complete Tenable API simulation that matches the real API structure and responses, allowing full development and testing of the integration without requiring cloud access.
