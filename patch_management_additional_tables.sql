-- ============================================================================
-- PATCH MANAGEMENT SYSTEM - ADDITIONAL TABLES
-- ============================================================================
-- This script creates the additional tables needed for the comprehensive 
-- patch management system, working alongside your existing patches table.

-- ============================================================================
-- 1. PATCH JOBS TABLE
-- ============================================================================
-- For managing patch job execution, status tracking, and control

CREATE TABLE public.patch_jobs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    patch_ids INTEGER[] NOT NULL,  -- Array of patch IDs to be applied
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'queued', 'running', 'paused', 'completed', 
        'failed', 'cancelled', 'rolling_back', 'rolled_back'
    )),
    execution_type VARCHAR(50) NOT NULL DEFAULT 'manual' CHECK (execution_type IN (
        'manual', 'scheduled', 'triggered', 'automatic'
    )),
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    max_concurrency INTEGER DEFAULT 1 CHECK (max_concurrency >= 1),
    
    -- Scheduling
    scheduled_for TIMESTAMP NULL,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    
    -- Configuration
    rollback_on_failure BOOLEAN DEFAULT true,
    require_approval BOOLEAN DEFAULT false,
    max_retries INTEGER DEFAULT 3 CHECK (max_retries >= 0),
    retry_delay_minutes INTEGER DEFAULT 5,
    timeout_minutes INTEGER DEFAULT 60,
    
    -- Settings and notifications
    notification JSONB DEFAULT '{}',
    execution_settings JSONB DEFAULT '{}',
    progress_data JSONB DEFAULT '{}',
    
    -- Audit fields
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key to your existing users table
    FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Indexes for patch_jobs
CREATE INDEX idx_patch_jobs_status ON public.patch_jobs(status);
CREATE INDEX idx_patch_jobs_execution_type ON public.patch_jobs(execution_type);
CREATE INDEX idx_patch_jobs_priority ON public.patch_jobs(priority);
CREATE INDEX idx_patch_jobs_scheduled_for ON public.patch_jobs(scheduled_for);
CREATE INDEX idx_patch_jobs_created_by ON public.patch_jobs(created_by);
CREATE INDEX idx_patch_jobs_patch_ids ON public.patch_jobs USING GIN(patch_ids);

-- ============================================================================
-- 2. PATCH JOB TARGETS TABLE
-- ============================================================================
-- For tracking which assets are targeted by each job

CREATE TABLE public.patch_job_targets (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL,
    asset_uuid UUID NOT NULL,
    patch_id INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'running', 'completed', 'failed', 'cancelled', 'skipped'
    )),
    execution_order INTEGER DEFAULT 0,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    error_message TEXT NULL,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    logs JSONB DEFAULT '[]',
    
    FOREIGN KEY (job_id) REFERENCES public.patch_jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (asset_uuid) REFERENCES public.assets(asset_uuid) ON DELETE CASCADE,
    FOREIGN KEY (patch_id) REFERENCES public.patches(id) ON DELETE CASCADE
);

-- Indexes for patch_job_targets
CREATE INDEX idx_patch_job_targets_job_id ON public.patch_job_targets(job_id);
CREATE INDEX idx_patch_job_targets_asset_uuid ON public.patch_job_targets(asset_uuid);
CREATE INDEX idx_patch_job_targets_patch_id ON public.patch_job_targets(patch_id);
CREATE INDEX idx_patch_job_targets_status ON public.patch_job_targets(status);

-- ============================================================================
-- 3. PATCH JOB LOGS TABLE
-- ============================================================================
-- For detailed job execution logging

CREATE TABLE public.patch_job_logs (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL,
    target_id INTEGER NULL, -- NULL for job-level logs
    level VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (level IN (
        'trace', 'debug', 'info', 'warn', 'error', 'fatal'
    )),
    component VARCHAR(100) DEFAULT 'system',
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (job_id) REFERENCES public.patch_jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (target_id) REFERENCES public.patch_job_targets(id) ON DELETE CASCADE
);

