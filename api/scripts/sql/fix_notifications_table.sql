-- Fix notifications table schema
-- Add missing user_id column and create proper foreign key relationship

-- Step 1: Add user_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE notifications 
        ADD COLUMN user_id INTEGER;
        
        -- Add foreign key constraint
        ALTER TABLE notifications 
        ADD CONSTRAINT notifications_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        
        -- Add index for performance
        CREATE INDEX IF NOT EXISTS notifications_user_id_idx 
        ON notifications (user_id);
        
        RAISE NOTICE 'Successfully added user_id column to notifications table';
    ELSE
        RAISE NOTICE 'user_id column already exists in notifications table';
    END IF;
END $$;

-- Step 2: Verify the column exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND column_name = 'user_id';