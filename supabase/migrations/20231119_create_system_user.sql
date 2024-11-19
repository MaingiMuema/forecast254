-- Create system user in auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a87e2d22-0d10-4838-9bcd-3b6a74dd2922', -- This will be your SYSTEM_USER_ID
  'authenticated',
  'authenticated',
  'system@forecast254.com',
  '$2a$10$Q7QJGR3zF5q1RxvZf0GWX.0KN6.IoL3T6NfA7NqE4A4NlFXyPEFi2', -- Encrypted password, not accessible
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Create corresponding profile for system user
INSERT INTO public.profiles (
  id,
  username,
  email,
  avatar_url,
  balance,
  created_at,
  updated_at
) VALUES (
  'a87e2d22-0d10-4838-9bcd-3b6a74dd2922', -- Same as SYSTEM_USER_ID above
  'System',
  'system@forecast254.com',
  'https://api.dicebear.com/7.x/bottts/svg?seed=system',
  1000000, -- High balance for system operations
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Grant necessary permissions to system user
CREATE POLICY "System can create markets"
ON public.markets
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = 'a87e2d22-0d10-4838-9bcd-3b6a74dd2922');

CREATE POLICY "System can update markets"
ON public.markets
FOR UPDATE
TO authenticated
USING (auth.uid() = 'a87e2d22-0d10-4838-9bcd-3b6a74dd2922');
