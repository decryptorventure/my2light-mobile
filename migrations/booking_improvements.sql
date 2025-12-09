-- ============================================
-- Booking Flow Improvements Migration
-- Manual Approval Flow: pending → approved/rejected
-- ============================================

-- 0. Update status check constraint to include 'approved' and 'rejected'
-- Drop old constraint and create new one
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('pending', 'approved', 'active', 'completed', 'cancelled', 'rejected'));

-- 1. Add new columns to bookings table if not exist
DO $$
BEGIN
    -- Add cancel_reason column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bookings' AND column_name = 'cancel_reason') THEN
        ALTER TABLE bookings ADD COLUMN cancel_reason text;
    END IF;
    
    -- Add approved_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bookings' AND column_name = 'approved_at') THEN
        ALTER TABLE bookings ADD COLUMN approved_at timestamptz;
    END IF;
    
    -- Add approved_by column  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bookings' AND column_name = 'approved_by') THEN
        ALTER TABLE bookings ADD COLUMN approved_by uuid REFERENCES auth.users(id);
    END IF;
    
    -- Add notes column for owner notes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bookings' AND column_name = 'notes') THEN
        ALTER TABLE bookings ADD COLUMN notes text;
    END IF;
END $$;

-- 2. Create booking status history table for audit trail
CREATE TABLE IF NOT EXISTS booking_status_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    old_status text,
    new_status text NOT NULL,
    changed_by uuid REFERENCES auth.users(id),
    reason text,
    created_at timestamptz DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_status_history_booking 
ON booking_status_history(booking_id);

CREATE INDEX IF NOT EXISTS idx_status_history_created 
ON booking_status_history(created_at DESC);

-- 3. Enable Row Level Security on status history
ALTER TABLE booking_status_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own booking history
DROP POLICY IF EXISTS "Users can view their booking history" ON booking_status_history;
CREATE POLICY "Users can view their booking history"
ON booking_status_history
FOR SELECT
USING (
    booking_id IN (
        SELECT id FROM bookings WHERE user_id = auth.uid()
    )
);

-- Policy: Court owners can view history for their courts
DROP POLICY IF EXISTS "Owners can view court booking history" ON booking_status_history;
CREATE POLICY "Owners can view court booking history"
ON booking_status_history
FOR SELECT
USING (
    booking_id IN (
        SELECT b.id FROM bookings b
        JOIN courts c ON b.court_id = c.id
        WHERE c.owner_id = auth.uid()
    )
);


-- 4. Function to check slot conflicts
CREATE OR REPLACE FUNCTION check_booking_conflict(
    p_court_id uuid,
    p_start_time timestamptz,
    p_end_time timestamptz,
    p_exclude_booking_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
    has_conflict boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM bookings
        WHERE court_id = p_court_id
          AND status IN ('pending', 'active', 'approved')
          AND id != COALESCE(p_exclude_booking_id, '00000000-0000-0000-0000-000000000000'::uuid)
          AND (
              (start_time <= p_start_time AND end_time > p_start_time)
              OR (start_time < p_end_time AND end_time >= p_end_time)
              OR (start_time >= p_start_time AND end_time <= p_end_time)
          )
    ) INTO has_conflict;
    
    RETURN has_conflict;
END;
$$;

-- 5. Function to log status changes (trigger)
CREATE OR REPLACE FUNCTION log_booking_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by)
        VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
    END IF;
    RETURN NEW;
END;
$$;

-- Create trigger for status logging
DROP TRIGGER IF EXISTS booking_status_change_trigger ON bookings;
CREATE TRIGGER booking_status_change_trigger
AFTER UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION log_booking_status_change();

-- 6. Enable Realtime for bookings table
-- Note: This requires running in Supabase Dashboard or having superuser privileges
-- ALTER PUBLICATION supabase_realtime ADD TABLE bookings;

-- 7. Create view for booking details (optimized query)
CREATE OR REPLACE VIEW booking_details AS
SELECT 
    b.id,
    b.user_id,
    b.court_id,
    b.package_id,
    b.start_time,
    b.end_time,
    b.status,
    b.total_amount,
    b.cancel_reason,
    b.approved_at,
    b.approved_by,
    b.notes,
    b.created_at,
    c.name as court_name,
    c.address as court_address,
    c.owner_id as court_owner_id,
    p.name as player_name,
    p.phone as player_phone,
    p.avatar as player_avatar,
    pkg.name as package_name,
    pkg.duration_minutes as package_duration
FROM bookings b
LEFT JOIN courts c ON b.court_id = c.id
LEFT JOIN profiles p ON b.user_id = p.id
LEFT JOIN packages pkg ON b.package_id = pkg.id;

-- 8. Add booking status enum comment for documentation
COMMENT ON TABLE bookings IS 'Booking statuses: pending (chờ duyệt), approved (đã duyệt), active (đang diễn ra), completed (hoàn thành), cancelled (đã hủy), rejected (từ chối)';

-- ============================================
-- INDEXES for performance (if not exist)
-- ============================================

-- Index for pending bookings (for owner dashboard)
CREATE INDEX IF NOT EXISTS idx_bookings_pending 
ON bookings(court_id, status) 
WHERE status = 'pending';

-- Index for upcoming bookings
CREATE INDEX IF NOT EXISTS idx_bookings_upcoming 
ON bookings(user_id, start_time) 
WHERE status IN ('pending', 'approved', 'active');

-- Composite index for slot availability check
CREATE INDEX IF NOT EXISTS idx_bookings_slot_check 
ON bookings(court_id, start_time, end_time, status);
