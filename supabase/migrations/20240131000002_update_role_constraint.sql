-- Drop existing role check constraint if it exists
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new role check constraint
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'validator', 'user'));

-- Update any existing invalid roles to 'user'
UPDATE public.profiles 
SET role = 'user' 
WHERE role NOT IN ('admin', 'validator', 'user');
