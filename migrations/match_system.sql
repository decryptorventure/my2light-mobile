-- ============================================
-- Match-making System Migration
-- Privacy-focused design: in-app messaging only
-- ============================================

-- 1. Match Responses Table (track interest in matches)
CREATE TABLE IF NOT EXISTS match_responses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    match_request_id uuid NOT NULL REFERENCES match_requests(id) ON DELETE CASCADE,
    responder_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
    message text, -- Optional intro message (max 200 chars in app)
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    -- One response per user per match request
    CONSTRAINT unique_response_per_user UNIQUE (match_request_id, responder_id)
);

-- 2. Match Conversations Table (created when both accept)
CREATE TABLE IF NOT EXISTS match_conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    match_request_id uuid REFERENCES match_requests(id) ON DELETE SET NULL,
    -- Always store user_a < user_b by UUID to avoid duplicates
    user_a uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_b uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
    created_at timestamptz DEFAULT now(),
    -- Ensure unique conversation between two users
    CONSTRAINT unique_conversation UNIQUE (user_a, user_b),
    -- Ensure user_a < user_b
    CONSTRAINT user_order CHECK (user_a < user_b)
);

-- 3. Match Messages Table (in-app messaging)
CREATE TABLE IF NOT EXISTS match_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES match_conversations(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- 4. User Blocks Table (privacy protection)
CREATE TABLE IF NOT EXISTS user_blocks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason text,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT unique_block UNIQUE (blocker_id, blocked_id),
    CONSTRAINT no_self_block CHECK (blocker_id != blocked_id)
);

-- 5. User Reports Table (safety)
CREATE TABLE IF NOT EXISTS user_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reported_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason text NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'fake_profile', 'other')),
    description text,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'action_taken', 'dismissed')),
    created_at timestamptz DEFAULT now(),
    reviewed_at timestamptz,
    reviewed_by uuid REFERENCES auth.users(id)
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE match_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

-- MATCH RESPONSES POLICIES
-- Users can see responses to their own match requests
DROP POLICY IF EXISTS "Users can view responses to their requests" ON match_responses;
CREATE POLICY "Users can view responses to their requests"
ON match_responses FOR SELECT
USING (
    responder_id = auth.uid()
    OR match_request_id IN (SELECT id FROM match_requests WHERE user_id = auth.uid())
);

-- Users can create responses (not to their own requests)
DROP POLICY IF EXISTS "Users can respond to match requests" ON match_responses;
CREATE POLICY "Users can respond to match requests"
ON match_responses FOR INSERT
WITH CHECK (
    responder_id = auth.uid()
    AND match_request_id NOT IN (SELECT id FROM match_requests WHERE user_id = auth.uid())
    AND auth.uid() NOT IN (SELECT blocked_id FROM user_blocks WHERE blocker_id = (SELECT user_id FROM match_requests WHERE id = match_request_id))
);

-- Users can update their own responses
DROP POLICY IF EXISTS "Users can update own responses" ON match_responses;
CREATE POLICY "Users can update own responses"
ON match_responses FOR UPDATE
USING (responder_id = auth.uid());

-- MATCH CONVERSATIONS POLICIES
-- Users can only see their own conversations
DROP POLICY IF EXISTS "Users can view own conversations" ON match_conversations;
CREATE POLICY "Users can view own conversations"
ON match_conversations FOR SELECT
USING (user_a = auth.uid() OR user_b = auth.uid());

-- System creates conversations (via function)
DROP POLICY IF EXISTS "System can create conversations" ON match_conversations;
CREATE POLICY "System can create conversations"
ON match_conversations FOR INSERT
WITH CHECK (user_a = auth.uid() OR user_b = auth.uid());

-- Users can update their conversation status (archive/block)
DROP POLICY IF EXISTS "Users can update conversation status" ON match_conversations;
CREATE POLICY "Users can update conversation status"
ON match_conversations FOR UPDATE
USING (user_a = auth.uid() OR user_b = auth.uid());

-- MATCH MESSAGES POLICIES
-- Users can only see messages in their conversations
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON match_messages;
CREATE POLICY "Users can view messages in their conversations"
ON match_messages FOR SELECT
USING (
    conversation_id IN (
        SELECT id FROM match_conversations 
        WHERE user_a = auth.uid() OR user_b = auth.uid()
    )
);

