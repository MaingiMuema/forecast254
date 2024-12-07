-- Add new columns to market_comments table
ALTER TABLE market_comments 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES market_comments(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false;

-- Create market_comment_likes table for tracking likes
CREATE TABLE IF NOT EXISTS market_comment_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID NOT NULL REFERENCES market_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    UNIQUE(comment_id, user_id)
);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_market_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_market_comments_updated_at
    BEFORE UPDATE ON market_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_market_comments_updated_at();

-- Create function to update likes count
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE market_comments
        SET likes_count = likes_count + 1
        WHERE id = NEW.comment_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE market_comments
        SET likes_count = likes_count - 1
        WHERE id = OLD.comment_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_comment_likes_count
    AFTER INSERT OR DELETE ON market_comment_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_likes_count();

-- Add RLS policies for comment likes
ALTER TABLE market_comment_likes ENABLE ROW LEVEL SECURITY;

-- Add new policies for comment updates and deletions
DROP POLICY IF EXISTS "Users can update their own comments" ON market_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON market_comments;
CREATE POLICY "Users can update their own comments"
    ON market_comments FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
    ON market_comments FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Policies for comment likes
CREATE POLICY "Anyone can view comment likes"
    ON market_comment_likes FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can like comments"
    ON market_comment_likes FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes"
    ON market_comment_likes FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
