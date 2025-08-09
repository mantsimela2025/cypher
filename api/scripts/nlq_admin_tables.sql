-- NLQ Admin Interface Tables

-- 1. Data Sources Table
CREATE TABLE IF NOT EXISTS nlq_data_sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL, -- e.g. 'table', 'api', 'service'
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    schema JSONB NOT NULL,
    description TEXT,
    sample_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Prompt/Config Table
CREATE TABLE IF NOT EXISTS nlq_prompt_config (
    id SERIAL PRIMARY KEY,
    prompt TEXT NOT NULL,
    schema_context JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Query Logs Table
CREATE TABLE IF NOT EXISTS nlq_query_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID,
    question TEXT NOT NULL,
    interpreted TEXT,
    generated_query TEXT,
    result JSONB,
    status VARCHAR(20) NOT NULL, -- 'success', 'error'
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Few-Shot Examples Table (optional)
CREATE TABLE IF NOT EXISTS nlq_few_shot_examples (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    data_source_id INTEGER REFERENCES nlq_data_sources(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
