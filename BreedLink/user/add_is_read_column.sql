-- Add is_read column to messages table for tracking read/unread status
-- Run this in your Supabase SQL Editor

-- Add the column if it doesn't exist
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

-- Set existing messages as unread by default
UPDATE messages 
SET is_read = false 
WHERE is_read IS NULL;

-- Add index for better performance when querying unread messages
CREATE INDEX IF NOT EXISTS idx_messages_unread 
ON messages(match_id, receiver_id, is_read) 
WHERE is_read = false;

-- Optional: Add a comment to document the column
COMMENT ON COLUMN messages.is_read IS 'Tracks whether the receiver has read the message';