-- Indexes for patch_job_logs
CREATE INDEX idx_patch_job_logs_job_id ON public.patch_job_logs(job_id);
CREATE INDEX idx_patch_job_logs_target_id ON public.patch_job_logs(target_id);
CREATE INDEX idx_patch_job_logs_level ON public.patch_job_logs(level);
CREATE INDEX idx_patch_job_logs_timestamp ON public.patch_job_logs(timestamp DESC);

-- ============================================================================
-- 4. PATCH JOB DEPENDENCIES TABLE
-- ============================================================================
-- For managing job dependencies and execution order

CREATE TABLE public.patch_job_dependencies (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL,
    depends_on_job_id INTEGER NOT NULL,
    dependency_type VARCHAR(50) DEFAULT 'blocks' CHECK (dependency_type IN (
        'blocks', 'requires_success', 'requires_completion'
    )),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (job_id) REFERENCES public.patch_jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (depends_on_job_id) REFERENCES public.patch_jobs(id) ON DELETE CASCADE,
    
    -- Prevent self-dependencies
    CHECK (job_id != depends_on_job_id)
);

-- Indexes for patch_job_dependencies
CREATE INDEX idx_patch_job_deps_job_id ON public.patch_job_dependencies(job_id);
CREATE INDEX idx_patch_job_deps_depends_on ON public.patch_job_dependencies(depends_on_job_id);
CREATE UNIQUE INDEX ux_patch_job_deps_unique ON public.patch_job_dependencies(job_id, depends_on_job_id);

-- ============================================================================
-- 5. PATCH SCHEDULES TABLE
-- ============================================================================
-- For automated patch scheduling with CRON expressions

CREATE TABLE public.patch_schedules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cron_expression VARCHAR(100) NOT NULL,
    timezone VARCHAR(100) DEFAULT 'UTC',
    enabled BOOLEAN DEFAULT true,
    
    -- Patch selection criteria
    patch_ids INTEGER[] NULL,  -- Specific patches, or NULL for criteria-based selection
    patch_criteria JSONB DEFAULT '{}', -- Criteria for dynamic patch selection
    
    -- Target configuration  
    target_assets UUID[] DEFAULT '{}', -- Specific assets, empty for all eligible
    target_criteria JSONB DEFAULT '{}', -- Criteria for dynamic asset selection
    
    -- Execution settings
    max_concurrency INTEGER DEFAULT 5 CHECK (max_concurrency >= 1),
    execution_timeout_minutes INTEGER DEFAULT 120,
    rollback_on_failure BOOLEAN DEFAULT true,
    require_approval BOOLEAN DEFAULT false,
    
    -- Schedule management
    next_execution TIMESTAMP NULL,
    last_execution TIMESTAMP NULL,
    execution_count INTEGER DEFAULT 0,
    
    -- Maintenance windows
    maintenance_window JSONB DEFAULT '{}', -- Time windows when execution is allowed
    execution_conditions JSONB DEFAULT '{}', -- Additional conditions for execution
    
    -- Notifications
    notification JSONB DEFAULT '{}',
    
    -- Audit fields
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Indexes for patch_schedules
CREATE INDEX idx_patch_schedules_enabled ON public.patch_schedules(enabled);
CREATE INDEX idx_patch_schedules_next_execution ON public.patch_schedules(next_execution);
CREATE INDEX idx_patch_schedules_created_by ON public.patch_schedules(created_by);
CREATE INDEX idx_patch_schedules_patch_ids ON public.patch_schedules USING GIN(patch_ids);
CREATE INDEX idx_patch_schedules_target_assets ON public.patch_schedules USING GIN(target_assets);

-- ============================================================================
-- 6. PATCH SCHEDULE EXECUTIONS TABLE
-- ============================================================================
-- For tracking schedule execution history

