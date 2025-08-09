# AI Assistance & SIEM Setup Guide

This guide will help you add the new AI Assistance and SIEM tables to your existing database.

## 📋 Prerequisites

- Existing RAS Dashboard API database
- Node.js environment with database access
- Environment variables configured (DATABASE_URL)

## 🚀 Step 1: Run Database Migration

Execute the migration script to create all new tables:

```bash
# Navigate to your API directory
cd api

# Run the migration script
node scripts/migrate_ai_siem_tables.js
```

The script will create:

### SIEM Tables (8 tables)
- `siem_log_sources` - Log source configurations
- `siem_rules` - Detection rules and correlation logic
- `siem_events` - Individual security events
- `siem_alerts` - Correlated alerts from multiple events
- `siem_dashboards` - Custom dashboard configurations
- `siem_incidents` - High-level security incidents
- `siem_threat_intelligence` - Threat indicators and IOCs
- `siem_analytics` - Pre-computed analytics and metrics

### AI Assistance Tables (6 tables)
- `ai_assistance_requests` - Core AI interaction tracking
- `ai_knowledge_base` - Curated AI-generated knowledge
- `ai_training_data` - Training examples and feedback
- `ai_analytics` - Performance metrics and usage analytics
- `ai_model_configurations` - AI model settings and configurations
- `ai_automation_rules` - Rules for automated AI assistance

## 🔧 Step 2: Configure Environment Variables

Add these environment variables to your `.env` file:

```bash
# AI Provider Configuration (choose one or more)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_ORG_ID=your_openai_org_id_here

ANTHROPIC_API_KEY=your_anthropic_api_key_here

AZURE_OPENAI_API_KEY=your_azure_openai_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/

# Elasticsearch Configuration (optional)
ELASTICSEARCH_URL=https://localhost:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=your_password_here

# AI Configuration
AI_DEFAULT_PROVIDER=openai
AI_DEFAULT_MODEL=gpt-4
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7
```

## 📊 Step 3: Verify Installation

Check that the tables were created successfully:

```sql
-- Check SIEM tables
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE 'siem_%' 
ORDER BY table_name;

-- Check AI Assistance tables
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE 'ai_%' 
ORDER BY table_name;
```

## 🧪 Step 4: Test AI Assistance

Create a test AI assistance request:

```bash
# Test the AI assistance endpoint
curl -X POST http://localhost:3000/api/v1/ai-assistance/requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "requestType": "threat_analysis",
    "title": "Test Threat Analysis",
    "description": "Analyze suspicious IP address 192.168.1.100",
    "context": {
      "ip": "192.168.1.100",
      "timeframe": "24h"
    },
    "priority": "medium"
  }'
```

## 🔒 Step 5: Configure Permissions

Add AI assistance permissions to your RBAC system:

```sql
-- Insert AI assistance permissions
INSERT INTO permissions (name, description, category, resource, action) VALUES
('ai_assistance', 'read', 'AI Assistance', 'ai_assistance', 'read'),
('ai_assistance', 'write', 'AI Assistance', 'ai_assistance', 'write'),
('ai_assistance', 'admin', 'AI Assistance', 'ai_assistance', 'admin'),
('siem', 'read', 'SIEM', 'siem', 'read'),
('siem', 'write', 'SIEM', 'siem', 'write'),
('siem', 'admin', 'SIEM', 'siem', 'admin');

-- Assign permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'admin' 
AND p.resource IN ('ai_assistance', 'siem');
```

## 📈 Step 6: Initialize Default Data

Create default AI model configurations:

```sql
-- Insert default AI model configuration
INSERT INTO ai_model_configurations (
  name, provider, model, configuration, parameters, 
  system_prompt, is_active, created_by
) VALUES (
  'Default GPT-4',
  'openai',
  'gpt-4',
  '{"endpoint": "https://api.openai.com/v1/chat/completions"}',
  '{"temperature": 0.7, "max_tokens": 2000}',
  'You are a helpful cybersecurity assistant specializing in government security requirements.',
  true,
  1
);

-- Insert default SIEM log source
INSERT INTO siem_log_sources (
  name, type, status, configuration, created_by
) VALUES (
  'System Logs',
  'syslog',
  'active',
  '{"port": 514, "protocol": "udp"}',
  1
);
```

## 🎯 Step 7: Start Using Features

### AI Assistance Features
- **Threat Analysis** - Analyze security threats and indicators
- **Incident Response** - Generate response playbooks
- **Compliance Guidance** - Get compliance framework guidance
- **Policy Generation** - Create security policies and procedures
- **Training Content** - Generate personalized security training

### SIEM Features
- **Event Management** - Collect and analyze security events
- **Alert Correlation** - Create alerts from multiple events
- **Threat Intelligence** - Manage threat indicators and IOCs
- **Incident Tracking** - Track security incidents end-to-end
- **Analytics** - Generate security metrics and reports

## 🔍 Troubleshooting

### Common Issues

1. **Migration fails with permission error**
   ```bash
   # Ensure your database user has CREATE privileges
   GRANT CREATE ON DATABASE your_database TO your_user;
   ```

2. **AI requests fail with API key error**
   ```bash
   # Verify your API keys are correctly set
   echo $OPENAI_API_KEY
   ```

3. **Tables not appearing in schema exports**
   ```bash
   # Restart your application after running migration
   npm restart
   ```

### Verification Commands

```bash
# Check if migration completed successfully
node -e "
const { db } = require('./src/db');
const { aiAssistanceRequests } = require('./src/db/schema');
console.log('AI tables available:', !!aiAssistanceRequests);
"

# Test AI service initialization
node -e "
const aiService = require('./src/services/aiAssistanceService');
console.log('AI service initialized successfully');
"
```

## 📚 Next Steps

1. **Configure AI Providers** - Set up your preferred AI service providers
2. **Create Automation Rules** - Set up automated AI assistance for common tasks
3. **Train the System** - Provide feedback to improve AI response quality
4. **Integrate with SIEM** - Connect your existing security tools
5. **Customize Dashboards** - Create custom SIEM dashboards for your needs

## 🆘 Support

If you encounter issues:

1. Check the application logs for detailed error messages
2. Verify all environment variables are correctly set
3. Ensure database connectivity and permissions
4. Review the API documentation for endpoint usage
5. Test with simple requests before complex scenarios

The AI Assistance and SIEM platforms are now ready to enhance your cybersecurity operations!
