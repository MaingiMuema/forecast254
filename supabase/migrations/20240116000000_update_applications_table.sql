-- Drop existing table if it exists
DROP TABLE IF EXISTS applications;

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

-- Policy for updating applications (only admin can update)
CREATE POLICY "Only admin can update applications"
ON applications FOR UPDATE
TO authenticated
USING (auth.role() = 'admin')
WITH CHECK (auth.role() = 'admin');

-- Add comments for better documentation
COMMENT ON TABLE applications IS 'Table storing job applications for Forecast254';
COMMENT ON COLUMN applications.id IS 'Unique identifier for each application';
COMMENT ON COLUMN applications.role_title IS 'Title of the role being applied for';
COMMENT ON COLUMN applications.role_type IS 'Type of role (e.g., full-time, part-time)';
COMMENT ON COLUMN applications.full_name IS 'Full name of the applicant';
COMMENT ON COLUMN applications.email IS 'Email address of the applicant';
COMMENT ON COLUMN applications.phone IS 'Phone number of the applicant';
COMMENT ON COLUMN applications.resume_url IS 'URL to the uploaded resume in storage';
COMMENT ON COLUMN applications.cover_letter IS 'Optional cover letter text';
COMMENT ON COLUMN applications.created_at IS 'Timestamp when the application was submitted';
COMMENT ON COLUMN applications.status IS 'Current status of the application';
