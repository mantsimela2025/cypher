# Quick Start Guide: Tenable Integration Testing

## 🚀 Test Your Complete Tenable Integration

Yes! With this setup you can absolutely test asset/vulnerability imports and scheduled tasks locally. Here's how:

### Step 1: Start Mock Tenable Server
```bash
# Terminal 1: Start the mock server
python mock_tenable_server.py
```

You'll see:
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

### Step 2: Test Integration Components
```bash
# Terminal 2: Test the full integration
npx tsx test_full_integration.ts
```

This will test:
- ✅ Connection to mock server
- ✅ Asset synchronization (100 mock assets)
- ✅ Vulnerability synchronization (500+ mock vulnerabilities)
- ✅ Full sync process with data transformation
- ✅ Scheduled task configuration
- ✅ Manual job execution

### Step 3: Test via API Endpoints
With RAS-DASH running, you can test via HTTP:

```bash
# Test connection
curl http://localhost:5000/api/tenable/test-connection

# Manual asset sync
curl -X POST http://localhost:5000/api/tenable/sync/assets

# Manual vulnerability sync  
curl -X POST http://localhost:5000/api/tenable/sync/vulnerabilities

# Full sync
curl -X POST http://localhost:5000/api/tenable/sync/full

# Check scheduler status
curl http://localhost:5000/api/tenable/scheduler/status

# Run scheduled job manually
curl -X POST http://localhost:5000/api/tenable/scheduler/jobs/tenable-health-check/run
```

## 🔄 What Gets Tested

### Asset Import & Transformation
- **Mock Data**: 100 realistic assets with Windows/Linux OS, cloud metadata, exposure scores
- **Import Process**: Export API → Chunked download → Data transformation
- **RAS-DASH Format**: Converts Tenable format to your existing asset schema

### Vulnerability Import & Transformation  
- **Mock Data**: 500+ vulnerabilities with CVSS scores, severity levels, plugin data
- **Import Process**: Vulnerability export → Chunked download → Risk analysis
- **RAS-DASH Format**: Maps to your vulnerability management system

### Scheduled Task Testing
- **Health Check**: Every 30 minutes (runs immediately for testing)
- **Delta Sync**: Every 1 hour (configurable via env)
- **Full Sync**: Every 4 hours (configurable via env)
- **Manual Execution**: Test any job on-demand

## 📊 Expected Output

### Asset Sync Results
```
✅ Asset sync completed: 100 assets
Transforming 100 Tenable assets to RAS-DASH format
Transformed asset: server-1.example.com (192.168.1.10)
Transformed asset: server-2.example.com (192.168.1.11)
...
Asset transformation completed
```

### Vulnerability Sync Results
```
✅ Vulnerability sync completed: 500 vulnerabilities  
Transforming 500 Tenable vulnerabilities to RAS-DASH format
Transformed vulnerability: Sample Vulnerability 1 on server-1.example.com
...
Vulnerability transformation completed
```

### Scheduler Status
```
✅ Scheduler status:
   - Initialized: true
   - Total jobs: 3
   - Active jobs: 3

Scheduled jobs:
   - Tenable Delta Sync: enabled (0 */1 * * *)
   - Tenable Full Sync: enabled (0 2 */1 * *)  
   - Tenable Health Check: enabled (*/30 * * *)
```

## 🔧 Configuration Options

### Environment Variables (Already Set)
```bash
TENABLE_BASE_URL=http://localhost:5001  # Mock server
TENABLE_SYNC_ENABLED=true               # Enable scheduling
TENABLE_SYNC_INTERVAL_HOURS=1           # Delta sync every hour
TENABLE_ASSET_CHUNK_SIZE=50             # Smaller chunks for testing
```

### Switch to Production
When you get Tenable cloud access, just change:
```bash
TENABLE_BASE_URL=https://cloud.tenable.com
TENABLE_ACCESS_KEY=your_real_access_key
TENABLE_SECRET_KEY=your_real_secret_key
```

## 🎯 Integration Benefits

1. **Complete Local Testing**: No cloud dependencies required
2. **Realistic Data**: Mock data matches real Tenable API structure  
3. **Scheduled Automation**: Test cron jobs and background synchronization
4. **Data Transformation**: Verify Tenable → RAS-DASH data mapping
5. **Error Handling**: Test connection failures and retry logic
6. **Performance Testing**: Measure sync times and throughput

## 🚨 Troubleshooting

### Mock Server Not Running
```
❌ Connection test failed - check if mock server is running
```
**Solution**: Start `python mock_tenable_server.py` first

### Integration Service Errors
```
❌ Tenable Integration initialized with base URL: http://localhost:5001
```
**Solution**: Check that RAS-DASH server is running and environment variables are loaded

### Scheduler Not Starting
**Solution**: Verify `TENABLE_SYNC_ENABLED=true` in .env file

## ✅ Success Indicators

You'll know everything is working when you see:
- ✅ 100 assets imported and transformed
- ✅ 500+ vulnerabilities imported and transformed  
- ✅ 3 scheduled jobs running (delta sync, full sync, health check)
- ✅ Manual job execution working
- ✅ Data in RAS-DASH format with proper field mapping

This gives you a complete testing environment for the Tenable integration without requiring any cloud access!