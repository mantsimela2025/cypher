-- Add missing columns to categories table to match the schema
ALTER TABLE categories 
ADD COLUMN parent_id INTEGER REFERENCES categories(id),
ADD COLUMN status TEXT DEFAULT 'active' NOT NULL,
ADD COLUMN metadata JSONB DEFAULT '{}',
ADD COLUMN created_by INTEGER REFERENCES users(id),
ADD COLUMN updated_by INTEGER REFERENCES users(id);

-- Update existing records to have proper values
UPDATE categories SET 
  status = 'active',
  metadata = '{}',
  created_by = 6,
  updated_by = 6
WHERE created_by IS NULL;

-- Make created_by and updated_by NOT NULL after setting values
ALTER TABLE categories 
ALTER COLUMN created_by SET NOT NULL,
ALTER COLUMN updated_by SET NOT NULL;