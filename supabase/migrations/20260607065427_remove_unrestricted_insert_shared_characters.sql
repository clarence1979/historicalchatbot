-- Remove the unrestricted anon INSERT policy.
-- Inserts are now handled exclusively by the create-share edge function
-- which uses the service role key and validates inputs before inserting.
DROP POLICY IF EXISTS "insert_shared_characters" ON shared_characters;