CREATE TABLE public.patch_schedule_executions (
    id SERIAL PRIMARY KEY,
    schedule_id INTEGER NOT NULL,
    job_id INTEGER NULL, -- NULL if execution failed to create job
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (status IN (
        'scheduled', 'running', 'completed', 'failed', 'cancelled', 'skipped'
    )),
    scheduled_for TIMESTAMP NOT NULL,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    patches_selected INTEGER[] DEFAULT '{}',
    assets_targeted UUID[] DEFAULT '{}',
    execution_summary JSONB DEFAULT '{}',
    error_message TEXT NULL,
    
    FOREIGN KEY (schedule_id) REFERENCES public.patch_schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES public.patch_jobs(id) ON DELETE SET NULL
);

-- Indexes for patch_schedule_executions
CREATE INDEX idx_patch_schedule_execs_schedule_id ON public.patch_schedule_executions(schedule_id);
CREATE INDEX idx_patch_schedule_execs_job_id ON public.patch_schedule_executions(job_id);
CREATE INDEX idx_patch_schedule_execs_status ON public.patch_schedule_executions(status);
CREATE INDEX idx_patch_schedule_execs_scheduled_for ON public.patch_schedule_executions(scheduled_for DESC);

-- ============================================================================
-- 7. PATCH APPROVALS TABLE
-- ============================================================================
-- For patch approval workflows

CREATE TABLE public.patch_approvals (
    id SERIAL PRIMARY KEY,
    patch_id INTEGER NOT NULL,
    job_id INTEGER NULL, -- NULL for patch-level approvals
    approval_type VARCHAR(50) NOT NULL DEFAULT 'patch_deployment' CHECK (approval_type IN (
        'patch_creation', 'patch_deployment', 'emergency_deployment', 'rollback'
    )),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'approved', 'rejected', 'cancelled', 'expired'
    )),
    
    -- Approval workflow
    approval_level INTEGER DEFAULT 1,
    required_approvals INTEGER DEFAULT 1,
    current_approvals INTEGER DEFAULT 0,
    
    -- Request details
    requested_by INTEGER NOT NULL,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    justification TEXT,
    risk_assessment JSONB DEFAULT '{}',
    
    -- Approval/rejection details
    approved_by INTEGER NULL,
    approved_at TIMESTAMP NULL,
    approval_notes TEXT NULL,
    expires_at TIMESTAMP NULL,
    
    FOREIGN KEY (patch_id) REFERENCES public.patches(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES public.patch_jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (requested_by) REFERENCES public.users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL
);

-- Indexes for patch_approvals
CREATE INDEX idx_patch_approvals_patch_id ON public.patch_approvals(patch_id);
CREATE INDEX idx_patch_approvals_job_id ON public.patch_approvals(job_id);
CREATE INDEX idx_patch_approvals_status ON public.patch_approvals(status);
CREATE INDEX idx_patch_approvals_requested_by ON public.patch_approvals(requested_by);
CREATE INDEX idx_patch_approvals_approved_by ON public.patch_approvals(approved_by);

-- ============================================================================
-- 8. PATCH APPROVAL HISTORY TABLE
-- ============================================================================
-- For tracking approval workflow history

