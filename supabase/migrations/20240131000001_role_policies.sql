-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable role updates for admins" ON public.profiles;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.update_user_role(text, uuid);

-- Create policy for role updates
CREATE POLICY "Enable role updates for admins"
ON public.profiles
FOR UPDATE
USING (
    auth.uid() IN (
        SELECT id 
        FROM public.profiles 
        WHERE role = 'admin'
    )
)
WITH CHECK (
    auth.uid() IN (
        SELECT id 
        FROM public.profiles 
        WHERE role = 'admin'
    )
    AND 
    auth.uid() != id  -- Prevent self-role modification
);

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT UPDATE (role, updated_at) ON public.profiles TO authenticated;

-- Create function to handle role updates
CREATE OR REPLACE FUNCTION public.update_user_role(new_role text, user_id uuid)
RETURNS boolean AS $$
DECLARE
    admin_count integer;
    current_role text;
    calling_user_id uuid;
BEGIN
    -- Get the ID of the user making the request
    calling_user_id := auth.uid();
    
    IF calling_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Validate new_role
    IF new_role IS NULL OR new_role NOT IN ('admin', 'validator', 'user') THEN
        RAISE EXCEPTION 'Invalid role. Role must be one of: admin, validator, user. Got: %', new_role;
    END IF;

    -- Check if the user making the request is an admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = calling_user_id AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can update roles';
    END IF;

    -- Check if target user exists
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = user_id
    ) THEN
        RAISE EXCEPTION 'Target user not found';
    END IF;

    -- Prevent self-role modification
    IF user_id = calling_user_id THEN
        RAISE EXCEPTION 'Cannot modify own role';
    END IF;

    -- Get current role of the target user
    SELECT role INTO current_role 
    FROM public.profiles 
    WHERE id = user_id;

    -- If demoting an admin, check if they're the last admin
    IF current_role = 'admin' AND new_role != 'admin' THEN
        SELECT COUNT(*) INTO admin_count 
        FROM public.profiles 
        WHERE role = 'admin';
        
        IF admin_count <= 1 THEN
            RAISE EXCEPTION 'Cannot demote the last admin';
        END IF;
    END IF;

    -- Perform the update
    UPDATE public.profiles 
    SET 
        role = new_role,
        updated_at = NOW()
    WHERE id = user_id;

    -- Return true if a row was updated
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
