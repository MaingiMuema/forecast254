-- Add role column to profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' 
                  AND column_name = 'role') THEN
        ALTER TABLE profiles ADD COLUMN role text DEFAULT 'user'::text;
    END IF;
END $$;

-- Create an enum type for roles if it doesn't exist
DO $$ 
BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'validator', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add constraint to ensure role is one of the allowed values if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check') THEN
        ALTER TABLE profiles 
            ADD CONSTRAINT profiles_role_check 
            CHECK (role IN ('user', 'validator', 'admin'));
    END IF;
END $$;
