-- Enable RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE passages ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Authenticated users can select questions" ON questions;
DROP POLICY IF EXISTS "Authenticated users can insert questions" ON questions;
DROP POLICY IF EXISTS "Authenticated users can update questions" ON questions;
DROP POLICY IF EXISTS "Authenticated users can delete questions" ON questions;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON questions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON questions;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON questions;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON questions;
DROP POLICY IF EXISTS "Everyone can view questions" ON questions;

DROP POLICY IF EXISTS "Authenticated users can select passages" ON passages;
DROP POLICY IF EXISTS "Authenticated users can insert passages" ON passages;
DROP POLICY IF EXISTS "Authenticated users can update passages" ON passages;
DROP POLICY IF EXISTS "Authenticated users can delete passages" ON passages;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON passages;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON passages;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON passages;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON passages;
DROP POLICY IF EXISTS "Everyone can view passages" ON passages;

-- Create unified, permissive policies for Authenticated Users (Admins)

-- QUESTIONS
CREATE POLICY "Enable all access for authenticated users" ON questions
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow public read access (for non-logged in users taking tests, if applicable)
CREATE POLICY "Enable read access for public" ON questions
FOR SELECT
TO public
USING (true);

-- PASSAGES
CREATE POLICY "Enable all access for authenticated users" ON passages
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow public read access
CREATE POLICY "Enable read access for public" ON passages
FOR SELECT
TO public
USING (true);
