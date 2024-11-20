-- Create applications table
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_title TEXT NOT NULL,
    role_type TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    resume_url TEXT,
    cover_letter TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected'))
);

-- Create index on email for faster lookups
CREATE INDEX applications_email_idx ON applications(email);

-- Create index on status for filtering
CREATE INDEX applications_status_idx ON applications(status);

-- Add row level security policies
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Policy for inserting applications (anyone can apply)
CREATE POLICY "Anyone can submit an application"
ON applications FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Policy for viewing applications (only admin can view)
CREATE POLICY "Only admin can view applications"
ON applications FOR SELECT
TO authenticated
USING (auth.role() = 'admin');
