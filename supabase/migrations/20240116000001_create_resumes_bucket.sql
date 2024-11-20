-- Create the resumes bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false);

-- Set up bucket configuration
ALTER TABLE storage.buckets
ADD COLUMN IF NOT EXISTS file_size_limit BIGINT,
ADD COLUMN IF NOT EXISTS allowed_mime_types TEXT[];

-- Update bucket configuration
UPDATE storage.buckets
SET file_size_limit = 5242880, -- 5MB in bytes
    allowed_mime_types = ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
WHERE id = 'resumes';

-- Allow authenticated users to upload files to the resumes bucket
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'resumes' AND
    auth.role() IN ('authenticated', 'anon')
);

-- Allow admin to read all resumes
CREATE POLICY "Allow admin to read resumes"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'resumes' AND
    auth.role() = 'admin'
);

-- Allow users to read their own resumes
CREATE POLICY "Allow users to read own resumes"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
);
