# 🚀 Tenable Local Testing - Getting Started

This guide will walk you through setting up and running the complete Tenable local testing environment.

## ⚡ Quick Setup (5 minutes)

### 1. Prerequisites Check
```bash
# Verify you have the required tools
python3 --version  # Should be 3.6+
node --version      # Should be 16+
npm --version       # Should be 8+
```

### 2. One-Command Setup
```bash
# From the api directory
npm run test:tenable:setup
```

This will:
- ✅ Create Python virtual environment
- ✅ Install PyTenable and Flask
- ✅ Install Node.js dependencies (axios, tsx)
- ✅ Set up all testing components

### 3. Start Testing (3 terminals)

**Terminal 1 - Mock Server:**
```bash
cd api/testing/tenable
source venv/bin/activate  # Linux/Mac
# OR
venv\Scripts\activate.bat  # Windows

python mock_tenable_server.py
```

**Terminal 2 - Python Tests:**
```bash
cd api/testing/tenable
source venv/bin/activate  # Linux/Mac
python test_pytenable_local.py
```

**Terminal 3 - Integration Tests:**
```bash
cd api
node testing/tenable/test_integration.js
```

## 🎯 What You'll See

### Mock Server Output
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
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5001
 * Running on http://[::1]:5001
```

### Python Test Output
```
=== PyTenable Local Testing ===
✅ Connected successfully as: test@example.com
📊 Available scans: 2

=== Testing Asset Retrieval ===
Found 50 assets
  Asset: server-1.example.com (192.168.1.10) - Exposure: 542
  Asset: server-2.example.com (192.168.1.11) - Exposure: 789
  Asset: server-3.example.com (192.168.1.12) - Exposure: 234

=== Testing Vulnerability Data ===
Vulnerability Summary:
  Critical: 89
  High: 156
  Medium: 234
  Low: 345
  Info: 123

✅ All tests completed successfully!
```

### Integration Test Output
```
🧪 Testing RAS-DASH Tenable Service Integration
🔧 Initializing Tenable service...
✅ Service status: connected
📊 Health: healthy

📦 Testing asset synchronization...
✅ Asset sync completed:
   - Total processed: 100
   - Created: 100
   - Updated: 0
   - Errors: 0

🔓 Testing vulnerability synchronization...
✅ Vulnerability sync completed:
   - Total processed: 947
   - Created: 947
   - Updated: 0
   - Errors: 0

🗄️ Verifying data in database...
📊 Assets in database: 100
🔓 Vulnerabilities in database: 947

🎉 Integration test completed successfully!
```

## 🔧 NPM Scripts Available

```bash
# Setup environment
npm run test:tenable:setup

# Start mock server
npm run test:tenable:mock

# Run Python tests
npm run test:tenable:python

# Run Node.js tests  
npm run test:tenable:nodejs

# Run full integration tests
npm run test:tenable:integration
```

## 🐛 Troubleshooting

### Port 5001 Already in Use
```bash
# Kill process on port 5001
lsof -ti:5001 | xargs kill -9  # Mac/Linux
netstat -ano | findstr :5001   # Windows - find PID, then:
taskkill /PID <PID> /F         # Windows - kill process
```

### Python Environment Issues
```bash
# Clean restart
rm -rf testing/tenable/venv
cd testing/tenable
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Database Connection Issues
```bash
# Test database connection
npm run db:query users

# If fails, check your .env file has:
DATABASE_URL=postgresql://username:password@localhost:5432/ras_dash
```

## 🎉 Success Indicators

You'll know everything is working when:

1. **Mock Server**: Shows "Running on http://127.0.0.1:5001"
2. **Python Tests**: Shows "✅ All tests completed successfully!"
3. **Integration Tests**: Shows assets and vulnerabilities in database
4. **Database**: `npm run db:query assets` shows imported data

## 🔄 Next Steps

1. **Explore the Data**: Use `npm run db:query assets` and `npm run db:query vulnerabilities`
2. **Modify Mock Data**: Edit `mock_tenable_server.py` to test different scenarios
3. **Test Error Handling**: Stop mock server and run integration tests
4. **Develop Features**: Use mock server for rapid development
5. **Production Ready**: Switch to real Tenable API when available

## 📚 Additional Resources

- **Full Documentation**: See `README.md` in this directory
- **API Endpoints**: Visit `http://localhost:5001/assets` in browser
- **Database Queries**: Use `npm run db:query` commands
- **Service Code**: Check `src/services/integrations/tenableService.js`

Happy testing! 🚀
