-- Add role column to profiles table with a default value of 'user'
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user' 
CHECK (role IN ('user', 'admin', 'moderator'));
