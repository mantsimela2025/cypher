# Natural Language Query Database Schemas

## Overview
This document describes the database schemas for the Natural Language Query system, designed to support AI-powered natural language to SQL conversion, query processing, result management, and continuous improvement through user feedback.

## Schema Architecture

### 🏗️ Design Principles
- **NLP Workflow Support**: Complete pipeline from natural language to SQL to results
- **Performance Optimized**: Strategic indexes for fast query processing and analysis
- **User Feedback Integration**: Built-in feedback collection for ML model improvement
- **Template System**: Reusable query patterns for common use cases
- **Audit Trail**: Complete tracking of query processing and user interactions
- **Extensible Design**: JSON fields for flexible metadata and entity storage

## Tables

### 💬 nl_queries
**Purpose**: Tracks user natural language queries through the complete processing pipeline from input to results, including performance metrics and user feedback.

**Columns**:
```sql
id                  SERIAL PRIMARY KEY
query               TEXT NOT NULL
user_id             INTEGER NOT NULL REFERENCES users(id)
status              enum_nl_queries_status DEFAULT 'pending'
query_type          enum_nl_queries_query_type
intent              VARCHAR(255)
entities            JSONB DEFAULT '{}'
sql_query           TEXT
results             JSONB DEFAULT '{}'
result_count        INTEGER
execution_time      DECIMAL(15,2)
confidence          DECIMAL(15,2)
feedback            enum_nl_queries_feedback
feedback_comment    TEXT
error_message       TEXT
metadata            JSONB DEFAULT '{}'
created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
updated_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
```

**Indexes**:
- `idx_nl_queries_user_id` - User query lookups
- `idx_nl_queries_status` - Status-based filtering
- `idx_nl_queries_query_type` - Query type analysis
- `idx_nl_queries_intent` - Intent-based searches
- `idx_nl_queries_created_at` - Time-based queries
- `idx_nl_queries_confidence` - Confidence filtering
- `idx_nl_queries_feedback` - Feedback analysis
- `idx_nl_queries_execution_time` - Performance analysis
- `idx_nl_queries_user_status` - User + status composite
- `idx_nl_queries_status_created` - Status + time composite
- `idx_nl_queries_query_type_status` - Type + status composite

**Enums**:
- `status`: pending, processing, completed, failed, cancelled
- `query_type`: asset_search, cost_analysis, vulnerability_report, compliance_check, lifecycle_planning, operational_metrics, risk_assessment, general_query
- `feedback`: helpful, not_helpful, partially_helpful, incorrect, needs_improvement

### 📋 query_templates
**Purpose**: Stores reusable query templates with parameters for common natural language query patterns, enabling consistent and optimized query generation.

**Columns**:
```sql
id            SERIAL PRIMARY KEY
name          VARCHAR(100) NOT NULL
description   TEXT
query_text    TEXT NOT NULL
category      VARCHAR(50)
parameters    JSONB DEFAULT '{}'
created_by    INTEGER REFERENCES users(id)
created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
updated_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
```

**Indexes**:
- `idx_query_templates_name` - Name-based lookups
- `idx_query_templates_category` - Category filtering
- `idx_query_templates_created_by` - Creator lookups
- `idx_query_templates_created_at` - Time-based queries
- `idx_query_templates_category_created` - Category + time composite
- `idx_query_templates_created_by_name` - Creator + name composite

**Constraints**:
- `query_templates_name_unique` - Unique template names

## Natural Language Processing Workflow

### 🔄 Query Processing Pipeline
1. **Input**: User submits natural language query
2. **Classification**: Query type and intent identification
3. **Entity Extraction**: Extract structured entities from text
4. **SQL Generation**: Convert to SQL using templates or AI
5. **Execution**: Run generated SQL query
6. **Results**: Store and format results
7. **Feedback**: Collect user feedback for improvement

### 📊 Status Lifecycle
```
pending → processing → completed
                    → failed
                    → cancelled
```

### 🎯 Query Types and Use Cases

#### **Asset Search** (`asset_search`)
- Find assets by type, location, or properties
- Asset inventory queries
- Hardware/software discovery

#### **Cost Analysis** (`cost_analysis`)
- Financial reporting and analysis
- Budget tracking and forecasting
- Cost optimization queries

#### **Vulnerability Report** (`vulnerability_report`)
- Security vulnerability analysis
- Risk assessment queries
- Compliance reporting

#### **Compliance Check** (`compliance_check`)
- Regulatory compliance verification
- Policy adherence monitoring
- Audit preparation queries

#### **Lifecycle Planning** (`lifecycle_planning`)
- Asset lifecycle management
- Replacement planning
- Warranty and EOL tracking

#### **Operational Metrics** (`operational_metrics`)
- Performance monitoring
- Utilization analysis
- Operational efficiency queries

#### **Risk Assessment** (`risk_assessment`)
- Risk analysis and scoring
- Threat assessment
- Security posture evaluation

#### **General Query** (`general_query`)
- Miscellaneous queries
- Custom analysis requests
- Ad-hoc reporting

## Template System

### 📝 Template Structure
Templates use parameterized SQL with JSON schema for parameter validation:

