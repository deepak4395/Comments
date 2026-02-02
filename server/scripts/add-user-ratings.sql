-- Migration: Add user ratings feature
-- Run this after init-db.sql to add user rating functionality

-- Add rating columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avg_rating DECIMAL(3,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;

-- Create user_ratings table
CREATE TABLE IF NOT EXISTS user_ratings (
    id SERIAL PRIMARY KEY,
    rater_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rated_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rater_id, rated_user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_ratings_rater_id ON user_ratings(rater_id);
CREATE INDEX IF NOT EXISTS idx_user_ratings_rated_user_id ON user_ratings(rated_user_id);
CREATE INDEX IF NOT EXISTS idx_user_ratings_created_at ON user_ratings(created_at DESC);

-- Trigger to automatically update updated_at for user_ratings
CREATE TRIGGER update_user_ratings_updated_at BEFORE UPDATE ON user_ratings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update user's average rating and total count
CREATE OR REPLACE FUNCTION update_user_avg_rating(user_id_param INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE users
    SET 
        avg_rating = (
            SELECT AVG(rating)::DECIMAL(3,2)
            FROM user_ratings
            WHERE rated_user_id = user_id_param
        ),
        total_ratings = (
            SELECT COUNT(*)
            FROM user_ratings
            WHERE rated_user_id = user_id_param
        )
    WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update avg_rating after insert
CREATE OR REPLACE FUNCTION trigger_update_user_avg_rating()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_user_avg_rating(NEW.rated_user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_insert_user_rating
AFTER INSERT ON user_ratings
FOR EACH ROW EXECUTE FUNCTION trigger_update_user_avg_rating();

-- Trigger to update avg_rating after update
CREATE TRIGGER after_update_user_rating
AFTER UPDATE ON user_ratings
FOR EACH ROW EXECUTE FUNCTION trigger_update_user_avg_rating();

-- Trigger to update avg_rating after delete
CREATE OR REPLACE FUNCTION trigger_update_user_avg_rating_delete()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_user_avg_rating(OLD.rated_user_id);
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_delete_user_rating
AFTER DELETE ON user_ratings
FOR EACH ROW EXECUTE FUNCTION trigger_update_user_avg_rating_delete();
