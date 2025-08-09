#!/usr/bin/env node

/**
 * Database Migration Script for AI Assistance and SIEM Tables
 * 
 * This script creates the new AI assistance and SIEM tables in your database.
 * Run this script to add the new tables to your existing database.
 * 
 * Usage: node scripts/migrate_ai_siem_tables.js
 */

const { drizzle } = require('drizzle-orm/postgres-js');
const { migrate } = require('drizzle-orm/postgres-js/migrator');
const postgres = require('postgres');
require('dotenv').config();

// Import the new schemas
const {
  // SIEM schemas
  siemLogSources,
  siemRules,
  siemEvents,
  siemAlerts,
  siemDashboards,
  siemIncidents,
  siemThreatIntelligence,
  siemAnalytics,

  // AI Assistance schemas
  aiAssistanceRequests,
  aiKnowledgeBase,
  aiTrainingData,
  aiAssistanceAnalytics,
  aiModelConfigurations,
  aiAutomationRules
} = require('../src/db/schema');

async function createTables() {
  console.log('🚀 Starting database migration for AI Assistance and SIEM tables...');

  // Create database connection
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const sql = postgres(connectionString);
  const db = drizzle(sql);

  try {
    console.log('📊 Creating SIEM tables...');

    // Create SIEM enums first
    await sql`
      DO $$ BEGIN
        CREATE TYPE enum_siem_alerts_severity AS ENUM ('low', 'medium', 'high', 'critical');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await sql`
      DO $$ BEGIN
        CREATE TYPE enum_siem_alerts_status AS ENUM ('new', 'investigating', 'resolved', 'false_positive', 'closed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await sql`
      DO $$ BEGIN
        CREATE TYPE enum_siem_events_severity AS ENUM ('low', 'medium', 'high', 'critical');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await sql`
      DO $$ BEGIN
        CREATE TYPE enum_siem_events_status AS ENUM ('new', 'investigating', 'resolved', 'false_positive', 'closed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await sql`
      DO $$ BEGIN
        CREATE TYPE enum_siem_rules_rule_type AS ENUM ('correlation', 'threshold', 'anomaly', 'signature', 'behavioral', 'statistical');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await sql`
      DO $$ BEGIN
        CREATE TYPE enum_siem_rules_severity AS ENUM ('low', 'medium', 'high', 'critical');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    // Create SIEM tables
    await sql`
      CREATE TABLE IF NOT EXISTS siem_log_sources (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(255) NOT NULL,
        endpoint VARCHAR(255),
        status VARCHAR(255) DEFAULT 'active',
        configuration JSONB DEFAULT '{}',
        last_sync_at TIMESTAMPTZ,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS siem_rules (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        rule_type enum_siem_rules_rule_type NOT NULL,
        pattern TEXT,
        conditions JSONB DEFAULT '{}',
        severity enum_siem_rules_severity DEFAULT 'medium',
        enabled BOOLEAN DEFAULT true,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS siem_events (
        id SERIAL PRIMARY KEY,
        source_id INTEGER REFERENCES siem_log_sources(id),
        timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        source_timestamp TIMESTAMPTZ,
        event_type VARCHAR(255) NOT NULL,
        severity enum_siem_events_severity DEFAULT 'low',
        status enum_siem_events_status DEFAULT 'new',
        summary VARCHAR(255) NOT NULL,
        details JSONB DEFAULT '{}' NOT NULL,
        raw_data TEXT,
        source_ip VARCHAR(255),
        destination_ip VARCHAR(255),
        username VARCHAR(255),
        process_name VARCHAR(255),
        resource_id VARCHAR(255),
        assigned_to INTEGER REFERENCES users(id),
        investigation_notes TEXT,
        remediation_notes TEXT,
        received_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        closed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS siem_alerts (
        id SERIAL PRIMARY KEY,
        rule_id INTEGER REFERENCES siem_rules(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        severity enum_siem_alerts_severity DEFAULT 'medium',
        status enum_siem_alerts_status DEFAULT 'new',
        first_seen TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        last_seen TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        event_count INTEGER DEFAULT 1,
        related_events INTEGER[] DEFAULT ARRAY[]::INTEGER[],
        assigned_to INTEGER REFERENCES users(id),
        investigation_notes TEXT,
        remediation_notes TEXT,
        closed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS siem_dashboards (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        layout JSONB DEFAULT '{}',
        filters JSONB DEFAULT '{}',
        is_default BOOLEAN DEFAULT false,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS siem_incidents (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        severity enum_siem_alerts_severity DEFAULT 'medium',
        status VARCHAR(50) DEFAULT 'open',
        incident_type VARCHAR(100),
        affected_systems TEXT[] DEFAULT ARRAY[]::TEXT[],
        related_alerts INTEGER[] DEFAULT ARRAY[]::INTEGER[],
        assigned_to INTEGER REFERENCES users(id),
        reported_by INTEGER REFERENCES users(id),
        discovered_at TIMESTAMPTZ,
        contained_at TIMESTAMPTZ,
        resolved_at TIMESTAMPTZ,
        investigation_notes TEXT,
        remediation_actions TEXT,
        lessons_learned TEXT,
        business_impact TEXT,
        estimated_cost INTEGER,
        compliance_impact TEXT,
        external_notification BOOLEAN DEFAULT false,
        law_enforcement_notified BOOLEAN DEFAULT false,
        media_attention BOOLEAN DEFAULT false,
        custom_fields JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS siem_threat_intelligence (
        id SERIAL PRIMARY KEY,
        indicator_type VARCHAR(50) NOT NULL,
        indicator_value VARCHAR(500) NOT NULL,
        threat_type VARCHAR(100),
        severity enum_siem_alerts_severity DEFAULT 'medium',
        confidence INTEGER DEFAULT 50,
        source VARCHAR(255),
        description TEXT,
        tags TEXT[] DEFAULT ARRAY[]::TEXT[],
        first_seen TIMESTAMPTZ,
        last_seen TIMESTAMPTZ,
        expires_at TIMESTAMPTZ,
        is_active BOOLEAN DEFAULT true,
        false_positive BOOLEAN DEFAULT false,
        related_incidents INTEGER[] DEFAULT ARRAY[]::INTEGER[],
        additional_context JSONB DEFAULT '{}',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS siem_analytics (
        id SERIAL PRIMARY KEY,
        metric_name VARCHAR(255) NOT NULL,
        metric_type VARCHAR(50) NOT NULL,
        timeframe VARCHAR(50) NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL,
        value INTEGER NOT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;

    console.log('✅ SIEM tables created successfully');

    console.log('🤖 Creating AI Assistance tables...');

    // Create AI Assistance enums
    await sql`
      DO $$ BEGIN
        CREATE TYPE enum_ai_request_type AS ENUM (
          'threat_analysis', 'incident_response', 'compliance_guidance', 'policy_generation',
          'risk_assessment', 'vulnerability_analysis', 'forensic_analysis', 'training_content',
          'documentation', 'code_review', 'configuration_review', 'threat_hunting',
          'malware_analysis', 'network_analysis', 'log_analysis'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await sql`
      DO $$ BEGIN
        CREATE TYPE enum_ai_provider AS ENUM ('openai', 'anthropic', 'azure_openai', 'aws_bedrock', 'google_vertex', 'local_model', 'government_ai');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await sql`
      DO $$ BEGIN
        CREATE TYPE enum_ai_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled', 'requires_review', 'approved', 'rejected');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await sql`
      DO $$ BEGIN
        CREATE TYPE enum_ai_confidence AS ENUM ('very_low', 'low', 'medium', 'high', 'very_high');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    // Create AI Assistance tables
    await sql`
      CREATE TABLE IF NOT EXISTS ai_assistance_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) NOT NULL,
        request_type enum_ai_request_type NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        context JSONB DEFAULT '{}',
        priority VARCHAR(20) DEFAULT 'medium',
        ai_provider enum_ai_provider,
        ai_model VARCHAR(100),
        prompt TEXT,
        response TEXT,
        confidence enum_ai_confidence,
        processing_time INTEGER,
        tokens_used INTEGER,
        cost DECIMAL(10,4),
        status enum_ai_status DEFAULT 'pending',
        reviewed_by INTEGER REFERENCES users(id),
        reviewed_at TIMESTAMPTZ,
        approved_by INTEGER REFERENCES users(id),
        approved_at TIMESTAMPTZ,
        quality_rating INTEGER,
        user_feedback TEXT,
        accuracy_score DECIMAL(5,2),
        usefulness INTEGER,
        implementation_status VARCHAR(50),
        implementation_notes TEXT,
        results JSONB DEFAULT '{}',
        effectiveness INTEGER,
        related_request_id INTEGER REFERENCES ai_assistance_requests(id),
        related_entity_type VARCHAR(50),
        related_entity_id INTEGER,
        classification_level VARCHAR(50) DEFAULT 'unclassified',
        sensitive_data BOOLEAN DEFAULT false,
        compliance_review BOOLEAN DEFAULT false,
        audit_trail JSONB DEFAULT '[]',
        tags TEXT[] DEFAULT ARRAY[]::TEXT[],
        metadata JSONB DEFAULT '{}',
        is_public BOOLEAN DEFAULT false,
        is_template BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS ai_knowledge_base (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        subcategory VARCHAR(100),
        content TEXT NOT NULL,
        summary TEXT,
        generated_by enum_ai_provider,
        source_request_id INTEGER REFERENCES ai_assistance_requests(id),
        confidence enum_ai_confidence,
        last_updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        is_validated BOOLEAN DEFAULT false,
        validated_by INTEGER REFERENCES users(id),
        validated_at TIMESTAMPTZ,
        accuracy DECIMAL(5,2),
        relevance INTEGER,
        view_count INTEGER DEFAULT 0,
        use_count INTEGER DEFAULT 0,
        rating DECIMAL(3,2),
        rating_count INTEGER DEFAULT 0,
        classification_level VARCHAR(50) DEFAULT 'unclassified',
        access_level VARCHAR(50) DEFAULT 'public',
        approved_for_sharing BOOLEAN DEFAULT false,
        related_topics TEXT[] DEFAULT ARRAY[]::TEXT[],
        references JSONB DEFAULT '[]',
        tags TEXT[] DEFAULT ARRAY[]::TEXT[],
        version VARCHAR(20) DEFAULT '1.0',
        language VARCHAR(10) DEFAULT 'en',
        format VARCHAR(20) DEFAULT 'markdown',
        metadata JSONB DEFAULT '{}',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS ai_training_data (
        id SERIAL PRIMARY KEY,
        data_type VARCHAR(50) NOT NULL,
        category VARCHAR(100) NOT NULL,
        input TEXT NOT NULL,
        expected_output TEXT,
        actual_output TEXT,
        feedback TEXT,
        quality INTEGER,
        accuracy DECIMAL(5,2),
        relevance INTEGER,
        source_type VARCHAR(50),
        source_id INTEGER,
        contributed_by INTEGER REFERENCES users(id),
        is_approved BOOLEAN DEFAULT false,
        approved_by INTEGER REFERENCES users(id),
        approved_at TIMESTAMPTZ,
        used_in_training BOOLEAN DEFAULT false,
        training_date TIMESTAMPTZ,
        classification_level VARCHAR(50) DEFAULT 'unclassified',
        sanitized BOOLEAN DEFAULT false,
        tags TEXT[] DEFAULT ARRAY[]::TEXT[],
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS ai_analytics (
        id SERIAL PRIMARY KEY,
        metric_type VARCHAR(50) NOT NULL,
        metric_name VARCHAR(100) NOT NULL,
        timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        timeframe VARCHAR(20) NOT NULL,
        scope VARCHAR(50),
        scope_id VARCHAR(100),
        value DECIMAL(15,4) NOT NULL,
        count INTEGER,
        percentage DECIMAL(5,2),
        breakdown JSONB DEFAULT '{}',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS ai_model_configurations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        provider enum_ai_provider NOT NULL,
        model VARCHAR(100) NOT NULL,
        version VARCHAR(50),
        configuration JSONB DEFAULT '{}',
        parameters JSONB DEFAULT '{}',
        system_prompt TEXT,
        is_active BOOLEAN DEFAULT true,
        usage_limit INTEGER,
        cost_limit DECIMAL(10,4),
        average_response_time INTEGER,
        success_rate DECIMAL(5,2),
        average_cost DECIMAL(10,6),
        security_level VARCHAR(50) DEFAULT 'standard',
        compliance_approved BOOLEAN DEFAULT false,
        data_retention INTEGER,
        description TEXT,
        tags TEXT[] DEFAULT ARRAY[]::TEXT[],
        metadata JSONB DEFAULT '{}',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS ai_automation_rules (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        trigger_type VARCHAR(50) NOT NULL,
        trigger_conditions JSONB DEFAULT '{}',
        ai_request_type enum_ai_request_type NOT NULL,
        model_config_id INTEGER REFERENCES ai_model_configurations(id),
        prompt_template TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        requires_approval BOOLEAN DEFAULT true,
        max_executions_per_day INTEGER DEFAULT 10,
        auto_implement BOOLEAN DEFAULT false,
        notification_settings JSONB DEFAULT '{}',
        execution_count INTEGER DEFAULT 0,
        success_count INTEGER DEFAULT 0,
        last_executed TIMESTAMPTZ,
        tags TEXT[] DEFAULT ARRAY[]::TEXT[],
        metadata JSONB DEFAULT '{}',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;

    console.log('✅ AI Assistance tables created successfully');

    console.log('📊 Creating indexes for performance...');

    // Create indexes for SIEM tables
    await sql`CREATE INDEX IF NOT EXISTS idx_siem_events_timestamp ON siem_events(timestamp);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_siem_events_source_ip ON siem_events(source_ip);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_siem_events_event_type ON siem_events(event_type);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_siem_events_severity ON siem_events(severity);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_siem_alerts_status ON siem_alerts(status);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_siem_alerts_severity ON siem_alerts(severity);`;

    // Create indexes for AI Assistance tables
    await sql`CREATE INDEX IF NOT EXISTS idx_ai_requests_user_id ON ai_assistance_requests(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ai_requests_type ON ai_assistance_requests(request_type);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ai_requests_status ON ai_assistance_requests(status);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ai_requests_created_at ON ai_assistance_requests(created_at);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ai_knowledge_category ON ai_knowledge_base(category);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ai_knowledge_validated ON ai_knowledge_base(is_validated);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ai_training_category ON ai_training_data(category);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ai_training_approved ON ai_training_data(is_approved);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ai_analytics_metric ON ai_analytics(metric_name);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ai_analytics_timestamp ON ai_analytics(timestamp);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ai_model_active ON ai_model_configurations(is_active);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ai_automation_active ON ai_automation_rules(is_active);`;

    console.log('✅ Indexes created successfully');

    console.log('🎉 Database migration completed successfully!');
    console.log('');
    console.log('📋 Summary of created tables:');
    console.log('   SIEM Tables:');
    console.log('   - siem_log_sources');
    console.log('   - siem_rules');
    console.log('   - siem_events');
    console.log('   - siem_alerts');
    console.log('   - siem_dashboards');
    console.log('   - siem_incidents');
    console.log('   - siem_threat_intelligence');
    console.log('   - siem_analytics');
    console.log('');
    console.log('   AI Assistance Tables:');
    console.log('   - ai_assistance_requests');
    console.log('   - ai_knowledge_base');
    console.log('   - ai_training_data');
    console.log('   - ai_analytics');
    console.log('   - ai_model_configurations');
    console.log('   - ai_automation_rules');
    console.log('');
    console.log('🚀 You can now use the AI Assistance and SIEM features!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run the migration
if (require.main === module) {
  createTables();
}

module.exports = { createTables };
