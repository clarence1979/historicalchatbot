/*
  # Fix Security Issues in Characters Table

  ## Overview
  This migration addresses critical security vulnerabilities and removes unused database resources.

  ## Changes Made

  ### 1. Drop Unused Indexes
    - Remove `idx_characters_id` (redundant with primary key)
    - Remove `idx_characters_created_at` (not being used by queries)

  ### 2. Add User ID Column
    - Add `user_id` column to track authenticated users who create characters
    - Links to auth.users table
    - Nullable to support migration of existing data

  ### 3. Replace Overly Permissive RLS Policies
    
    **Old Policies (INSECURE):**
    - "Anyone can view characters" - Used `true` allowing unrestricted access
    - "Anyone can create characters" - Used `true` allowing anyone to create characters
    
    **New Policies (SECURE):**
    - **SELECT**: Authenticated users can view their own characters based on user_id
    - **INSERT**: Authenticated users can only create characters with their own user_id
    - **UPDATE**: Authenticated users can only update their own characters
    - **DELETE**: Authenticated users can only delete their own characters

  ## Security Notes
  - All policies now require authentication
  - Users can only access their own data
  - WITH CHECK ensures users cannot bypass ownership on insert/update
  - USING clause prevents users from accessing other users' data

  ## Migration Safety
  - Existing data is preserved
  - user_id defaults to NULL for existing records
  - Policies are replaced atomically
*/

-- Drop unused indexes
DROP INDEX IF EXISTS idx_characters_id;
DROP INDEX IF EXISTS idx_characters_created_at;

-- Add user_id column to track ownership
ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index on user_id for efficient queries
CREATE INDEX IF NOT EXISTS idx_characters_user_id ON characters(user_id);

-- Drop old insecure policies
DROP POLICY IF EXISTS "Anyone can view characters" ON characters;
DROP POLICY IF EXISTS "Anyone can create characters" ON characters;

-- Create secure SELECT policy: Users can only view their own characters
CREATE POLICY "Users can view own characters"
  ON characters
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create secure INSERT policy: Users can only create characters for themselves
CREATE POLICY "Users can create own characters"
  ON characters
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create secure UPDATE policy: Users can only update their own characters
CREATE POLICY "Users can update own characters"
  ON characters
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create secure DELETE policy: Users can only delete their own characters
CREATE POLICY "Users can delete own characters"
  ON characters
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);