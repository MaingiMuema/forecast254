-- Create a function to sync email from auth.users to public.profiles
CREATE OR REPLACE FUNCTION public.sync_auth_email()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the email in profiles table when auth.users email changes
    UPDATE public.profiles
    SET 
        email = NEW.email,
        updated_at = NOW()
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS sync_auth_email_trigger ON auth.users;

-- Create a trigger to run the sync function after email updates in auth.users
CREATE TRIGGER sync_auth_email_trigger
    AFTER UPDATE OF email ON auth.users
    FOR EACH ROW
    WHEN (OLD.email IS DISTINCT FROM NEW.email)
    EXECUTE FUNCTION public.sync_auth_email();

-- Initial sync of all existing users
UPDATE public.profiles p
SET 
    email = u.email,
    updated_at = NOW()
FROM auth.users u
WHERE p.id = u.id
AND (p.email IS NULL OR p.email IS DISTINCT FROM u.email);
