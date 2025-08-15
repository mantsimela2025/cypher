-- Adds a unique constraint to prevent duplicate memberships in the same group
-- Safe to run multiple times if guarded by a check
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE c.conname = 'uq_distribution_group_members_group_user'
      AND t.relname = 'distribution_group_members'
  ) THEN
    ALTER TABLE public.distribution_group_members
    ADD CONSTRAINT uq_distribution_group_members_group_user UNIQUE (group_id, user_id);
  END IF;
END $$;