CREATE TABLE public.patch_approval_history (
    id SERIAL PRIMARY KEY,
    approval_id INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN (
        'requested', 'approved', 'rejected', 'cancelled', 'expired', 'escalated'
    )),
    actor_id INTEGER NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    comments TEXT,
    metadata JSONB DEFAULT '{}',
    
    FOREIGN KEY (approval_id) REFERENCES public.patch_approvals(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Indexes for patch_approval_history
CREATE INDEX idx_patch_approval_history_approval_id ON public.patch_approval_history(approval_id);
CREATE INDEX idx_patch_approval_history_actor_id ON public.patch_approval_history(actor_id);
CREATE INDEX idx_patch_approval_history_timestamp ON public.patch_approval_history(timestamp DESC);

-- ============================================================================
-- 9. PATCH NOTES TABLE
-- ============================================================================
-- For comprehensive audit trail and notes

CREATE TABLE public.patch_notes (
    id SERIAL PRIMARY KEY,
    patch_id INTEGER NOT NULL,
    job_id INTEGER NULL,
    note_type VARCHAR(50) NOT NULL DEFAULT 'general' CHECK (note_type IN (
        'general', 'deployment', 'testing', 'rollback', 'issue', 'resolution', 
        'approval', 'rejection', 'escalation', 'system_generated'
    )),
    title VARCHAR(255) NULL,
    content TEXT NOT NULL,
    visibility VARCHAR(20) DEFAULT 'internal' CHECK (visibility IN (
        'public', 'internal', 'restricted', 'private'
    )),
    
    -- Context and metadata
    context JSONB DEFAULT '{}',
    tags VARCHAR(50)[] DEFAULT '{}',
    attachments JSONB DEFAULT '[]', -- File references or URLs
    
    -- Audit fields
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (patch_id) REFERENCES public.patches(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES public.patch_jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Indexes for patch_notes
CREATE INDEX idx_patch_notes_patch_id ON public.patch_notes(patch_id);
CREATE INDEX idx_patch_notes_job_id ON public.patch_notes(job_id);
CREATE INDEX idx_patch_notes_note_type ON public.patch_notes(note_type);
CREATE INDEX idx_patch_notes_created_by ON public.patch_notes(created_by);
CREATE INDEX idx_patch_notes_created_at ON public.patch_notes(created_at DESC);
CREATE INDEX idx_patch_notes_tags ON public.patch_notes USING GIN(tags);

-- ============================================================================
-- 10. UPDATE TRIGGERS FOR TIMESTAMPS
-- ============================================================================
-- Trigger function for updating updated_at timestamps

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply timestamp triggers
CREATE TRIGGER update_patch_jobs_updated_at BEFORE UPDATE ON public.patch_jobs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patch_schedules_updated_at BEFORE UPDATE ON public.patch_schedules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patch_notes_updated_at BEFORE UPDATE ON public.patch_notes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 11. SAMPLE DATA SETUP (OPTIONAL)
-- ============================================================================
-- You can uncomment this section if you want some sample data for testing

/*
-- Sample patch job
INSERT INTO public.patch_jobs (name, description, patch_ids, created_by) 
VALUES (
    'Monthly Security Updates', 
    'Deploy critical security patches for production systems',
    ARRAY[1, 2, 3], -- Replace with actual patch IDs from your patches table
    1 -- Replace with actual user ID
);

-- Sample patch schedule  
INSERT INTO public.patch_schedules (name, description, cron_expression, created_by)
VALUES (
    'Weekly Maintenance Patches',
    'Automated weekly patch deployment during maintenance window', 
    '0 2 * * 1', -- Every Monday at 2 AM
    1 -- Replace with actual user ID
);
*/

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- This script creates the following additional tables for patch management:
-- 
-- 1. patch_jobs - Job execution and control
-- 2. patch_job_targets - Asset targeting for jobs  
-- 3. patch_job_logs - Detailed execution logging
-- 4. patch_job_dependencies - Job dependency management
-- 5. patch_schedules - Automated scheduling with CRON
-- 6. patch_schedule_executions - Schedule execution history
-- 7. patch_approvals - Approval workflow management
-- 8. patch_approval_history - Approval workflow audit trail
-- 9. patch_notes - Comprehensive notes and audit trail
-- 
-- These tables work alongside your existing patches table to provide:
-- ✅ Advanced job execution with parallel processing
-- ✅ CRON-based automated scheduling  
-- ✅ Multi-level approval workflows
-- ✅ Comprehensive audit trails and logging
-- ✅ Dependency management and rollback capabilities
-- ✅ Performance optimization with proper indexing
-- 
-- Total: 9 additional tables with 25+ indexes for optimal performance