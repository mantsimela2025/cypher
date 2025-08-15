-- Complete notifications table schema fix
-- Add all missing columns from the schema definition

DO $$ 
BEGIN
    -- Add read_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'read_at'
    ) THEN
        ALTER TABLE notifications 
        ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added read_at column';
    END IF;

    -- Add module column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'module'
    ) THEN
        ALTER TABLE notifications 
        ADD COLUMN module VARCHAR(50);
        RAISE NOTICE 'Added module column';
    END IF;

    -- Add event_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'event_type'
    ) THEN
        ALTER TABLE notifications 
        ADD COLUMN event_type VARCHAR(50);
        RAISE NOTICE 'Added event_type column';
    END IF;

    -- Add related_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'related_id'
    ) THEN
        ALTER TABLE notifications 
        ADD COLUMN related_id INTEGER;
        RAISE NOTICE 'Added related_id column';
    END IF;

    -- Add related_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'related_type'
    ) THEN
        ALTER TABLE notifications 
        ADD COLUMN related_type VARCHAR(50);
        RAISE NOTICE 'Added related_type column';
    END IF;

    -- Add metadata column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE notifications 
        ADD COLUMN metadata JSONB DEFAULT '{}';
        RAISE NOTICE 'Added metadata column';
    END IF;

    -- Add expires_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'expires_at'
    ) THEN
        ALTER TABLE notifications 
        ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added expires_at column';
    END IF;

    -- Add priority column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'priority'
    ) THEN
        ALTER TABLE notifications 
        ADD COLUMN priority INTEGER DEFAULT 1;
        RAISE NOTICE 'Added priority column';
    END IF;

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS notifications_module_idx 
    ON notifications (module);
    
    CREATE INDEX IF NOT EXISTS notifications_event_type_idx 
    ON notifications (event_type);
    
    CREATE INDEX IF NOT EXISTS notifications_priority_idx 
    ON notifications (priority);
    
    CREATE INDEX IF NOT EXISTS notifications_expires_at_idx 
    ON notifications (expires_at);
    
    CREATE INDEX IF NOT EXISTS notifications_related_idx 
    ON notifications (related_id, related_type);

    RAISE NOTICE 'Notifications table schema update completed successfully';
END $$;

-- Verify all columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position;