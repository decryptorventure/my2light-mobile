-- ============================================
-- Court Reviews Migration
-- Allows users to rate and review courts
-- ============================================

-- 1. Create court_reviews table
CREATE TABLE IF NOT EXISTS court_reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    court_id uuid NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    -- One review per user per court
    CONSTRAINT unique_user_court_review UNIQUE (user_id, court_id)
);

-- 2. Enable RLS
ALTER TABLE court_reviews ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Anyone can read reviews
DROP POLICY IF EXISTS "Anyone can read reviews" ON court_reviews;
CREATE POLICY "Anyone can read reviews"
ON court_reviews FOR SELECT
USING (true);

-- Users can create their own reviews
DROP POLICY IF EXISTS "Users can create reviews" ON court_reviews;
CREATE POLICY "Users can create reviews"
ON court_reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
DROP POLICY IF EXISTS "Users can update own reviews" ON court_reviews;
CREATE POLICY "Users can update own reviews"
ON court_reviews FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own reviews
DROP POLICY IF EXISTS "Users can delete own reviews" ON court_reviews;
CREATE POLICY "Users can delete own reviews"
ON court_reviews FOR DELETE
USING (auth.uid() = user_id);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_court ON court_reviews(court_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON court_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON court_reviews(rating);

-- 5. Function to update court rating when review is added/updated/deleted
CREATE OR REPLACE FUNCTION update_court_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    avg_rating numeric;
    review_count integer;
    target_court_id uuid;
BEGIN
    -- Get the court_id based on operation
    IF TG_OP = 'DELETE' THEN
        target_court_id := OLD.court_id;
    ELSE
        target_court_id := NEW.court_id;
    END IF;
    
    -- Calculate new average rating
    SELECT 
        COALESCE(AVG(rating)::numeric(2,1), 0),
        COUNT(*)
    INTO avg_rating, review_count
    FROM court_reviews
    WHERE court_id = target_court_id;
    
    -- Update court
    UPDATE courts
    SET rating = avg_rating,
        total_reviews = review_count
    WHERE id = target_court_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- 6. Create triggers
DROP TRIGGER IF EXISTS update_court_rating_insert ON court_reviews;
CREATE TRIGGER update_court_rating_insert
AFTER INSERT ON court_reviews
FOR EACH ROW EXECUTE FUNCTION update_court_rating();

DROP TRIGGER IF EXISTS update_court_rating_update ON court_reviews;
CREATE TRIGGER update_court_rating_update
AFTER UPDATE ON court_reviews
FOR EACH ROW EXECUTE FUNCTION update_court_rating();

DROP TRIGGER IF EXISTS update_court_rating_delete ON court_reviews;
CREATE TRIGGER update_court_rating_delete
AFTER DELETE ON court_reviews
FOR EACH ROW EXECUTE FUNCTION update_court_rating();

-- 7. Add total_reviews column to courts if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'courts' AND column_name = 'total_reviews') THEN
        ALTER TABLE courts ADD COLUMN total_reviews integer DEFAULT 0;
    END IF;
END $$;
