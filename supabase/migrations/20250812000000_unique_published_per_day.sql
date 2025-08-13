-- Enforce at most one published log per calendar day (UTC) per user
-- Note: The direct approach with (created_at::date) in index fails because
-- the cast function is not marked as IMMUTABLE in PostgreSQL.
-- The next migration (20250812000100) provides the proper solution using a generated column.

-- Placeholder to make this migration valid while the next migration handles the constraint
SELECT 1 as migration_placeholder;


