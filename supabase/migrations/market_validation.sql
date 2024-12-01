-- Enable RLS on markets table if not already enabled
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable market validation for validators" ON public.markets;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.markets;
DROP POLICY IF EXISTS "Enable update for validators" ON public.markets;

-- Create policy for reading markets (all users can read)
CREATE POLICY "Enable read access for all users"
ON public.markets
FOR SELECT
USING (true);

-- Create policy for updating market status (only admins and validators)
CREATE POLICY "Enable update for validators"
ON public.markets
FOR UPDATE
USING (
    auth.uid() IN (
        SELECT id 
        FROM public.profiles 
        WHERE role IN ('admin', 'validator')
    )
)
WITH CHECK (
    auth.uid() IN (
        SELECT id 
        FROM public.profiles 
        WHERE role IN ('admin', 'validator')
    )
);
