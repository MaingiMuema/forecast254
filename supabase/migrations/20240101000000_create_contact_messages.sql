-- Create contact messages table
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable public insert access" ON contact_messages;
DROP POLICY IF EXISTS "Enable admin select access" ON contact_messages;

-- Create a policy that allows anyone to insert messages
CREATE POLICY "contact_messages_insert_policy"
ON contact_messages
AS PERMISSIVE
FOR INSERT
TO PUBLIC
WITH CHECK (true);

-- Create a policy that allows admin to view messages
CREATE POLICY "contact_messages_select_policy"
ON contact_messages
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'email' = 'admin@forecast254.com');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_contact_messages_updated_at'
    ) THEN
        CREATE TRIGGER update_contact_messages_updated_at
            BEFORE UPDATE ON contact_messages
            FOR EACH ROW
            EXECUTE PROCEDURE update_updated_at_column();
    END IF;
END;
$$;