-- Users can send messages in active conversations
DROP POLICY IF EXISTS "Users can send messages" ON match_messages;
CREATE POLICY "Users can send messages"
ON match_messages FOR INSERT
WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IN (
        SELECT id FROM match_conversations 
        WHERE (user_a = auth.uid() OR user_b = auth.uid())
        AND status = 'active'
    )
);

-- Users can mark messages as read
DROP POLICY IF EXISTS "Users can mark messages read" ON match_messages;
CREATE POLICY "Users can mark messages read"
ON match_messages FOR UPDATE
USING (
    sender_id != auth.uid()
    AND conversation_id IN (
        SELECT id FROM match_conversations 
        WHERE user_a = auth.uid() OR user_b = auth.uid()
    )
);

-- USER BLOCKS POLICIES
-- Users can only see their own blocks
DROP POLICY IF EXISTS "Users can view own blocks" ON user_blocks;
CREATE POLICY "Users can view own blocks"
ON user_blocks FOR SELECT
USING (blocker_id = auth.uid());

-- Users can create blocks
DROP POLICY IF EXISTS "Users can block others" ON user_blocks;
CREATE POLICY "Users can block others"
ON user_blocks FOR INSERT
WITH CHECK (blocker_id = auth.uid());

-- Users can delete their blocks
DROP POLICY IF EXISTS "Users can unblock others" ON user_blocks;
CREATE POLICY "Users can unblock others"
ON user_blocks FOR DELETE
USING (blocker_id = auth.uid());

-- USER REPORTS POLICIES
-- Users can view their own reports
DROP POLICY IF EXISTS "Users can view own reports" ON user_reports;
CREATE POLICY "Users can view own reports"
ON user_reports FOR SELECT
USING (reporter_id = auth.uid());

-- Users can create reports
DROP POLICY IF EXISTS "Users can report others" ON user_reports;
CREATE POLICY "Users can report others"
ON user_reports FOR INSERT
WITH CHECK (reporter_id = auth.uid());

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_responses_request ON match_responses(match_request_id);
CREATE INDEX IF NOT EXISTS idx_responses_responder ON match_responses(responder_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_a ON match_conversations(user_a);
CREATE INDEX IF NOT EXISTS idx_conversations_user_b ON match_conversations(user_b);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON match_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON match_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON user_blocks(blocked_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to create conversation when match is accepted
CREATE OR REPLACE FUNCTION create_match_conversation(
    p_match_request_id uuid,
    p_responder_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_requester_id uuid;
    v_user_a uuid;
    v_user_b uuid;
    v_conversation_id uuid;
BEGIN
    -- Get the original requester
    SELECT user_id INTO v_requester_id
    FROM match_requests
    WHERE id = p_match_request_id;
    
    IF v_requester_id IS NULL THEN
        RAISE EXCEPTION 'Match request not found';
    END IF;
    
    -- Order UUIDs for consistent storage
    IF v_requester_id < p_responder_id THEN
        v_user_a := v_requester_id;
        v_user_b := p_responder_id;
    ELSE
        v_user_a := p_responder_id;
        v_user_b := v_requester_id;
    END IF;
    
    -- Check if conversation already exists
    SELECT id INTO v_conversation_id
    FROM match_conversations
    WHERE user_a = v_user_a AND user_b = v_user_b;
    
    IF v_conversation_id IS NOT NULL THEN
        -- Reactivate if archived
        UPDATE match_conversations
        SET status = 'active'
        WHERE id = v_conversation_id AND status = 'archived';
        RETURN v_conversation_id;
    END IF;
    
    -- Create new conversation
    INSERT INTO match_conversations (match_request_id, user_a, user_b)
    VALUES (p_match_request_id, v_user_a, v_user_b)
    RETURNING id INTO v_conversation_id;
    
    RETURN v_conversation_id;
END;
$$;

-- Function to check if user is blocked
CREATE OR REPLACE FUNCTION is_user_blocked(
    p_user_id uuid,
    p_other_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_blocks
        WHERE (blocker_id = p_user_id AND blocked_id = p_other_user_id)
           OR (blocker_id = p_other_user_id AND blocked_id = p_user_id)
    );
END;
$$;

-- Function to get unread message count
CREATE OR REPLACE FUNCTION get_unread_message_count(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    v_count integer;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM match_messages m
    JOIN match_conversations c ON m.conversation_id = c.id
    WHERE (c.user_a = p_user_id OR c.user_b = p_user_id)
      AND m.sender_id != p_user_id
      AND m.is_read = false;
    
    RETURN v_count;
END;
$$;
