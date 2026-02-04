-- Temporary RLS Disable for Testing
-- Run this in Supabase SQL Editor

-- Disable RLS on users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Disable RLS on activity_log table  
ALTER TABLE activity_log DISABLE ROW LEVEL SECURITY;

-- Disable RLS on cases table
ALTER TABLE cases DISABLE ROW LEVEL SECURITY;

-- Disable RLS on clients table
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;

-- Disable RLS on hearings table
ALTER TABLE hearings DISABLE ROW LEVEL SECURITY;

-- Disable RLS on tasks table
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- Enable RLS back when ready (uncomment these lines when ready to enable security)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE hearings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
