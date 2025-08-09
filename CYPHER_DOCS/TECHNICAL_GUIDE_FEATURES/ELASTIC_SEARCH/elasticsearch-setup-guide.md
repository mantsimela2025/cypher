# ElasticSearch Configuration Guide for Metasploitable VM Monitoring

This guide provides detailed instructions for setting up ElasticSearch to monitor Metasploitable VM testing in real-time.

## 1. ElasticSearch Deployment Setup

### Option A: Using Elastic Cloud
1. Go to [cloud.elastic.co](https://cloud.elastic.co) and sign up or log in
2. Create a new deployment with these settings:
   - Name: "VulnTrack-Monitoring"
   - Region: Choose closest to your location
   - Version: Latest available (8.x)
   - Size: At minimum, select the "1 GB RAM" option for testing

### Option B: Self-Hosting ElasticSearch
1. Download ElasticSearch from [elastic.co/downloads/elasticsearch](https://elastic.co/downloads/elasticsearch)
2. Install on your preferred server (separate from Metasploitable VM)
3. Edit `elasticsearch.yml` to configure:
   ```yaml
   cluster.name: vulntrack-monitoring
   node.name: scan-monitor-node
   network.host: 0.0.0.0  # To allow remote connections
   discovery.type: single-node  # For a simple setup
   xpack.security.enabled: true  # Enable basic security
   ```
4. Start ElasticSearch with `./bin/elasticsearch`
5. Set up passwords using `./bin/elasticsearch-setup-passwords interactive`

## 2. Kibana Setup

1. Deploy Kibana alongside ElasticSearch:
   - In Elastic Cloud: It's automatically deployed
   - Self-hosted: Install Kibana and point it to your ElasticSearch instance
2. Access Kibana interface (usually on port 5601)
3. Log in with your credentials

## 3. Index Pattern Configuration

1. In Kibana, go to Stack Management → Index Patterns
2. Create index patterns for scan data:
   - Pattern: `metasploitable-scans-*` (for scan results)
   - Pattern: `metasploitable-metrics-*` (for performance metrics)
   - Pattern: `metasploitable-vulnerabilities-*` (for vulnerability data)
3. Select appropriate timestamp fields for each pattern
4. Configure field mappings to ensure data is properly typed:
   - Set `severity` as a keyword field
   - Set `timestamp` as a date field
   - Set `duration` as a numeric field

## 4. Data Ingestion Setup

### Configure Filebeat for Log Collection

1. Install Filebeat on the scanner host:
   - Download from [elastic.co/downloads/beats/filebeat](https://elastic.co/downloads/beats/filebeat)
   - Install following your OS instructions

2. Configure `filebeat.yml`:
   ```yaml
   filebeat.inputs:
   - type: log
     enabled: true
     paths:
       - /path/to/scanner/logs/*.log
     tags: ["scanner", "metasploitable"]
     fields:
       scan_environment: "test"
       target_host: "metasploitable"
     fields_under_root: true
     json.keys_under_root: true
     json.message_key: "log"
     json.add_error_key: true

   output.elasticsearch:
     hosts: ["your-elasticsearch-host:9200"]
     protocol: "https"
     username: "elastic"
     password: "your-password"
     index: "metasploitable-scans-%{+yyyy.MM.dd}"
   ```

3. Enable and start Filebeat:
   ```bash
   sudo systemctl enable filebeat
   sudo systemctl start filebeat
   ```

### Direct API Integration

1. Configure your VulnTrack Pro application to send data directly to ElasticSearch:
   - Go to `/admin/settings/elasticsearch`
   - Enter ElasticSearch connection details:
     - Endpoint URL: `https://your-elasticsearch-host:9200`
     - Username: `elastic` (or your custom user)
     - Password: Your ElasticSearch password
     - Index prefix: `metasploitable`
   - Test connection and save

2. Enable scan metric collection:
   - Go to `/admin/settings/scan-metrics`
   - Enable "Real-time metric collection"
   - Set collection interval to 5 seconds
   - Enable "ElasticSearch output"
   - Save settings

## 5. Creating Dashboards

### Standard Monitoring Dashboard

1. In Kibana, go to Dashboard → Create dashboard
2. Create the following visualizations:

   **Vulnerability Timeline**
   - Visualization type: Line chart
   - Metrics: Count of vulnerabilities 
   - Buckets: X-axis = Date Histogram of detection time
   - Split Series: Terms aggregation on severity
   - Filter: Based on Metasploitable IP

   **Scan Performance Metrics**
   - Visualization type: Metric
   - Metrics:
     - Average scan duration
     - Max scan duration
     - Count of scans
   - Filter: Based on Metasploitable IP

   **Service Status**
   - Visualization type: Heat Map
   - Metrics: Count
   - Buckets:
     - Y-axis: Terms aggregation on service name
     - X-axis: Date histogram
   - Filter: Based on Metasploitable IP and status changes

   **Vulnerability Severity Distribution**
   - Visualization type: Pie Chart
   - Metrics: Count of vulnerabilities
   - Buckets: Split Slices = Terms aggregation on severity
   - Filter: Based on Metasploitable IP

3. Arrange visualizations on the dashboard
4. Save dashboard as "Metasploitable Monitoring"
5. Set auto-refresh to 5 seconds

### Advanced Service Monitoring Dashboard

1. Create a new dashboard for service-specific monitoring
2. Add these visualizations:

   **Service Response Times**
   - Visualization type: Line chart
   - Metrics: Average of response_time
   - Buckets: X-axis = Date Histogram
   - Split Series: Terms on service_name
   - Filter: Based on Metasploitable IP

   **Service Availability**
   - Visualization type: Gauge
   - Metrics: Average availability percentage
   - Filter: Based on Metasploitable IP

   **Service Status Changes**
   - Visualization type: Data Table
   - Metrics: Count of status changes
   - Split Rows: Terms on service_name
   - Filter: Based on Metasploitable IP and status changes

3. Save dashboard as "Metasploitable Service Monitoring"

## 6. Creating Alerts

1. In Kibana, go to Stack Management → Alerting → Create rule
2. Set up the following alerts:

   **Critical Vulnerability Detection**
   - Type: Threshold
   - Conditions:
     - WHEN count() OF vulnerability.severity = "critical" OVER 5m
     - IS ABOVE 0
   - Actions: Send email notification

   **Scan Failure Alert**
   - Type: Threshold
   - Conditions:
     - WHEN count() OF scan.status = "failed" OVER 5m
     - IS ABOVE 0
   - Actions: Send email notification

   **Scan Duration Anomaly**
   - Type: Anomaly
   - Conditions: Detect when scan duration is abnormally long
   - Actions: Send email notification

## 7. Integration Testing

1. Verify data flow by running a test scan:
   ```bash
   port-scan 192.168.56.x --ports 1-100 --output-format json --log-to-elasticsearch
   ```

2. Check Kibana to verify that data is flowing into your indices
3. Verify that visualizations are populating with data
4. Confirm that alerts are triggering appropriately

## 8. Advanced Configuration

### Fine-Tuning ElasticSearch

1. Optimize index settings for scanning data:
   ```json
   PUT metasploitable-*/_settings
   {
     "index": {
       "refresh_interval": "5s",
       "number_of_replicas": 0
     }
   }
   ```

2. Create index lifecycle policies:
   - Go to Stack Management → Index Lifecycle Policies
   - Create a policy for scan data:
     - Hot phase: Optimize for query performance
     - Warm phase: Move to after 7 days
     - Cold phase: Move to after 30 days
     - Delete phase: Delete after 90 days

### Custom Data Processors

1. Create an ingest pipeline to enrich scan data:
   ```json
   PUT _ingest/pipeline/metasploitable-enrichment
   {
     "description": "Enriches scan data with additional context",
     "processors": [
       {
         "set": {
           "field": "scan.environment",
           "value": "test_lab"
         }
       },
       {
         "set": {
           "field": "target.type",
           "value": "metasploitable"
         }
       },
       {
         "date": {
           "field": "timestamp",
           "formats": ["ISO8601"]
         }
       }
     ]
   }
   ```

2. Apply the pipeline to your indices:
   ```json
   PUT metasploitable-*/_settings
   {
     "index.default_pipeline": "metasploitable-enrichment"
   }
   ```

## 9. Using the ElasticSearch API for Custom Integration

If you need programmatic access, use the ElasticSearch REST API:

1. Sending scan data directly:
   ```bash
   curl -X POST "https://your-elasticsearch-host:9200/metasploitable-scans-$(date +%Y.%m.%d)/_doc" \
     -H "Content-Type: application/json" \
     -u "elastic:your-password" \
     -d '{
       "timestamp": "'"$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)"'",
       "scan_id": "12345",
       "target": "192.168.56.x",
       "scan_type": "port-scan",
       "port_count": 65535,
       "open_ports": 12,
       "duration": 120,
       "status": "completed"
     }'
   ```

2. Retrieve scan results:
   ```bash
   curl -X GET "https://your-elasticsearch-host:9200/metasploitable-scans-*/_search" \
     -H "Content-Type: application/json" \
     -u "elastic:your-password" \
     -d '{
       "query": {
         "bool": {
           "must": [
             { "term": { "target": "192.168.56.x" } },
             { "term": { "scan_type": "port-scan" } }
           ]
         }
       },
       "sort": [
         { "timestamp": { "order": "desc" } }
       ],
       "size": 10
     }'
   ```

## 10. Troubleshooting Common Issues

1. **Data not appearing in ElasticSearch**:
   - Check Filebeat status: `sudo systemctl status filebeat`
   - Verify Filebeat logs: `sudo tail -f /var/log/filebeat/filebeat`
   - Test ElasticSearch connectivity: `curl -u elastic:password https://your-elasticsearch-host:9200`

2. **Visualizations not showing data**:
   - Verify index patterns are correctly configured
   - Check date ranges in visualizations
   - Ensure fields are properly mapped

3. **Performance issues**:
   - Increase ElasticSearch heap size
   - Optimize refresh intervals
   - Consider scaling ElasticSearch cluster

4. **Authentication failures**:
   - Reset ElasticSearch passwords
   - Check SSL/TLS configuration
   - Verify user permissions

## 11. VulnTrack Pro SIEM Integration

VulnTrack Pro includes built-in SIEM functionality that can be used to monitor Metasploitable scans:

1. Navigate to `/siem/settings` in your VulnTrack Pro application
2. Configure the ElasticSearch connection section:
   - Provide the ElasticSearch endpoint details
   - Set authentication credentials
   - Enable the "Scan Results Integration" option
3. Go to the "Data Sources" tab and add a new source:
   - Source Name: "Metasploitable Scans"
   - Source Type: "Scanner Output"
   - Pattern: Specify the log format pattern
4. Save the configuration and restart the SIEM service

## 12. Creating Custom Scan Analytics

To create specialized analytics for your Metasploitable testing:

1. Navigate to `/siem/analytics` in VulnTrack Pro
2. Create a new Analytics Profile named "Metasploitable Testing"
3. Add the following analytics:
   - Scan Efficiency Metrics
   - Vulnerability Detection Rate
   - Service Discovery Accuracy
   - False Positive Analysis
4. Configure each analytic with appropriate queries
5. Enable real-time updating

---

**Document Version:** 1.0  
**Last Updated:** April 23, 2025  
**Created By:** VulnTrack Pro Team