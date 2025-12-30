-- Migration: Enable Row Level Security (RLS) on Core Tables
-- Date: 2025-12-30
-- Purpose: Implement OWASP M3 mitigation - Secure authentication/authorization
-- Security Level: CRITICAL
--
-- This migration enables RLS on core tables and creates policies to prevent
-- unauthorized data access using the Supabase anon key.
--
-- Tables affected: profiles, highlights, bookings, courts, notifications
--
-- Execute in Supabase SQL Editor

-- ============================================================================
-- STEP 1: Enable RLS on Core Tables
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Profiles Table Policies
-- ============================================================================

-- Users can read their own profile
CREATE POLICY "profiles_select_own"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Profiles are auto-created by trigger, so no INSERT policy needed for users

-- ============================================================================
-- STEP 3: Highlights Table Policies
-- ============================================================================

-- Users can read public highlights or their own private highlights
CREATE POLICY "highlights_select_public_or_own"
ON highlights FOR SELECT
USING (is_public = true OR auth.uid() = user_id);

-- Users can insert their own highlights
CREATE POLICY "highlights_insert_own"
ON highlights FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own highlights
CREATE POLICY "highlights_update_own"
ON highlights FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own highlights
CREATE POLICY "highlights_delete_own"
ON highlights FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 4: Bookings Table Policies
-- ============================================================================

-- Users can read their own bookings or bookings at courts they own
CREATE POLICY "bookings_select_own_or_owner"
ON bookings FOR SELECT
USING (
    auth.uid() = user_id
    OR auth.uid() IN (
        SELECT owner_id FROM courts WHERE id = bookings.court_id
    )
);

-- Users can insert their own bookings
CREATE POLICY "bookings_insert_own"
ON bookings FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own bookings
CREATE POLICY "bookings_update_own"
ON bookings FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own bookings (cancellation)
CREATE POLICY "bookings_delete_own"
ON bookings FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 5: Courts Table Policies
-- ============================================================================

-- All authenticated users can read active courts (public listings)
CREATE POLICY "courts_select_active"
ON courts FOR SELECT
USING (status = 'active');

-- Court owners can update their own courts
CREATE POLICY "courts_update_own"
ON courts FOR UPDATE
USING (auth.uid() = owner_id);

-- Court owners can insert new courts
CREATE POLICY "courts_insert_own"
ON courts FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- ============================================================================
-- STEP 6: Notifications Table Policies
-- ============================================================================

-- Users can read their own notifications
CREATE POLICY "notifications_select_own"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "notifications_update_own"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);

-- System can insert notifications (handled by triggers/functions)
-- No user INSERT policy needed

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these after applying migration to verify RLS is working:

/*
-- Check RLS is enabled
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('profiles', 'highlights', 'bookings', 'courts', 'notifications');

-- Check policies exist
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename IN ('profiles', 'highlights', 'bookings', 'courts', 'notifications')
ORDER BY tablename, policyname;

-- Test unauthorized access (should return 0 rows when using anon key)
-- This query should fail or return empty when executed with anon key:
SELECT * FROM profiles LIMIT 1;
*/

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
-- ONLY run this if you need to disable RLS (not recommended for production)

/*
-- Disable RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE highlights DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE courts DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Drop policies
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "highlights_select_public_or_own" ON highlights;
DROP POLICY IF EXISTS "highlights_insert_own" ON highlights;
DROP POLICY IF EXISTS "highlights_update_own" ON highlights;
DROP POLICY IF EXISTS "highlights_delete_own" ON highlights;
DROP POLICY IF EXISTS "bookings_select_own_or_owner" ON bookings;
DROP POLICY IF EXISTS "bookings_insert_own" ON bookings;
DROP POLICY IF EXISTS "bookings_update_own" ON bookings;
DROP POLICY IF EXISTS "bookings_delete_own" ON bookings;
DROP POLICY IF EXISTS "courts_select_active" ON courts;
DROP POLICY IF EXISTS "courts_update_own" ON courts;
DROP POLICY IF EXISTS "courts_insert_own" ON courts;
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
*/

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. These policies assume auth.uid() is the authenticated user's ID
-- 2. The anon key will NOT be able to access unauthorized data after this migration
-- 3. Service role key still bypasses RLS (use with caution)
-- 4. Test all user flows after applying this migration
-- 5. Monitor Supabase logs for RLS policy violations

-- END OF MIGRATION
