-- Fix for existing questions without user_id
-- Run this in Supabase SQL Editor

-- Option 1: Add your user_id to all existing questions that don't have one
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID from auth.users
UPDATE questions 
SET user_id = 'YOUR_USER_ID_HERE'
WHERE user_id IS NULL;

-- Option 2: Or delete all questions without user_id
-- DELETE FROM questions WHERE user_id IS NULL;

-- To find your user ID, run this:
-- SELECT id, email FROM auth.users;
