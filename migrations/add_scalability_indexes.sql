-- Migration: Add indexes for scalability
-- This migration adds indexes to frequently queried columns
-- Run this in Supabase SQL Editor

-- =====================================================
-- HIGHLIGHTS TABLE INDEXES
-- =====================================================

-- Index for user highlights (library view)
CREATE INDEX IF NOT EXISTS idx_highlights_user_created 
ON highlights(user_id, created_at DESC);

-- Index for public feed
CREATE INDEX IF NOT EXISTS idx_highlights_public_created 
ON highlights(is_public, created_at DESC) 
WHERE is_public = true;

-- =====================================================
-- BOOKINGS TABLE INDEXES
-- =====================================================

-- Index for court owner dashboard (booking list by court)
CREATE INDEX IF NOT EXISTS idx_bookings_court_status 
ON bookings(court_id, status, created_at DESC);

-- Index for user's booking history
CREATE INDEX IF NOT EXISTS idx_bookings_user_status 
ON bookings(user_id, status, created_at DESC);

-- Index for date-range queries (availability check)
CREATE INDEX IF NOT EXISTS idx_bookings_court_time 
ON bookings(court_id, start_time, end_time) 
WHERE status IN ('pending', 'confirmed');

-- =====================================================
-- MATCH_REQUESTS TABLE INDEXES
-- =====================================================

-- Index for pending match requests (for finding opponents)
CREATE INDEX IF NOT EXISTS idx_match_requests_status_created 
ON match_requests(status, created_at DESC);

-- Index for user's match requests
CREATE INDEX IF NOT EXISTS idx_match_requests_user 
ON match_requests(user_id, status);

-- Index for challenger lookup
CREATE INDEX IF NOT EXISTS idx_match_requests_challenger 
ON match_requests(challenged_user_id, status);

-- =====================================================
-- PROFILES TABLE INDEXES  
-- =====================================================

-- Index for public profiles (social features)
CREATE INDEX IF NOT EXISTS idx_profiles_public 
ON profiles(is_public, name) 
WHERE is_public = true;

-- Index for court owner lookup
CREATE INDEX IF NOT EXISTS idx_profiles_role 
ON profiles(role) 
WHERE role = 'court_owner';

-- =====================================================
-- COURTS TABLE INDEXES
-- =====================================================

-- Index for court search by owner
CREATE INDEX IF NOT EXISTS idx_courts_owner 
ON courts(owner_id, is_active);

-- Index for active courts listing
CREATE INDEX IF NOT EXISTS idx_courts_active 
ON courts(is_active, created_at DESC) 
WHERE is_active = true;

-- =====================================================
-- NOTIFICATIONS TABLE INDEXES
-- =====================================================

-- Index for user's unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON notifications(user_id, is_read, created_at DESC);

-- =====================================================
-- VERIFY INDEXES CREATED
-- =====================================================

-- Run this to verify all indexes were created:
-- SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public';