```json
{
  "name": "asset_search_by_type",
  "description": "Search for assets by type with optional filters",
  "query_text": "SELECT * FROM assets WHERE asset_type = $1 AND ($2 IS NULL OR hostname ILIKE $2)",
  "category": "asset_search",
  "parameters": {
    "type": "object",
    "properties": {
      "asset_type": {"type": "string"},
      "hostname_filter": {"type": "string", "optional": true}
    }
  }
}
```

### 🔧 Template Categories
- **asset_search**: Asset discovery and inventory
- **cost_analysis**: Financial analysis and reporting
- **vulnerability_report**: Security and vulnerability queries
- **compliance_check**: Compliance and audit queries
- **lifecycle_planning**: Asset lifecycle management
- **operational_metrics**: Performance and utilization
- **risk_assessment**: Risk and security analysis

## Performance Optimization

### 📈 Index Strategy
1. **User Queries**: Fast user-specific query retrieval
2. **Status Filtering**: Efficient processing pipeline management
3. **Type Analysis**: Quick query categorization and routing
4. **Time-based Queries**: Historical analysis and reporting
5. **Feedback Analysis**: ML model improvement insights
6. **Template Management**: Fast template lookup and categorization

### 🚀 Query Performance Features
- **Composite Indexes**: Support complex filtering scenarios
- **JSONB Optimization**: Efficient JSON operations for entities and results
- **Status Indexing**: Fast processing pipeline queries
- **Time-series Support**: Optimized for temporal analysis

## Data Storage and Analysis

### 📊 Entity Storage
The `entities` JSONB field stores extracted entities in structured format:
```json
{
  "asset_types": ["server", "workstation"],
  "date_ranges": [{"start": "2024-01-01", "end": "2024-12-31"}],
  "locations": ["datacenter-1", "office-ny"],
  "cost_ranges": [{"min": 1000, "max": 50000}],
  "vendors": ["Dell", "HP", "Cisco"]
}
```

### 📈 Results Storage
The `results` JSONB field stores query results and metadata:
```json
{
  "data": [...],
  "summary": {
    "total_records": 150,
    "processing_time": 0.45,
    "cache_hit": false
  },
  "visualization": {
    "chart_type": "bar",
    "x_axis": "cost_type",
    "y_axis": "total_amount"
  }
}
```

### 🔍 Metadata Storage
The `metadata` JSONB field stores processing information:
```json
{
  "nlp_model": "gpt-4",
  "processing_version": "1.2.0",
  "template_used": "cost_analysis_by_period",
  "parameters": {"start_date": "2024-01-01", "end_date": "2024-12-31"},
  "cache_key": "cost_analysis_2024_hash123",
  "user_context": {"department": "IT", "role": "analyst"}
}
```

## Analytics and Reporting

### 📊 Query Analytics
- **Usage Patterns**: Most common query types and intents
- **Performance Metrics**: Execution time analysis and optimization
- **Success Rates**: Query completion and failure analysis
- **User Satisfaction**: Feedback analysis and improvement tracking

### 🎯 Template Analytics
- **Template Usage**: Most popular templates and categories
- **Parameter Analysis**: Common parameter patterns and values
- **Template Performance**: Execution time and success rates
- **Template Evolution**: Version tracking and improvement history

## Security and Privacy

### 🔒 Data Protection
- **Query Sanitization**: Prevent SQL injection through parameterization
- **Result Filtering**: Apply user permissions to query results
- **Audit Logging**: Complete query and access tracking
- **Data Masking**: Sensitive data protection in results

### 👤 User Context
- **Permission Integration**: Respect user access controls
- **Department Filtering**: Scope queries to user's department
- **Role-based Access**: Different query capabilities by role
- **Data Sovereignty**: Respect data access boundaries

## Integration Points

### 🔗 System Integration
- **Asset Management**: Query asset data and relationships
- **Cost Analysis**: Financial data analysis and reporting
- **Vulnerability Management**: Security data queries
- **User Management**: Authentication and authorization
- **Audit System**: Query logging and compliance

### 🤖 AI/ML Integration
- **NLP Models**: Intent classification and entity extraction
- **Query Generation**: Natural language to SQL conversion
- **Result Ranking**: Relevance scoring and optimization
- **Feedback Learning**: Continuous model improvement
- **Template Suggestion**: Intelligent template recommendations

## Best Practices

### 📋 Development Guidelines
1. **Parameterized Queries**: Always use parameterized SQL in templates
2. **Input Validation**: Validate all user inputs and parameters
3. **Error Handling**: Comprehensive error capture and logging
4. **Performance Monitoring**: Track execution times and optimize
5. **User Feedback**: Encourage and analyze user feedback

### 🎯 Operational Guidelines
1. **Template Management**: Regular template review and optimization
2. **Performance Monitoring**: Monitor query performance and bottlenecks
3. **Feedback Analysis**: Regular analysis of user feedback for improvements
4. **Security Audits**: Regular security reviews of query processing
5. **Data Retention**: Implement appropriate data retention policies

## Testing and Validation

### 🧪 Schema Testing
```bash
# Test schema structure and exports
npm run test:nl-query-schemas

# Generate migration SQL
npm run generate:nl-query-migration
```

### 📊 Query Testing
- **Template Validation**: Test all query templates with sample data
- **Performance Testing**: Validate query performance under load
- **Security Testing**: Test for SQL injection and access control
- **Integration Testing**: Validate with connected systems

This schema design provides a comprehensive foundation for natural language query processing with built-in support for machine learning, user feedback, and continuous improvement.
